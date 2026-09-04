import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContractPreview from '@/features/sales/components/ContractPreview';
import Button from '@/design-system/components/Button';
import {
  derivarSecciones,
  type Align,
  type TipoModulo,
  type ContractConfig,
  type ModuloDisponible,
  type PaginaContrato,
  DEFAULT_CONTRACT_CONFIG,
} from '@/features/settings/services/contractConfigService';
import {
  getTemplate,
  saveTemplate,
  uploadTemplateLogo,
  deleteTemplateLogo,
  fetchTemplateLogoObjectUrl,
} from '@/features/settings/services/contractTemplateService';
import { logger } from '@/utils/logger';
import styles from './ContractSettingsPage.module.scss';

// ── Datos de ejemplo para el preview ─────────────────────────────────────────

const SAMPLE_CLIENT = {
  clientId: 'preview',
  firstName: 'Juan',
  lastName: 'Pérez García',
  dni: '12345678A',
  email: 'juan.perez@ejemplo.com',
  phones: ['612 345 678'],
  bankAccounts: ['ES91 2100 0418 4502 0005 1332'],
  address: {
    address: 'Calle Mayor 10, 28001 Madrid',
    cupsLuz: 'ES0021000012345678AB',
    cupsGas: '',
  },
};

const SAMPLE_ITEMS = [
  { productId: '1', name: 'Tarifa Luz Premium', quantity: 1, price: 45.99, tipo: 'unico' },
  { productId: '2', name: 'Mantenimiento Mensual', quantity: 1, price: 18.00, tipo: 'periodico', periodo: 'mensual' },
  { productId: '3', name: 'Gas Natural Variable', quantity: 1, price: 12.00, tipo: 'consumo', precioBase: 12.00, precioConsumo: 0.0850, unidadConsumo: 'm³' },
];

// ── Constantes de UI ──────────────────────────────────────────────────────────

const ALIGN_LABELS: Record<Align, string> = { left: 'Izq', center: 'Cen', right: 'Der' };

const TIPO_LABELS: Record<TipoModulo, string> = {
  identidad: 'Identidad',
  datos_cliente: 'Datos cliente',
  productos: 'Productos',
  firma: 'Firma',
  pie: 'Pie',
  texto: 'Texto libre',
};

const TIPO_COLORS: Record<TipoModulo, string> = {
  identidad: '#7c3aed',
  datos_cliente: '#0ea5e9',
  productos: '#059669',
  firma: '#d97706',
  pie: '#6b7280',
  texto: '#1d4ed8',
};

const TIPO_ICONS: Record<TipoModulo, string> = {
  identidad: '🏢',
  datos_cliente: '👤',
  productos: '📦',
  firma: '✍️',
  pie: '📋',
  texto: '📝',
};

const TIPOS_DISPONIBLES: { tipo: TipoModulo; label: string; desc: string }[] = [
  { tipo: 'texto',         label: 'Texto libre',      desc: 'Texto personalizado con variables y formato' },
  { tipo: 'identidad',     label: 'Encabezado',        desc: 'Nombre de empresa y título del contrato' },
  { tipo: 'datos_cliente', label: 'Datos del cliente', desc: 'Tabla con datos del cliente' },
  { tipo: 'productos',     label: 'Productos',          desc: 'Tabla de productos contratados' },
  { tipo: 'firma',         label: 'Firma',              desc: 'Bloque de firma del cliente' },
  { tipo: 'pie',           label: 'Pie de página',     desc: 'Nota legal al final' },
];

const VARIABLES = [
  { tag: '<<nombre>>', desc: 'Nombre del cliente' },
  { tag: '<<apellidos>>', desc: 'Apellidos del cliente' },
  { tag: '<<nombre_completo>>', desc: 'Nombre y apellidos' },
  { tag: '<<dni>>', desc: 'DNI/NIF' },
  { tag: '<<email>>', desc: 'Correo electrónico' },
  { tag: '<<telefono>>', desc: 'Teléfono principal' },
  { tag: '<<numero_cuenta>>', desc: 'Número de cuenta bancaria' },
  { tag: '<<direccion>>', desc: 'Dirección postal' },
  { tag: '<<cups_luz>>', desc: 'CUPS Electricidad' },
  { tag: '<<cups_gas>>', desc: 'CUPS Gas Natural' },
  { tag: '<<referencia>>', desc: 'Referencia del contrato' },
  { tag: '<<fecha>>', desc: 'Fecha del contrato' },
  { tag: '<<comercial>>', desc: 'Nombre del comercial' },
] as const;

// ── Subcomponentes ────────────────────────────────────────────────────────────

interface AlignSelectorProps { value: Align; onChange: (a: Align) => void; }
const AlignSelector = ({ value, onChange }: AlignSelectorProps) => (
  <div className={styles.alignSelector}>
    {(['left', 'center', 'right'] as Align[]).map((a) => (
      <button key={a} type="button"
        className={`${styles.alignBtn} ${value === a ? styles.alignBtnActive : ''}`}
        onClick={() => onChange(a)}
        title={a === 'left' ? 'Izquierda' : a === 'center' ? 'Centrado' : 'Derecha'}
      >{ALIGN_LABELS[a]}</button>
    ))}
  </div>
);

interface ToggleRowProps { label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode; }
const ToggleRow = ({ label, checked, onChange, children }: ToggleRowProps) => (
  <div className={styles.metaField}>
    <label className={styles.toggleLabel}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
    {checked && children}
  </div>
);

// ── Helpers para crear módulos por defecto ─────────────────────────────────────

function createDefaultModulo(tipo: TipoModulo, nombre: string): ModuloDisponible {
  const id = crypto.randomUUID();
  const base = { id, tipo, nombre, esDeServicio: false };
  switch (tipo) {
    case 'identidad':
      return { ...base, nombreEmpresa: '', tituloContrato: 'CONTRATO DE VENTA', tituloContratoAlign: 'center', mostrarReferencia: true, referenciaAlign: 'center', mostrarFecha: true, fechaAlign: 'center' };
    case 'datos_cliente':
      return { ...base };
    case 'productos':
      return { ...base, tituloSeccionProductos: 'PRODUCTOS CONTRATADOS', tituloSeccionProductosAlign: 'left', tablaUnicoColConcepto: 'Concepto', tablaUnicoColCantidad: 'Cant.', tablaUnicoColPrecioUnit: 'Precio unit.', tablaUnicoColTotal: 'Total', tablaPeriodoColConcepto: 'Concepto', tablaPeriodoColPeriodicidad: 'Periodicidad', tablaPeriodoColPrecio: 'Precio', tablaConsumoColConcepto: 'Concepto', tablaConsumoColPrecioBase: 'Precio base', tablaConsumoColPrecioConsumo: '€/unidad', tablaConsumoColUnidad: 'Unidad' };
    case 'firma':
      return { ...base, firmaSeccionTitulo: 'FIRMA DEL CLIENTE', firmaSeccionTituloAlign: 'left', firmaNota: 'El firmante acepta las condiciones de este contrato.', firmaNotaAlign: 'left', mostrarEmailFirma: true, firmaEtiqueta: 'Firma del cliente' };
    case 'pie':
      return { ...base, textoPie: 'Documento generado electrónicamente.', textoPieAlign: 'center' };
    case 'texto':
    default:
      return { ...base, titulo: '', contenido: '', align: 'left' };
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

const ContractSettingsPage = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<ContractConfig>({ ...DEFAULT_CONTRACT_CONFIG });
  const [templateName, setTemplateName] = useState('');
  const [esDefecto, setEsDefecto] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal: crear/editar módulo en la librería
  const [moduloModal, setModuloModal] = useState<{
    mode: 'create' | 'edit';
    index: number; // -1 si create
    modulo: ModuloDisponible;
  } | null>(null);

  // Modal: seleccionar módulo para añadir a una página
  const [addToPageModal, setAddToPageModal] = useState<{ pageId: string } | null>(null);

  // Overflow state: pages that exceed A4 height in the preview
  const [overflowingPages, setOverflowingPages] = useState<Set<number>>(new Set());
  const handlePageOverflowChange = useCallback((pageIndex: number, overflows: boolean) => {
    setOverflowingPages((prev) => {
      const next = new Set(prev);
      if (overflows) next.add(pageIndex); else next.delete(pageIndex);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!templateId) {
      navigate('/settings/contract');
      return;
    }
    let blobUrl: string | null = null;
    getTemplate(templateId)
      .then(async (data) => {
        setConfig(data);
        setTemplateName(data.nombre);
        setEsDefecto(data.esDefecto);
        // Si el nombre es el genérico, seleccionarlo para que el usuario lo cambie fácilmente
        if (data.nombre === 'Nueva plantilla') {
          setTimeout(() => { nameInputRef.current?.focus(); nameInputRef.current?.select(); }, 100);
        }
        if (data.logoUrl) {
          try {
            blobUrl = await fetchTemplateLogoObjectUrl(templateId);
            setLogoPreviewUrl(blobUrl);
          } catch { /* sin logo */ }
        }
      })
      .catch(() => setError('No se pudo cargar la plantilla'))
      .finally(() => setLoading(false));
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [templateId]);

  // ── Guardar ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!templateId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const seccionesContrato = derivarSecciones(config.modulos, config.paginas);
      const saved = await saveTemplate(templateId, {
        nombre: templateName,
        esDefecto,
        logoAlign: config.logoAlign,
        logoEnPaginasExtra: config.logoEnPaginasExtra,
        modulos: config.modulos,
        paginas: config.paginas,
        seccionesContrato,
        paginasExtra: config.paginasExtra,
      });
      setConfig((prev) => ({ ...prev, ...saved }));
      setTemplateName(saved.nombre);
      setEsDefecto(saved.esDefecto);
      setSuccessMsg('Plantilla guardada correctamente');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      logger.error('Error guardando plantilla', err as Error);
      setError('Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  // ── Logo ───────────────────────────────────────────────────────────────────

  const handleLogoFile = async (file: File) => {
    if (!templateId) return;
    setUploadingLogo(true);
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(localUrl);
    try {
      await uploadTemplateLogo(templateId, file);
    } catch (err) {
      logger.error('Error subiendo logo', err as Error);
      setError('Error al subir el logo');
      URL.revokeObjectURL(localUrl);
      setLogoPreviewUrl(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!templateId) return;
    if (!window.confirm('¿Eliminar el logo de esta plantilla?')) return;
    try {
      await deleteTemplateLogo(templateId);
      setLogoPreviewUrl(null);
      setConfig((prev) => ({ ...prev, logoPath: null, logoUrl: null }));
    } catch (err) {
      logger.error('Error eliminando logo', err as Error);
      setError('Error al eliminar el logo');
    }
  };

  // ── Módulos — librería ─────────────────────────────────────────────────────

  const openAddModulo = () => {
    setModuloModal({
      mode: 'create',
      index: -1,
      modulo: createDefaultModulo('texto', 'Nuevo módulo'),
    });
  };

  const openEditModulo = (index: number) => {
    setModuloModal({
      mode: 'edit',
      index,
      modulo: { ...config.modulos[index] },
    });
  };

  const saveModuloModal = () => {
    if (!moduloModal) return;
    if (moduloModal.mode === 'create') {
      setConfig((prev) => ({ ...prev, modulos: [...prev.modulos, moduloModal.modulo] }));
    } else {
      setConfig((prev) => {
        const arr = [...prev.modulos];
        arr[moduloModal.index] = moduloModal.modulo;
        return { ...prev, modulos: arr };
      });
    }
    setModuloModal(null);
  };

  const deleteModulo = (index: number) => {
    const m = config.modulos[index];
    if (m.esDeServicio) return;
    if (!window.confirm(`¿Eliminar el módulo "${m.nombre}"? Se quitará de todas las páginas.`)) return;
    setConfig((prev) => ({
      ...prev,
      modulos: prev.modulos.filter((_, i) => i !== index),
      paginas: prev.paginas.map((p) => ({
        ...p,
        modulosIds: p.modulosIds.filter((id) => id !== m.id),
      })),
    }));
  };

  const updateModuloModal = (patch: Partial<ModuloDisponible>) => {
    setModuloModal((m) => m ? { ...m, modulo: { ...m.modulo, ...patch } } : null);
  };

  const changeModuloTipo = (tipo: TipoModulo) => {
    if (!moduloModal) return;
    const nombre = moduloModal.modulo.nombre || TIPO_LABELS[tipo];
    const fresh = createDefaultModulo(tipo, nombre);
    fresh.id = moduloModal.modulo.id;
    setModuloModal((m) => m ? { ...m, modulo: fresh } : null);
  };

  // ── Páginas ────────────────────────────────────────────────────────────────

  const addPagina = () => {
    const newPage: PaginaContrato = {
      id: crypto.randomUUID(),
      titulo: `Página ${config.paginas.length + 1}`,
      modulosIds: [],
    };
    setConfig((prev) => ({ ...prev, paginas: [...prev.paginas, newPage] }));
  };

  const updatePaginaTitulo = (pageIndex: number, titulo: string) => {
    setConfig((prev) => {
      const arr = [...prev.paginas];
      arr[pageIndex] = { ...arr[pageIndex], titulo };
      return { ...prev, paginas: arr };
    });
  };

  const deletePagina = (pageIndex: number) => {
    if (!window.confirm(`¿Eliminar la página "${config.paginas[pageIndex].titulo}"?`)) return;
    setConfig((prev) => ({
      ...prev,
      paginas: prev.paginas.filter((_, i) => i !== pageIndex),
    }));
  };

  // ── Módulos dentro de una página ───────────────────────────────────────────

  const addModuloToPagina = (pageId: string, moduloId: string) => {
    setConfig((prev) => ({
      ...prev,
      paginas: prev.paginas.map((p) =>
        p.id === pageId ? { ...p, modulosIds: [...p.modulosIds, moduloId] } : p
      ),
    }));
    setAddToPageModal(null);
  };

  const removeModuloFromPagina = (pageIndex: number, modIndex: number) => {
    setConfig((prev) => {
      const arr = [...prev.paginas];
      const ids = [...arr[pageIndex].modulosIds];
      ids.splice(modIndex, 1);
      arr[pageIndex] = { ...arr[pageIndex], modulosIds: ids };
      return { ...prev, paginas: arr };
    });
  };

  const moveModuloInPagina = (pageIndex: number, modIndex: number, dir: -1 | 1) => {
    setConfig((prev) => {
      const arr = [...prev.paginas];
      const ids = [...arr[pageIndex].modulosIds];
      const targetIndex = modIndex + dir;
      if (targetIndex < 0 || targetIndex >= ids.length) return prev;
      [ids[modIndex], ids[targetIndex]] = [ids[targetIndex], ids[modIndex]];
      arr[pageIndex] = { ...arr[pageIndex], modulosIds: ids };
      return { ...prev, paginas: arr };
    });
  };

  // ── Insert variable en textarea ────────────────────────────────────────────

  const insertVariable = (tag: string) => {
    const el = textareaRef.current;
    if (!el) { updateModuloModal({ contenido: (moduloModal?.modulo.contenido || '') + tag }); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = el.value.slice(0, start) + tag + el.value.slice(end);
    const newCursor = start + tag.length;
    updateModuloModal({ contenido: newVal });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(newCursor, newCursor); });
  };

  // ── Leyenda de formato ─────────────────────────────────────────────────────

  const renderFormatLegend = () => (
    <div className={styles.variablesLegend}>
      <p className={styles.variablesTitle}>Variables — clic para insertar en el cursor:</p>
      <div className={styles.variableChips}>
        {VARIABLES.map((v) => (
          <button key={v.tag} type="button" className={styles.variableChip} onClick={() => insertVariable(v.tag)} title={v.desc}>
            {v.tag}
          </button>
        ))}
      </div>
      <p className={styles.variablesTitle} style={{ marginTop: '0.6rem' }}>Formato:</p>
      <div className={styles.variableChips}>
        <span className={styles.formatHint}><code>**texto**</code> → <strong>negrita</strong></span>
        <span className={styles.formatHint}><code># Título</code> → título grande</span>
        <span className={styles.formatHint}><code>## Subtítulo</code> → subtítulo</span>
        <span className={styles.formatHint}>Enter → salto de línea</span>
      </div>
    </div>
  );

  // ── Formulario del modal según tipo ───────────────────────────────────────

  const renderModuloForm = () => {
    if (!moduloModal) return null;
    const m = moduloModal.modulo;
    const upd = updateModuloModal;

    if (m.tipo === 'identidad') return (
      <>
        <label className={styles.label}>
          <span className={styles.labelRow}>Nombre de empresa<AlignSelector value={m.nombreEmpresaAlign ?? 'center'} onChange={(a) => upd({ nombreEmpresaAlign: a })} /></span>
          <input type="text" className={styles.input} placeholder="Ej: Energía Total S.L." value={m.nombreEmpresa ?? ''} onChange={(e) => upd({ nombreEmpresa: e.target.value })} />
        </label>
        <label className={styles.label}>
          <span className={styles.labelRow}>Título del contrato<AlignSelector value={m.tituloContratoAlign ?? 'center'} onChange={(a) => upd({ tituloContratoAlign: a })} /></span>
          <input type="text" className={styles.input} placeholder="CONTRATO DE VENTA" value={m.tituloContrato ?? ''} onChange={(e) => upd({ tituloContrato: e.target.value })} />
        </label>
        <ToggleRow label="Mostrar referencia del contrato" checked={m.mostrarReferencia ?? true} onChange={(v) => upd({ mostrarReferencia: v })}>
          <AlignSelector value={m.referenciaAlign ?? 'center'} onChange={(a) => upd({ referenciaAlign: a })} />
        </ToggleRow>
        <ToggleRow label="Mostrar fecha" checked={m.mostrarFecha ?? true} onChange={(v) => upd({ mostrarFecha: v })}>
          <AlignSelector value={m.fechaAlign ?? 'center'} onChange={(a) => upd({ fechaAlign: a })} />
        </ToggleRow>
      </>
    );

    if (m.tipo === 'datos_cliente') return (
      <>
        <label className={styles.label}>
          Título de la sección <span className={styles.hint}>(vacío = "DATOS DEL CLIENTE")</span>
          <input type="text" className={styles.input} placeholder="DATOS DEL CLIENTE" value={m.titulo ?? ''} onChange={(e) => upd({ titulo: e.target.value })} />
        </label>
        <label className={styles.label}>
          <span className={styles.labelRow}>
            Contenido personalizado <span className={styles.hint}>(vacío = tabla automática)</span>
            <AlignSelector value={m.align ?? 'left'} onChange={(a) => upd({ align: a })} />
          </span>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            rows={8}
            placeholder={'Dejar vacío para tabla automática.\nO usa variables:\n\n**Nombre:** <<nombre_completo>>\n**DNI:** <<dni>>'}
            value={m.contenido ?? ''}
            onChange={(e) => upd({ contenido: e.target.value })}
          />
        </label>
        {!m.contenido && (
          <div className={styles.camposClienteGrid}>
            <p className={styles.subSectionLabel}>Campos visibles en la tabla automática:</p>
            {([
              ['mostrarNombre', 'Nombre completo'],
              ['mostrarDni', 'DNI/NIF'],
              ['mostrarEmail', 'Email'],
              ['mostrarTelefono', 'Teléfono'],
              ['mostrarNumeroCuenta', 'Número de cuenta'],
              ['mostrarDireccion', 'Dirección'],
              ['mostrarCupsLuz', 'CUPS Luz'],
              ['mostrarCupsGas', 'CUPS Gas'],
            ] as const).map(([field, label]) => (
              <label key={field} className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={(m[field] as boolean | undefined) !== false}
                  onChange={(e) => upd({ [field]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>
        )}
        {renderFormatLegend()}
      </>
    );

    if (m.tipo === 'productos') return (
      <>
        <label className={styles.label}>
          <span className={styles.labelRow}>Título de la sección<AlignSelector value={m.tituloSeccionProductosAlign ?? 'left'} onChange={(a) => upd({ tituloSeccionProductosAlign: a })} /></span>
          <input type="text" className={styles.input} placeholder="PRODUCTOS CONTRATADOS" value={m.tituloSeccionProductos ?? ''} onChange={(e) => upd({ tituloSeccionProductos: e.target.value })} />
        </label>

        {/* Opciones de totales */}
        <p className={styles.subSectionLabel}>Totales</p>
        <div className={styles.metaField}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={m.mostrarColumnaTotalUnico !== false}
              onChange={(e) => upd({ mostrarColumnaTotalUnico: e.target.checked })}
            />
            Mostrar columna "Total" en productos de precio fijo
          </label>
        </div>
        <div className={styles.metaField}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={m.mostrarTotalGeneral !== false}
              onChange={(e) => upd({ mostrarTotalGeneral: e.target.checked })}
            />
            Mostrar importe total al final de la sección
            <span className={styles.hint} style={{ display: 'inline', marginLeft: '0.4rem' }}>
              (desactivar para contratos, activar para facturas)
            </span>
          </label>
        </div>

        <p className={styles.subSectionLabel}>Precio fijo (pago único)</p>
        <label className={styles.label}>Subtítulo <input type="text" className={styles.input} placeholder="(vacío = sin subtítulo)" value={m.tablaUnicoTitulo ?? ''} onChange={(e) => upd({ tablaUnicoTitulo: e.target.value })} /></label>
        <div className={styles.colGrid}>
          <label className={styles.label}>Concepto<input type="text" className={styles.input} value={m.tablaUnicoColConcepto ?? 'Concepto'} onChange={(e) => upd({ tablaUnicoColConcepto: e.target.value })} /></label>
          <label className={styles.label}>Cantidad<input type="text" className={styles.input} value={m.tablaUnicoColCantidad ?? 'Cant.'} onChange={(e) => upd({ tablaUnicoColCantidad: e.target.value })} /></label>
          <label className={styles.label}>Precio unit.<input type="text" className={styles.input} value={m.tablaUnicoColPrecioUnit ?? 'Precio unit.'} onChange={(e) => upd({ tablaUnicoColPrecioUnit: e.target.value })} /></label>
          {m.mostrarColumnaTotalUnico !== false && (
            <label className={styles.label}>Total<input type="text" className={styles.input} value={m.tablaUnicoColTotal ?? 'Total'} onChange={(e) => upd({ tablaUnicoColTotal: e.target.value })} /></label>
          )}
        </div>
        <p className={styles.subSectionLabel}>Periódico (cuota recurrente)</p>
        <label className={styles.label}>Subtítulo<input type="text" className={styles.input} placeholder="(vacío = sin subtítulo)" value={m.tablaPeriodoTitulo ?? ''} onChange={(e) => upd({ tablaPeriodoTitulo: e.target.value })} /></label>
        <div className={styles.colGrid}>
          <label className={styles.label}>Concepto<input type="text" className={styles.input} value={m.tablaPeriodoColConcepto ?? 'Concepto'} onChange={(e) => upd({ tablaPeriodoColConcepto: e.target.value })} /></label>
          <label className={styles.label}>Periodicidad<input type="text" className={styles.input} value={m.tablaPeriodoColPeriodicidad ?? 'Periodicidad'} onChange={(e) => upd({ tablaPeriodoColPeriodicidad: e.target.value })} /></label>
          <label className={styles.label}>Precio<input type="text" className={styles.input} value={m.tablaPeriodoColPrecio ?? 'Precio'} onChange={(e) => upd({ tablaPeriodoColPrecio: e.target.value })} /></label>
        </div>
        <p className={styles.subSectionLabel}>Por consumo (tarifa variable)</p>
        <label className={styles.label}>Subtítulo<input type="text" className={styles.input} placeholder="(vacío = sin subtítulo)" value={m.tablaConsumoTitulo ?? ''} onChange={(e) => upd({ tablaConsumoTitulo: e.target.value })} /></label>
        <div className={styles.colGrid}>
          <label className={styles.label}>Concepto<input type="text" className={styles.input} value={m.tablaConsumoColConcepto ?? 'Concepto'} onChange={(e) => upd({ tablaConsumoColConcepto: e.target.value })} /></label>
          <label className={styles.label}>Precio base<input type="text" className={styles.input} value={m.tablaConsumoColPrecioBase ?? 'Precio base'} onChange={(e) => upd({ tablaConsumoColPrecioBase: e.target.value })} /></label>
          <label className={styles.label}>€/unidad<input type="text" className={styles.input} value={m.tablaConsumoColPrecioConsumo ?? '€/unidad'} onChange={(e) => upd({ tablaConsumoColPrecioConsumo: e.target.value })} /></label>
          <label className={styles.label}>Unidad<input type="text" className={styles.input} value={m.tablaConsumoColUnidad ?? 'Unidad'} onChange={(e) => upd({ tablaConsumoColUnidad: e.target.value })} /></label>
        </div>
      </>
    );

    if (m.tipo === 'firma') return (
      <>
        <label className={styles.label}>
          <span className={styles.labelRow}>Título de la sección<AlignSelector value={m.firmaSeccionTituloAlign ?? 'left'} onChange={(a) => upd({ firmaSeccionTituloAlign: a })} /></span>
          <input type="text" className={styles.input} placeholder="FIRMA DEL CLIENTE" value={m.firmaSeccionTitulo ?? ''} onChange={(e) => upd({ firmaSeccionTitulo: e.target.value })} />
        </label>
        <label className={styles.label}>
          <span className={styles.labelRow}>Nota del firmante<AlignSelector value={m.firmaNotaAlign ?? 'left'} onChange={(a) => upd({ firmaNotaAlign: a })} /></span>
          <textarea className={styles.textarea} rows={3} placeholder="El firmante acepta las condiciones..." value={m.firmaNota ?? ''} onChange={(e) => upd({ firmaNota: e.target.value })} />
        </label>
        <div className={styles.metaField}>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={m.mostrarEmailFirma ?? true} onChange={(e) => upd({ mostrarEmailFirma: e.target.checked })} />
            Mostrar email del destinatario
          </label>
        </div>
        <label className={styles.label}>
          Etiqueta bajo la línea de firma
          <input type="text" className={styles.input} placeholder="Firma del cliente" value={m.firmaEtiqueta ?? ''} onChange={(e) => upd({ firmaEtiqueta: e.target.value })} />
        </label>
      </>
    );

    if (m.tipo === 'pie') return (
      <label className={styles.label}>
        <span className={styles.labelRow}>Texto del pie<AlignSelector value={m.textoPieAlign ?? 'center'} onChange={(a) => upd({ textoPieAlign: a })} /></span>
        <textarea className={styles.textarea} rows={3} value={m.textoPie ?? ''} onChange={(e) => upd({ textoPie: e.target.value })} />
      </label>
    );

    // tipo === 'texto'
    return (
      <>
        <label className={styles.label}>
          Título de la sección
          <input type="text" className={styles.input} placeholder="Ej: CLÁUSULAS Y CONDICIONES" value={m.titulo ?? ''} onChange={(e) => upd({ titulo: e.target.value })} />
        </label>
        <label className={styles.label}>
          <span className={styles.labelRow}>Contenido<AlignSelector value={m.align ?? 'left'} onChange={(a) => upd({ align: a })} /></span>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            rows={12}
            placeholder="Escribe el contenido. Usa variables como <<nombre_completo>>, **negrita**, # Título."
            value={m.contenido ?? ''}
            onChange={(e) => upd({ contenido: e.target.value })}
          />
        </label>
        {renderFormatLegend()}
      </>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className={styles.page}><p className={styles.loadingText}>Cargando configuración...</p></div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/settings/contract')}>← Plantillas</button>
        </div>
        <div className={styles.topBarRight}>
          {successMsg && <span className={styles.successMsg}>{successMsg}</span>}
          {error && <span className={styles.errorMsg}>{error}</span>}
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── EDITOR ──────────────────────────────────────────────── */}
        <div className={styles.editor}>

          {/* NOMBRE DE LA PLANTILLA */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Nombre de la plantilla</h2>
            <input
              ref={nameInputRef}
              type="text"
              className={styles.templateNameInput}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej: Contrato luz residencial"
              aria-label="Nombre de la plantilla"
              maxLength={80}
            />
            <label className={styles.defaultToggleLabel}>
              <input
                type="checkbox"
                checked={esDefecto}
                onChange={(e) => setEsDefecto(e.target.checked)}
              />
              Plantilla por defecto
            </label>
          </section>

          {/* LOGO */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Logo de empresa</h2>
            {logoPreviewUrl ? (
              <div className={styles.logoRow}>
                <img src={logoPreviewUrl} alt="Logo actual" className={styles.logoPreview} />
                <button type="button" className={styles.deleteLogo} onClick={handleDeleteLogo} disabled={uploadingLogo}>Eliminar</button>
              </div>
            ) : (
              <p className={styles.noLogo}>Sin logo configurado</p>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoFile(file); e.target.value = ''; }}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
              {uploadingLogo ? 'Subiendo...' : logoPreviewUrl ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            <p className={styles.hint}>PNG, JPG, WebP o SVG · máx. 5 MB</p>
            <div className={styles.alignRow}>
              <span className={styles.alignLabel}>Alineación del logo</span>
              <AlignSelector value={config.logoAlign} onChange={(a) => setConfig((p) => ({ ...p, logoAlign: a }))} />
            </div>
            <div className={styles.metaField}>
              <label className={styles.toggleLabel}>
                <input type="checkbox" checked={config.logoEnPaginasExtra}
                  onChange={(e) => setConfig((p) => ({ ...p, logoEnPaginasExtra: e.target.checked }))} />
                Mostrar logo en páginas adicionales
              </label>
            </div>
          </section>

          {/* ── MÓDULOS DISPONIBLES ────────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Módulos disponibles</h2>
              <Button variant="secondary" onClick={openAddModulo}>+ Añadir módulo</Button>
            </div>
            <p className={styles.hint}>
              Los módulos de sistema <span className={styles.lockInline}>🔒</span> no se pueden eliminar.
              Los módulos personalizados se pueden editar y eliminar.
            </p>

            <div className={styles.moduleLibrary}>
              {config.modulos.map((modulo, i) => (
                <div key={modulo.id} className={`${styles.moduleLibraryItem} ${modulo.oculta ? styles.moduleLibraryItemHidden : ''}`}>
                  <span
                    className={styles.tipoBadge}
                    style={{ background: TIPO_COLORS[modulo.tipo] + '18', color: TIPO_COLORS[modulo.tipo], borderColor: TIPO_COLORS[modulo.tipo] + '40' }}
                  >
                    {TIPO_ICONS[modulo.tipo]} {TIPO_LABELS[modulo.tipo]}
                  </span>
                  <span className={styles.moduleLibraryName}>
                    {modulo.esDeServicio && <span className={styles.lockIcon} title="Módulo de sistema">🔒</span>}
                    {modulo.nombre}
                  </span>
                  <div className={styles.moduleLibraryActions}>
                    <button
                      type="button"
                      className={`${styles.editBtn} ${modulo.oculta ? styles.editBtnDimmed : ''}`}
                      onClick={() => setConfig((prev) => {
                        const arr = [...prev.modulos];
                        arr[i] = { ...arr[i], oculta: !arr[i].oculta };
                        return { ...prev, modulos: arr };
                      })}
                      title={modulo.oculta ? 'Mostrar módulo' : 'Ocultar módulo'}
                    >
                      {modulo.oculta ? '🚫' : '👁'}
                    </button>
                    <button type="button" className={styles.editBtn} onClick={() => openEditModulo(i)}>
                      Editar
                    </button>
                    {!modulo.esDeServicio && (
                      <button type="button" className={styles.deleteBtn} onClick={() => deleteModulo(i)}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── PÁGINAS DEL CONTRATO ───────────────────────────────── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Páginas del contrato</h2>
              <Button variant="secondary" onClick={addPagina}>+ Añadir página</Button>
            </div>
            <p className={styles.hint}>Cada página se renderiza como una hoja A4. Añade módulos de la librería y ordénalos con las flechas.</p>

            <div className={styles.paginasList}>
              {config.paginas.map((pagina, pageIndex) => (
                <div key={pagina.id} className={styles.paginaSection}>
                  <div className={styles.paginaHeader}>
                    <span className={styles.paginaNumero}>Pág. {pageIndex + 1}</span>
                    <input
                      type="text"
                      className={styles.paginaTituloInput}
                      value={pagina.titulo}
                      onChange={(e) => updatePaginaTitulo(pageIndex, e.target.value)}
                      placeholder="Nombre de la página..."
                    />
                    {config.paginas.length > 1 && (
                      <button
                        type="button"
                        className={styles.deletePaginaBtn}
                        onClick={() => deletePagina(pageIndex)}
                        title="Eliminar esta página"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className={styles.paginaModulosList}>
                    {pagina.modulosIds.length === 0 ? (
                      <p className={styles.paginaEmpty}>Sin módulos. Añade uno desde la librería.</p>
                    ) : (
                      pagina.modulosIds.map((moduloId, modIndex) => {
                        const modulo = config.modulos.find((m) => m.id === moduloId);
                        if (!modulo) return null;
                        return (
                          <div key={`${moduloId}-${modIndex}`} className={styles.paginaModuloItem}>
                            <span
                              className={styles.tipoBadge}
                              style={{ background: TIPO_COLORS[modulo.tipo] + '18', color: TIPO_COLORS[modulo.tipo], borderColor: TIPO_COLORS[modulo.tipo] + '40' }}
                            >
                              {TIPO_ICONS[modulo.tipo]}
                            </span>
                            <span className={styles.paginaModuloName}>{modulo.nombre}</span>
                            {modulo.oculta && (
                              <span className={styles.ocultoWarning} title="Este módulo está oculto en la librería">🚫</span>
                            )}
                            <div className={styles.paginaModuloActions}>
                              <button
                                type="button"
                                className={styles.arrowBtn}
                                onClick={() => moveModuloInPagina(pageIndex, modIndex, -1)}
                                disabled={modIndex === 0}
                                title="Subir"
                              >↑</button>
                              <button
                                type="button"
                                className={styles.arrowBtn}
                                onClick={() => moveModuloInPagina(pageIndex, modIndex, 1)}
                                disabled={modIndex === pagina.modulosIds.length - 1}
                                title="Bajar"
                              >↓</button>
                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => removeModuloFromPagina(pageIndex, modIndex)}
                                title="Quitar de esta página"
                              >✕</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.addModuleToPaginaBtn}
                    onClick={() => setAddToPageModal({ pageId: pagina.id })}
                    disabled={overflowingPages.has(pageIndex)}
                    title={overflowingPages.has(pageIndex) ? 'Esta página está llena. Crea una nueva página para añadir más módulos.' : undefined}
                  >
                    {overflowingPages.has(pageIndex) ? '⚠️ Página llena' : '+ Añadir módulo a esta página'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── PREVIEW ─────────────────────────────────────────────── */}
        <div className={styles.preview}>
          <div className={styles.previewScroll}>
            <ContractPreview
              clientData={SAMPLE_CLIENT}
              items={SAMPLE_ITEMS}
              comercial="Comercial Ejemplo"
              signerEmail="juan.perez@ejemplo.com"
              contractConfig={config}
              logoUrl={logoPreviewUrl ?? undefined}
              onPageOverflowChange={handlePageOverflowChange}
            />
          </div>
        </div>
      </div>

      {/* ── MODAL: CREAR / EDITAR MÓDULO ───────────────────────────────── */}
      {moduloModal && (
        <div className={styles.modalOverlay} onClick={() => setModuloModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {moduloModal.mode === 'create' ? 'Nuevo módulo' : `Editar módulo: ${moduloModal.modulo.nombre}`}
            </h3>

            <div className={styles.modalScrollContent}>
              {/* Nombre del módulo */}
              <label className={styles.label}>
                Nombre del módulo
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Cláusulas y condiciones"
                  value={moduloModal.modulo.nombre}
                  autoFocus
                  onChange={(e) => updateModuloModal({ nombre: e.target.value })}
                />
              </label>

              {/* Selector de tipo — solo al crear */}
              {moduloModal.mode === 'create' && (
                <>
                  <p className={styles.subSectionLabel}>Tipo de módulo</p>
                  <div className={styles.tipoGrid}>
                    {TIPOS_DISPONIBLES.map(({ tipo, label, desc }) => (
                      <button
                        key={tipo}
                        type="button"
                        className={`${styles.tipoCard} ${moduloModal.modulo.tipo === tipo ? styles.tipoCardActive : ''}`}
                        onClick={() => changeModuloTipo(tipo)}
                      >
                        <span className={styles.tipoCardIcon}>{TIPO_ICONS[tipo]}</span>
                        <span className={styles.tipoCardLabel}>{label}</span>
                        <span className={styles.tipoCardDesc}>{desc}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Badge de tipo — solo al editar (fijo) */}
              {moduloModal.mode === 'edit' && (
                <div style={{ marginBottom: '1rem' }}>
                  <span
                    className={styles.tipoBadge}
                    style={{ background: TIPO_COLORS[moduloModal.modulo.tipo] + '18', color: TIPO_COLORS[moduloModal.modulo.tipo], borderColor: TIPO_COLORS[moduloModal.modulo.tipo] + '40' }}
                  >
                    {TIPO_ICONS[moduloModal.modulo.tipo]} {TIPO_LABELS[moduloModal.modulo.tipo]}
                  </span>
                </div>
              )}

              {/* Formulario específico del tipo */}
              <div className={styles.moduloFormSeparator} />
              {renderModuloForm()}
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setModuloModal(null)}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={saveModuloModal}
                disabled={!moduloModal.modulo.nombre.trim()}
              >
                {moduloModal.mode === 'create' ? 'Añadir módulo' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AÑADIR MÓDULO A PÁGINA ──────────────────────────────── */}
      {addToPageModal && (
        <div className={styles.modalOverlay} onClick={() => setAddToPageModal(null)}>
          <div className={styles.modalNarrow} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Añadir módulo a la página</h3>
            <p className={styles.hint} style={{ marginBottom: '1rem' }}>
              Selecciona un módulo de la librería para añadirlo a esta página.
              Puedes añadir el mismo módulo varias veces si lo deseas.
            </p>

            <div className={styles.addModuloList}>
              {config.modulos.map((modulo) => (
                <button
                  key={modulo.id}
                  type="button"
                  className={styles.addModuloOption}
                  onClick={() => addModuloToPagina(addToPageModal.pageId, modulo.id)}
                >
                  <span
                    className={styles.tipoBadge}
                    style={{ background: TIPO_COLORS[modulo.tipo] + '18', color: TIPO_COLORS[modulo.tipo], borderColor: TIPO_COLORS[modulo.tipo] + '40' }}
                  >
                    {TIPO_ICONS[modulo.tipo]} {TIPO_LABELS[modulo.tipo]}
                  </span>
                  <span className={styles.addModuloOptionName}>{modulo.nombre}</span>
                  {modulo.oculta && <span className={styles.ocultoWarning}>🚫 oculto</span>}
                </button>
              ))}
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setAddToPageModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSettingsPage;
