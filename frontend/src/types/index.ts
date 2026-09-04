// Tipos globales para la aplicación CRM Elite

// Re-exportar tipos del módulo de ventas
export * from './sales';

// Tipos de autenticación
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type UserRole = 'administrador' | 'coordinador' | 'verificador' | 'comercial';

// Tipos de cliente - LEGACY (sistema anterior)
// NOTA: Mantener para compatibilidad con componentes existentes
export interface LegacyClient {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  birthday: string;
  phones: string[];
  addresses: Address[];
  bankAccounts: string[];
  comments: string[];
  authorized?: string;
  businessName?: string;
  createdAt: string;
  lastModified: string;
}

export interface Address {
  address: string;
  cupsGas?: string;
  cupsLuz?: string;
}

// IMPORTANTE: Client principal ahora viene de sales.ts (CRM)
// El tipo Client del CRM es el nuevo estándar

// Tipos de venta
export interface Sale {
  id: string;
  advisor: string;
  clientId: string;
  dni: string;
  customerName: string;
  emailInvoice: boolean;
  phoneNumbers: string[];
  birthDate: string;
  maintenance: boolean;
  authorizedPerson?: string;
  status: string;
  verifier?: string;
  address: string;
  cupsElectricity?: string;
  cupsGas?: string;
  tariffElectricity?: string;
  tariffGas?: string;
  contractedPowerElectricity?: string;
  contractedPowerGas?: string;
  iban?: string;
  notes: SaleNote[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SaleNote {
  message: string;
  user: string;
  role: UserRole;
  createdAt: string;
}

// Tipos de 1Skore
export interface SkoreSearchResultPhone {
  telefono: string;
  tipo_telefono: string;
  documento: string;
  dir_direccion: string;
  dir_cp: string;
  dir_municipio: string;
  dir_provincia: string;
  comunidad_autonoma: string;
  activo_voz: string;
  activo_whatsapp: string;
  operador_actual: string;
  fecha_ult_portabilidad: string;
  operador_donante: string;
  operador_original: string;
}

export interface SkoreSearchResultDNI {
  nombre: string;
  apellidos: string;
  documento: string;
  tipo_documento: string;
  fecha_nacimiento: string;
  cnae: string;
  cnae_descripcion: string;
  dir_direccion: string;
  dir_cp: string;
  dir_municipio: string;
  dir_provincia: string;
  comunidad_autonoma: string;
  telefonos?: string[];
  emails?: string[];
}

export type SkoreSearchResult = SkoreSearchResultPhone | SkoreSearchResultDNI;

export interface SkoreSearchResponse {
  success: number;
  msg?: string[] | string;
  [key: string]: unknown;
}

// Tipos de API
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ValidationError {
  message: string;
  errors: ValidationFieldError[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Tipos de formularios
export interface LoginFormData {
  username: string;
  password: string;
}

export interface CreateClientFormData {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  birthday: string;
  phones: string[];
  addresses: Address[];
  bankAccounts: string[];
  comments: string[];
  authorized?: string;
  businessName?: string;
}

// Tipos de estado de carga
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Tipos de componentes
export interface SelectOption {
  value: string;
  label: string;
}

// Tipos de rutas
export interface RouteConfig {
  path: string;
  element?: React.ReactElement;
  external?: boolean;
  allowedRoles: UserRole[];
  label: string;
  group?: string;
  hideFromMenu?: boolean;
  moduleKey?: string; // Si está presente, la ruta se oculta cuando el módulo está desactivado
}