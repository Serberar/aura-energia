/**
 * Vista previa HTML del contrato que se enviará al cliente.
 * Replica la estructura del PDF generado por PdfGenerator en el backend.
 * Las secciones salto_pagina dividen el contenido en páginas A4 visuales.
 */

import { useRef, useState, useEffect } from 'react';
import type { ClientFormData } from './ClientSearchForm';
import type { CreateSaleItemData } from '@/types/sales';
import type { ContractConfig, SeccionContrato, ModuloDisponible } from '@/features/settings/services/contractConfigService';
import { DEFAULT_SECCIONES } from '@/features/settings/services/contractConfigService';
import styles from './ContractPreview.module.scss';

// ── A4 page wrapper con detección de desbordamiento ───────────────────────────

interface A4PageWrapperProps {
  children: React.ReactNode;
  pageIndex?: number;
  onOverflowChange?: (pageIndex: number, overflows: boolean) => void;
}

const A4PageWrapper = ({ children, pageIndex = 0, onOverflowChange }: A4PageWrapperProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  // Keep callback ref stable so effect doesn't re-run on every render
  const callbackRef = useRef(onOverflowChange);
  useEffect(() => { callbackRef.current = onOverflowChange; });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const check = () => {
      // outer has fixed height 960px with overflow:hidden; scrollHeight reflects real content height
      const newOv = outer.scrollHeight > outer.clientHeight + 4;
      setOverflows((prev) => {
        if (prev !== newOv) callbackRef.current?.(pageIndex, newOv);
        return newOv;
      });
    };
    check();
    // Observe the inner content div — it grows when content is added, triggering the callback
    const obs = new ResizeObserver(check);
    obs.observe(inner);
    return () => obs.disconnect();
  }, [pageIndex]);

  return (
    <div className={styles.a4PageOuter}>
      <div ref={outerRef} className={styles.a4Page}>
        <div ref={innerRef}>{children}</div>
      </div>
      {overflows && (
        <div className={styles.overflowWarning}>
          ⚠️ El contenido supera el límite de la página A4. Añade una nueva página para el resto de módulos.
        </div>
      )}
    </div>
  );
};

interface ContractPreviewProps {
  clientData: ClientFormData;
  items: CreateSaleItemData[];
  comercial: string;
  signerEmail: string;
  contractConfig?: ContractConfig;
  logoUrl?: string;
  onPageOverflowChange?: (pageIndex: number, overflows: boolean) => void;
}

// ── Helpers de texto ─────────────────────────────────────────────────────────

/** Sustituye <<variable>> por el valor correspondiente del mapa */
function interpolate(text: string, data: Record<string, string>): string {
  if (!text) return text;
  return text.replace(/<<([^>]+)>>/g, (_, key: string) => data[key] ?? `<<${key}>>`);
}

/**
 * Renderiza texto con soporte para:
 *   # Título grande   → h3
 *   ## Título mediano → h4
 *   **negrita**       → <strong>
 *   Saltos de línea   → <br>
 */
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, li) => {
    if (line.startsWith('## ')) {
      return <h4 key={li} style={{ margin: '0.4em 0', fontSize: '0.95em' }}>{line.slice(3)}</h4>;
    }
    if (line.startsWith('# ')) {
      return <h3 key={li} style={{ margin: '0.5em 0', fontSize: '1.1em' }}>{line.slice(2)}</h3>;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li}>
        {parts.map((part, pi) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={pi}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={pi}>{part}</span>
          )
        )}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ── Componente ───────────────────────────────────────────────────────────────

const ContractPreview = ({
  clientData,
  items,
  comercial,
  signerEmail,
  contractConfig,
  logoUrl,
  onPageOverflowChange,
}: ContractPreviewProps) => {
  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const clientFullName = `${clientData.firstName} ${clientData.lastName}`;

  const itemsUnico = items.filter((i) => (i.tipo ?? 'unico') === 'unico');
  const itemsPeriodo = items.filter((i) => i.tipo === 'periodico');
  const itemsConsumo = items.filter((i) => i.tipo === 'consumo');

  /** Mapa de variables para interpolación de texto */
  const interpData: Record<string, string> = {
    nombre: clientData.firstName,
    apellidos: clientData.lastName,
    nombre_completo: clientFullName,
    dni: clientData.dni,
    email: clientData.email || '',
    telefono: clientData.phones[0] || '',
    numero_cuenta: clientData.bankAccounts?.[0] || '',
    direccion: clientData.address.address || '',
    cups_luz: clientData.address.cupsLuz || '',
    cups_gas: clientData.address.cupsGas || '',
    referencia: 'pendiente de asignación',
    fecha: today,
    comercial,
  };

  // ── Construir páginas ──────────────────────────────────────────────────────
  // Nuevo formato: modulos + paginas
  // Formato antiguo: seccionesContrato con salto_pagina como separadores
  let pages: SeccionContrato[][] = [];

  if (Array.isArray(contractConfig?.modulos) && Array.isArray(contractConfig?.paginas)) {
    // Nuevo formato: cada PaginaContrato es una página A4
    const moduloMap = new Map<string, ModuloDisponible>(
      contractConfig.modulos.map((m) => [m.id, m])
    );
    pages = contractConfig.paginas.map((pagina) =>
      pagina.modulosIds
        .map((id) => moduloMap.get(id))
        .filter((m): m is ModuloDisponible => !!m && !m.oculta) as SeccionContrato[]
    );
  } else {
    // Formato antiguo o fallback: seccionesContrato con salto_pagina
    const secciones: SeccionContrato[] =
      contractConfig?.seccionesContrato && contractConfig.seccionesContrato.length > 0
        ? contractConfig.seccionesContrato
        : DEFAULT_SECCIONES;

    const seccionesVisibles = secciones.filter((s) => !s.oculta);
    let current: SeccionContrato[] = [];
    for (const s of seccionesVisibles) {
      if (s.tipo === 'salto_pagina') {
        pages.push(current);
        current = [];
      } else {
        current.push(s);
      }
    }
    pages.push(current);
  }

  // Para la lógica de logo: extraer secciones visibles del formato antiguo
  const visibles: SeccionContrato[] = pages.flat();

  // ── Renderizadores por tipo ─────────────────────────────────────────────────

  const renderLogoIfNeeded = (pageIndex: number) => {
    if (!logoUrl) return null;
    // Logo en página 0 siempre si no hay sección identidad, o si identidad lo incluye
    // En páginas extra (>0): solo si logoEnPaginasExtra
    if (pageIndex === 0) return null; // identidad ya lo maneja; si no hay identidad lo mostramos abajo
    if (pageIndex > 0 && contractConfig?.logoEnPaginasExtra) {
      return (
        <div className={styles.logoWrap} style={{ textAlign: contractConfig?.logoAlign ?? 'left' }}>
          <img src={logoUrl} alt="Logo empresa" className={styles.logo} />
        </div>
      );
    }
    return null;
  };

  const renderIdentidad = (seccion: SeccionContrato) => (
    <div className={styles.header}>
      {logoUrl && (
        <div className={styles.logoWrap} style={{ textAlign: contractConfig?.logoAlign ?? 'left' }}>
          <img src={logoUrl} alt="Logo empresa" className={styles.logo} />
        </div>
      )}
      {seccion.nombreEmpresa && (
        <p className={styles.companyName} style={{ textAlign: seccion.nombreEmpresaAlign ?? 'center' }}>
          {seccion.nombreEmpresa}
        </p>
      )}
      <h1 className={styles.mainTitle} style={{ textAlign: seccion.tituloContratoAlign ?? 'center' }}>
        {seccion.tituloContrato || 'CONTRATO DE VENTA'}
      </h1>
      {(seccion.mostrarReferencia ?? true) && (
        <p className={styles.meta} style={{ textAlign: seccion.referenciaAlign ?? 'center' }}>
          Referencia: pendiente de asignación
        </p>
      )}
      {(seccion.mostrarFecha ?? true) && (
        <p className={styles.meta} style={{ textAlign: seccion.fechaAlign ?? 'center' }}>
          Fecha: {today}
        </p>
      )}
    </div>
  );

  const show = (field: boolean | undefined) => field !== false;

  const renderDatosCliente = (seccion: SeccionContrato) => (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{seccion.titulo || 'DATOS DEL CLIENTE'}</h2>
      {seccion.contenido ? (
        <div className={styles.clausulasText} style={{ textAlign: seccion.align ?? 'left' }}>
          {renderMarkdown(interpolate(seccion.contenido, interpData))}
        </div>
      ) : (
        <table className={styles.dataTable}>
          <tbody>
            {show(seccion.mostrarNombre) && <tr><td className={styles.dataLabel}>Nombre:</td><td>{clientFullName}</td></tr>}
            {show(seccion.mostrarDni) && <tr><td className={styles.dataLabel}>DNI/NIF:</td><td>{clientData.dni}</td></tr>}
            {show(seccion.mostrarEmail) && clientData.email && <tr><td className={styles.dataLabel}>Email:</td><td>{clientData.email}</td></tr>}
            {show(seccion.mostrarTelefono) && clientData.phones.length > 0 && <tr><td className={styles.dataLabel}>Teléfono:</td><td>{clientData.phones[0]}</td></tr>}
            {show(seccion.mostrarNumeroCuenta) && clientData.bankAccounts?.[0] && <tr><td className={styles.dataLabel}>Núm. cuenta:</td><td>{clientData.bankAccounts[0]}</td></tr>}
            {show(seccion.mostrarDireccion) && clientData.address.address && <tr><td className={styles.dataLabel}>Dirección:</td><td>{clientData.address.address}</td></tr>}
            {show(seccion.mostrarCupsLuz) && clientData.address.cupsLuz && <tr><td className={styles.dataLabel}>CUPS Luz:</td><td>{clientData.address.cupsLuz}</td></tr>}
            {show(seccion.mostrarCupsGas) && clientData.address.cupsGas && <tr><td className={styles.dataLabel}>CUPS Gas:</td><td>{clientData.address.cupsGas}</td></tr>}
          </tbody>
        </table>
      )}
    </section>
  );

  const renderProductos = (seccion: SeccionContrato) => {
    const mostrarColTotal = seccion.mostrarColumnaTotalUnico !== false;
    const mostrarTotal = seccion.mostrarTotalGeneral !== false;

    return (
      <section className={styles.section}>
        <h2
          className={styles.sectionTitle}
          style={{ textAlign: seccion.tituloSeccionProductosAlign ?? 'left' }}
        >
          {seccion.tituloSeccionProductos || 'PRODUCTOS CONTRATADOS'}
        </h2>

        {itemsUnico.length > 0 && (
          <>
            {seccion.tablaUnicoTitulo && <p className={styles.subSectionTitle}>{seccion.tablaUnicoTitulo}</p>}
            <table className={styles.productsTable}>
              <thead><tr>
                <th>{seccion.tablaUnicoColConcepto || 'Concepto'}</th>
                <th>{seccion.tablaUnicoColCantidad || 'Cant.'}</th>
                <th>{seccion.tablaUnicoColPrecioUnit || 'Precio unit.'}</th>
                {mostrarColTotal && <th>{seccion.tablaUnicoColTotal || 'Total'}</th>}
              </tr></thead>
              <tbody>
                {itemsUnico.map((item, i) => (
                  <tr key={item.productId ?? i}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price.toFixed(2)} €</td>
                    {mostrarColTotal && <td>{(item.price * item.quantity).toFixed(2)} €</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {itemsPeriodo.length > 0 && (
          <>
            {seccion.tablaPeriodoTitulo && <p className={styles.subSectionTitle}>{seccion.tablaPeriodoTitulo}</p>}
            <table className={styles.productsTable}>
              <thead><tr>
                <th>{seccion.tablaPeriodoColConcepto || 'Concepto'}</th>
                <th>{seccion.tablaPeriodoColPeriodicidad || 'Periodicidad'}</th>
                <th>{seccion.tablaPeriodoColPrecio || 'Precio'}</th>
              </tr></thead>
              <tbody>
                {itemsPeriodo.map((item, i) => (
                  <tr key={item.productId ?? i}>
                    <td>{item.name}</td>
                    <td>{item.periodo ?? '—'}</td>
                    <td>{item.price.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {itemsConsumo.length > 0 && (
          <>
            {seccion.tablaConsumoTitulo && <p className={styles.subSectionTitle}>{seccion.tablaConsumoTitulo}</p>}
            <table className={styles.productsTable}>
              <thead><tr>
                <th>{seccion.tablaConsumoColConcepto || 'Concepto'}</th>
                <th>{seccion.tablaConsumoColPrecioBase || 'Precio base'}</th>
                <th>{seccion.tablaConsumoColPrecioConsumo || '€/unidad'}</th>
                <th>{seccion.tablaConsumoColUnidad || 'Unidad'}</th>
              </tr></thead>
              <tbody>
                {itemsConsumo.map((item, i) => (
                  <tr key={item.productId ?? i}>
                    <td>{item.name}</td>
                    <td>{item.precioBase != null ? `${Number(item.precioBase).toFixed(2)} €` : '—'}</td>
                    <td>{item.precioConsumo != null ? `${Number(item.precioConsumo).toFixed(4)} €` : '—'}</td>
                    <td>{item.unidadConsumo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {mostrarTotal && (
          <div className={styles.totalRow}>
            <span>TOTAL:</span>
            <span className={styles.totalAmount}>{totalAmount.toFixed(2)} €</span>
          </div>
        )}
      </section>
    );
  };

  const renderFirma = (seccion: SeccionContrato) => (
    <section className={styles.section}>
      <h2
        className={styles.sectionTitle}
        style={{ textAlign: seccion.firmaSeccionTituloAlign ?? 'left' }}
      >
        {seccion.firmaSeccionTitulo || 'FIRMA DEL CLIENTE'}
      </h2>
      {seccion.firmaNota && (
        <p className={styles.signatureNote} style={{ textAlign: seccion.firmaNotaAlign ?? 'left' }}>
          {seccion.firmaNota}
        </p>
      )}
      {(seccion.mostrarEmailFirma ?? true) && signerEmail && (
        <p className={styles.signatureEmail}>
          El contrato se enviará a: <strong>{signerEmail}</strong>
        </p>
      )}
      <div className={styles.signatureArea}>
        <div className={styles.signatureLine} />
        <p className={styles.signatureName}>{clientFullName}</p>
        <p className={styles.signatureLabel}>{seccion.firmaEtiqueta || 'Firma del cliente'}</p>
      </div>
    </section>
  );

  const renderPie = (seccion: SeccionContrato) => (
    <div className={styles.footer} style={{ textAlign: seccion.textoPieAlign ?? 'center' }}>
      <p>{seccion.textoPie}</p>
      {comercial && <p>Comercial: {comercial}</p>}
    </div>
  );

  const renderTexto = (seccion: SeccionContrato) => (
    <section className={styles.section}>
      {seccion.titulo && (
        <h2 className={styles.sectionTitle} style={{ textAlign: seccion.align ?? 'left' }}>
          {seccion.titulo}
        </h2>
      )}
      {seccion.contenido && (
        <div className={styles.clausulasText} style={{ textAlign: seccion.align ?? 'left' }}>
          {renderMarkdown(interpolate(seccion.contenido, interpData))}
        </div>
      )}
    </section>
  );

  const renderSeccion = (seccion: SeccionContrato, index: number) => {
    const divider = index > 0 ? <hr className={styles.divider} /> : null;

    if (seccion.tipo === 'identidad') {
      return <div key={seccion.id}>{renderIdentidad(seccion)}<hr className={styles.divider} /></div>;
    }

    return (
      <div key={seccion.id}>
        {divider}
        {seccion.tipo === 'datos_cliente' && renderDatosCliente(seccion)}
        {seccion.tipo === 'productos' && renderProductos(seccion)}
        {seccion.tipo === 'firma' && renderFirma(seccion)}
        {seccion.tipo === 'pie' && renderPie(seccion)}
        {seccion.tipo === 'texto' && renderTexto(seccion)}
      </div>
    );
  };

  const hasIdentidadOnPage0 = pages[0]?.some((s) => s.tipo === 'identidad');

  return (
    <div className={styles.pagesWrapper}>
      <div className={styles.previewBadge}>VISTA PREVIA</div>

      {/* Páginas principales (separadas por salto_pagina) */}
      {pages.map((pageSecciones, pageIndex) => (
        <A4PageWrapper key={pageIndex} pageIndex={pageIndex} onOverflowChange={onPageOverflowChange}>
          {/* Logo en páginas 1+ si está activado */}
          {pageIndex > 0 && renderLogoIfNeeded(pageIndex)}

          {/* Si la primera página no tiene identidad, mostrar logo suelto */}
          {pageIndex === 0 && !hasIdentidadOnPage0 && logoUrl && (
            <div className={styles.header}>
              <div className={styles.logoWrap} style={{ textAlign: contractConfig?.logoAlign ?? 'left' }}>
                <img src={logoUrl} alt="Logo empresa" className={styles.logo} />
              </div>
            </div>
          )}

          {pageSecciones.map((seccion, index) => renderSeccion(seccion, index))}
        </A4PageWrapper>
      ))}

      {/* Páginas extra (paginasExtra) */}
      {contractConfig?.paginasExtra && contractConfig.paginasExtra.length > 0 &&
        contractConfig.paginasExtra.map((p) => {
          const firmaSeccion = visibles.find((s) => s.tipo === 'firma');
          return (
            <A4PageWrapper key={p.id}>
              {contractConfig.logoEnPaginasExtra && logoUrl && (
                <div className={styles.logoWrap} style={{ textAlign: contractConfig.logoAlign ?? 'left' }}>
                  <img src={logoUrl} alt="Logo empresa" className={styles.logo} />
                </div>
              )}
              {p.tipo === 'firma' && firmaSeccion ? (
                renderFirma(firmaSeccion)
              ) : (
                <>
                  <h3 className={styles.extraPageTitle}>{p.titulo}</h3>
                  <div className={styles.extraPageContent} style={{ textAlign: p.align ?? 'left' }}>
                    {renderMarkdown(interpolate(p.contenido, interpData))}
                  </div>
                </>
              )}
            </A4PageWrapper>
          );
        })
      }
    </div>
  );
};

export default ContractPreview;
