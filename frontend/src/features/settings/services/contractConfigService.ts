import api from '@/api/crmApi';
import { logger } from '@/utils/logger';

export type Align = 'left' | 'center' | 'right';

// ── Legacy types (kept for backward compat with backend PDF generation) ────────

export interface ContractPageExtra {
  id: string;
  titulo: string;
  contenido: string;
  align?: Align;
  tipo?: 'contenido' | 'firma';
}

/**
 * Sección del contrato — formato plano usado por el backend para generar PDF.
 * Incluye 'salto_pagina' como separador de páginas A4.
 */
export interface SeccionContrato {
  id: string;
  tipo: 'identidad' | 'datos_cliente' | 'productos' | 'firma' | 'pie' | 'texto' | 'salto_pagina';
  oculta?: boolean;

  // ── identidad ────────────────────────────────────────────────────────────
  nombreEmpresa?: string;
  nombreEmpresaAlign?: Align;
  tituloContrato?: string;
  tituloContratoAlign?: Align;
  mostrarReferencia?: boolean;
  referenciaAlign?: Align;
  mostrarFecha?: boolean;
  fechaAlign?: Align;

  // ── texto / datos_cliente ────────────────────────────────────────────────
  titulo?: string;
  contenido?: string;
  align?: Align;

  // ── datos_cliente — campos visibles en la tabla automática ──────────────
  mostrarNombre?: boolean;
  mostrarDni?: boolean;
  mostrarEmail?: boolean;
  mostrarTelefono?: boolean;
  mostrarNumeroCuenta?: boolean;
  mostrarDireccion?: boolean;
  mostrarCupsLuz?: boolean;
  mostrarCupsGas?: boolean;

  // ── firma ────────────────────────────────────────────────────────────────
  firmaSeccionTitulo?: string;
  firmaSeccionTituloAlign?: Align;
  firmaNota?: string;
  firmaNotaAlign?: Align;
  mostrarEmailFirma?: boolean;
  firmaEtiqueta?: string;

  // ── pie ──────────────────────────────────────────────────────────────────
  textoPie?: string;
  textoPieAlign?: Align;

  // ── productos ────────────────────────────────────────────────────────────
  tituloSeccionProductos?: string;
  tituloSeccionProductosAlign?: Align;
  tablaUnicoTitulo?: string;
  tablaUnicoColConcepto?: string;
  tablaUnicoColCantidad?: string;
  tablaUnicoColPrecioUnit?: string;
  tablaUnicoColTotal?: string;
  tablaPeriodoTitulo?: string;
  tablaPeriodoColConcepto?: string;
  tablaPeriodoColPeriodicidad?: string;
  tablaPeriodoColPrecio?: string;
  tablaConsumoTitulo?: string;
  tablaConsumoColConcepto?: string;
  tablaConsumoColPrecioBase?: string;
  tablaConsumoColPrecioConsumo?: string;
  tablaConsumoColUnidad?: string;

  // ── productos — visibilidad de totales ───────────────────────────────────
  /** Mostrar columna "Total" en la tabla de precio fijo (precio × cant.) */
  mostrarColumnaTotalUnico?: boolean;
  /** Mostrar fila TOTAL general al final de la sección de productos */
  mostrarTotalGeneral?: boolean;
}

// ── New architecture types ────────────────────────────────────────────────────

/** Tipos de módulo disponibles (excluye salto_pagina, que es implícito entre páginas) */
export type TipoModulo = Exclude<SeccionContrato['tipo'], 'salto_pagina'>;

/**
 * Módulo de la librería del contrato.
 * Puede ser de sistema (esDeServicio=true, no eliminable) o personalizado.
 * Comparte todos los campos de configuración con SeccionContrato.
 */
export interface ModuloDisponible extends Omit<SeccionContrato, 'tipo'> {
  tipo: TipoModulo;
  /** Nombre descriptivo mostrado en la librería */
  nombre: string;
  /** true = módulo del sistema, no se puede eliminar */
  esDeServicio: boolean;
}

/** Página del contrato — referencia módulos por ID en orden */
export interface PaginaContrato {
  id: string;
  titulo: string;
  modulosIds: string[];
}

export interface ContractConfig {
  logoPath: string | null;
  /** Solo frontend — URL pública para mostrar el logo */
  logoUrl?: string | null;
  logoAlign: Align;
  logoEnPaginasExtra: boolean;
  /** Librería de módulos disponibles */
  modulos: ModuloDisponible[];
  /** Páginas del contrato, cada una referencia módulos por ID */
  paginas: PaginaContrato[];
  /** Derivado — formato plano para el backend PDF. Se calcula al guardar. */
  seccionesContrato: SeccionContrato[];
  /** Legacy — páginas extra del formato anterior */
  paginasExtra: ContractPageExtra[];
}

// ── Módulos de sistema por defecto ───────────────────────────────────────────

const PIE_DEFAULT =
  'Documento generado electrónicamente. La firma de este contrato tiene plena validez legal.';

export const DEFAULT_MODULOS: ModuloDisponible[] = [
  {
    id: 'default_identidad',
    tipo: 'identidad',
    nombre: 'Encabezado empresa',
    esDeServicio: true,
    nombreEmpresa: '',
    nombreEmpresaAlign: 'center',
    tituloContrato: 'CONTRATO DE VENTA',
    tituloContratoAlign: 'center',
    mostrarReferencia: true,
    referenciaAlign: 'center',
    mostrarFecha: true,
    fechaAlign: 'center',
  },
  {
    id: 'default_datos_cliente',
    tipo: 'datos_cliente',
    nombre: 'Datos del cliente',
    esDeServicio: true,
  },
  {
    id: 'default_productos',
    tipo: 'productos',
    nombre: 'Productos contratados',
    esDeServicio: true,
    tituloSeccionProductos: 'PRODUCTOS CONTRATADOS',
    tituloSeccionProductosAlign: 'left',
    tablaUnicoTitulo: '',
    tablaUnicoColConcepto: 'Concepto',
    tablaUnicoColCantidad: 'Cant.',
    tablaUnicoColPrecioUnit: 'Precio unit.',
    tablaUnicoColTotal: 'Total',
    tablaPeriodoTitulo: 'Servicios periódicos',
    tablaPeriodoColConcepto: 'Concepto',
    tablaPeriodoColPeriodicidad: 'Periodicidad',
    tablaPeriodoColPrecio: 'Precio',
    tablaConsumoTitulo: 'Tarifas por consumo',
    tablaConsumoColConcepto: 'Concepto',
    tablaConsumoColPrecioBase: 'Precio base',
    tablaConsumoColPrecioConsumo: '€/unidad',
    tablaConsumoColUnidad: 'Unidad',
  },
  {
    id: 'default_firma',
    tipo: 'firma',
    nombre: 'Firma del cliente',
    esDeServicio: true,
    firmaSeccionTitulo: 'FIRMA DEL CLIENTE',
    firmaSeccionTituloAlign: 'left',
    firmaNota: 'El firmante acepta las condiciones de este contrato de venta.',
    firmaNotaAlign: 'left',
    mostrarEmailFirma: true,
    firmaEtiqueta: 'Firma del cliente',
  },
  {
    id: 'default_pie',
    tipo: 'pie',
    nombre: 'Pie de página',
    esDeServicio: true,
    textoPie: PIE_DEFAULT,
    textoPieAlign: 'center',
  },
];

export const DEFAULT_PAGINAS: PaginaContrato[] = [
  {
    id: 'default_page_1',
    titulo: 'Página 1',
    modulosIds: [
      'default_identidad',
      'default_datos_cliente',
      'default_productos',
      'default_firma',
      'default_pie',
    ],
  },
];

// ── Helpers de transformación ─────────────────────────────────────────────────

/**
 * Deriva seccionesContrato (formato plano con salto_pagina) a partir de
 * modulos + paginas. Usado al guardar para mantener compatibilidad con el
 * backend de generación de PDF.
 */
export function derivarSecciones(
  modulos: ModuloDisponible[],
  paginas: PaginaContrato[]
): SeccionContrato[] {
  const moduloMap = new Map(modulos.map((m) => [m.id, m]));
  const result: SeccionContrato[] = [];

  paginas.forEach((pagina, pageIndex) => {
    if (pageIndex > 0) {
      result.push({ id: `salto_pagina_${pagina.id}`, tipo: 'salto_pagina' });
    }
    for (const moduloId of pagina.modulosIds) {
      const m = moduloMap.get(moduloId);
      if (m) result.push(m as unknown as SeccionContrato);
    }
  });

  return result;
}

/** DEFAULT_SECCIONES derivadas para fallback en ContractPreview sin config */
export const DEFAULT_SECCIONES: SeccionContrato[] = derivarSecciones(
  DEFAULT_MODULOS,
  DEFAULT_PAGINAS
);

// ── Migración de formato antiguo a nuevo ──────────────────────────────────────

const NOMBRES_POR_TIPO: Record<TipoModulo, string> = {
  identidad: 'Encabezado empresa',
  datos_cliente: 'Datos del cliente',
  productos: 'Productos contratados',
  firma: 'Firma del cliente',
  pie: 'Pie de página',
  texto: 'Texto libre',
};

const TIPOS_DE_SERVICIO: string[] = [
  'identidad',
  'datos_cliente',
  'productos',
  'firma',
  'pie',
];

type RawServerConfig = Partial<ContractConfig> & {
  seccionesContrato?: SeccionContrato[];
  paginasExtra?: ContractPageExtra[];
};

/**
 * Normaliza la respuesta del servidor al nuevo formato.
 * Si ya tiene modulos/paginas los usa directamente.
 * Si solo tiene seccionesContrato (formato antiguo), migra automáticamente.
 */
export function migrateContractConfig(raw: RawServerConfig): ContractConfig {
  // Ya en nuevo formato
  if (raw.modulos && raw.modulos.length > 0 && raw.paginas && raw.paginas.length > 0) {
    const derived = derivarSecciones(raw.modulos, raw.paginas);
    return {
      logoPath: raw.logoPath ?? null,
      logoUrl: raw.logoUrl,
      logoAlign: raw.logoAlign ?? 'left',
      logoEnPaginasExtra: raw.logoEnPaginasExtra ?? false,
      modulos: raw.modulos,
      paginas: raw.paginas,
      seccionesContrato: raw.seccionesContrato ?? derived,
      paginasExtra: raw.paginasExtra ?? [],
    };
  }

  // Plantilla en blanco: seccionesContrato explícitamente vacío
  if (Array.isArray(raw.seccionesContrato) && raw.seccionesContrato.length === 0) {
    return {
      logoPath: raw.logoPath ?? null,
      logoUrl: raw.logoUrl,
      logoAlign: raw.logoAlign ?? 'left',
      logoEnPaginasExtra: raw.logoEnPaginasExtra ?? false,
      modulos: [],
      paginas: [{ id: crypto.randomUUID(), titulo: 'Página 1', modulosIds: [] }],
      seccionesContrato: [],
      paginasExtra: raw.paginasExtra ?? [],
    };
  }

  // Migrar desde formato antiguo
  const secciones = raw.seccionesContrato ?? DEFAULT_SECCIONES;
  const modulos: ModuloDisponible[] = [];
  let currentPageIds: string[] = [];
  const paginas: PaginaContrato[] = [];
  let pageNum = 1;

  for (const s of secciones) {
    if (s.tipo === 'salto_pagina') {
      paginas.push({
        id: crypto.randomUUID(),
        titulo: `Página ${pageNum}`,
        modulosIds: [...currentPageIds],
      });
      currentPageIds = [];
      pageNum++;
    } else {
      const modulo: ModuloDisponible = {
        ...(s as unknown as ModuloDisponible),
        tipo: s.tipo as TipoModulo,
        nombre: NOMBRES_POR_TIPO[s.tipo as TipoModulo] ?? s.tipo,
        esDeServicio: TIPOS_DE_SERVICIO.includes(s.tipo),
      };
      modulos.push(modulo);
      currentPageIds.push(s.id);
    }
  }

  paginas.push({
    id: 'default_page_1',
    titulo: 'Página 1',
    modulosIds: currentPageIds,
  });

  const finalModulos = modulos.length > 0 ? modulos : DEFAULT_MODULOS;
  const finalPaginas =
    paginas.length > 0 && paginas.some((p) => p.modulosIds.length > 0)
      ? paginas
      : DEFAULT_PAGINAS;

  return {
    logoPath: raw.logoPath ?? null,
    logoUrl: raw.logoUrl,
    logoAlign: raw.logoAlign ?? 'left',
    logoEnPaginasExtra: raw.logoEnPaginasExtra ?? false,
    modulos: finalModulos,
    paginas: finalPaginas,
    seccionesContrato: derivarSecciones(finalModulos, finalPaginas),
    paginasExtra: raw.paginasExtra ?? [],
  };
}

export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  logoPath: null,
  logoUrl: null,
  logoAlign: 'left',
  logoEnPaginasExtra: false,
  modulos: DEFAULT_MODULOS,
  paginas: DEFAULT_PAGINAS,
  seccionesContrato: DEFAULT_SECCIONES,
  paginasExtra: [],
};

// ── API ──────────────────────────────────────────────────────────────────────

export const getContractConfig = async (): Promise<ContractConfig> => {
  const response = await api.get<RawServerConfig>('/contract-config');
  return migrateContractConfig(response.data);
};

export const saveContractConfig = async (
  config: Partial<Omit<ContractConfig, 'logoPath' | 'logoUrl'>>
): Promise<ContractConfig> => {
  try {
    const response = await api.patch<RawServerConfig>('/contract-config', config);
    return migrateContractConfig(response.data);
  } catch (error) {
    logger.apiError('PATCH /contract-config', error);
    throw error;
  }
};

export const uploadLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  try {
    const response = await api.post<{ logoUrl: string }>('/contract-config/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    logger.apiError('POST /contract-config/logo', error);
    throw error;
  }
};

export const deleteLogo = async (): Promise<void> => {
  try {
    await api.delete('/contract-config/logo');
  } catch (error) {
    logger.apiError('DELETE /contract-config/logo', error);
    throw error;
  }
};

/**
 * Descarga el logo actual desde la API (con auth) y devuelve un blob URL.
 * El caller es responsable de llamar URL.revokeObjectURL cuando ya no lo necesite.
 */
export const fetchLogoObjectUrl = async (): Promise<string> => {
  const response = await api.get('/contract-config/logo', { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
};
