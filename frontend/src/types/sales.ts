/* src/types/sales.ts */

/* -----------------------------------------------------
   CLIENT SNAPSHOT (para enviar al backend)
----------------------------------------------------- */
export interface AddressInfo {
  address: string;
  cupsGas?: string;
  cupsLuz?: string;
}

export interface ClientSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  birthday?: string;
  phones: string[];
  bankAccounts: string[];
  address: AddressInfo;
}

/* -----------------------------------------------------
   CLIENT (datos completos del cliente del CRM)
----------------------------------------------------- */
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  birthday?: string;
  phones: string[];
  addresses: AddressInfo[];
  bankAccounts: string[];
  comments: string[];
  authorized?: string;
  businessName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  birthday?: string;
  phones?: string[];
  addresses?: AddressInfo[];
  bankAccounts?: string[];
  comments?: string[];
  authorized?: string;
  businessName?: string;
}

export interface UpdateClientData {
  firstName?: string;
  lastName?: string;
  dni?: string;
  email?: string;
  birthday?: string;
  phones?: string[];
  addresses?: AddressInfo[];
  bankAccounts?: string[];
  comments?: string[];
  authorized?: string;
  businessName?: string;
}

export interface PushClientDataRequest {
  field: 'phones' | 'addresses' | 'bankAccounts' | 'comments';
  value: string | AddressInfo;
}

export interface ClientResponse {
  message: string;
  client: Client;
}


/* -----------------------------------------------------
   PRODUCTO
----------------------------------------------------- */
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  tipo?: string;           // 'unico' | 'periodico' | 'consumo'
  periodo?: string | null;
  precioBase?: number | null;
  precioConsumo?: number | null;
  unidadConsumo?: string | null;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  tipo?: string;
  periodo?: string | null;
  precioBase?: number | null;
  precioConsumo?: number | null;
  unidadConsumo?: string | null;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  sku?: string;
  price?: number;
  tipo?: string;
  periodo?: string | null;
  precioBase?: number | null;
  precioConsumo?: number | null;
  unidadConsumo?: string | null;
}

export interface ProductResponse {
  message: string;
  product: Product;
}

/* -----------------------------------------------------
   ITEMS PARA CREAR VENTA (front)
----------------------------------------------------- */
export interface CreateSaleItemData {
  productId?: string | null;
  name: string;
  quantity: number;
  price: number;
  tipo?: string | null;
  periodo?: string | null;
  precioBase?: number | null;
  precioConsumo?: number | null;
  unidadConsumo?: string | null;
}

/* -----------------------------------------------------
   DTO CREAR VENTA (front payload)
   Nota: en el backend esperan clientId + items con unitPrice/nameSnapshot...
   El servicio del frontend transformará este CreateSaleData al DTO backend.
----------------------------------------------------- */
export interface CreateSaleData {
  client: ClientSnapshot;
  items: CreateSaleItemData[];
  statusId?: string;
  notes?: any;
  metadata?: any;
  comercial: string;
}

/* -----------------------------------------------------
   ACTUALIZAR ITEM
----------------------------------------------------- */
export interface UpdateSaleItemData {
  unitPrice?: number;
  quantity?: number;
  finalPrice?: number;
}

/* -----------------------------------------------------
   CAMBIAR ESTADO
----------------------------------------------------- */
export interface ChangeSaleStatusRequest {
  statusId: string;
  comment?: string;
}

/* -----------------------------------------------------
   FILTROS DE LISTADO (front)
----------------------------------------------------- */
export interface SaleFilters {
  clientId?: string;
  clientDniOrPhone?: string;
  statusId?: string;
  from?: string;
  to?: string;
  productId?: string;
  minTotal?: number;
  maxTotal?: number;
  comercial?: string;
}

/* -----------------------------------------------------
   RESPONSE BACKEND
----------------------------------------------------- */
export interface SaleItem {
  id: string;
  productId?: string | null;
  nameSnapshot: string;
  skuSnapshot?: string | null;
  unitPrice: number;
  quantity: number;
  finalPrice: number;
  tipoSnapshot?: string | null;
  periodoSnapshot?: string | null;
  precioBaseSnapshot?: number | null;
  precioConsumoSnapshot?: number | null;
  unidadConsumoSnapshot?: string | null;
}

export interface SaleUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SaleStatus {
  id: string;
  name: string;
  order: number;
  color: string;
  isFinal: boolean;
  isCancelled: boolean;
  isSystem?: boolean;
}

/* -----------------------------------------------------
   SALE STATUS - CRUD
----------------------------------------------------- */
export interface CreateSaleStatusData {
  name: string;
  order: number;
  color?: string;
  isFinal?: boolean;
  isCancelled?: boolean;
}

export interface UpdateSaleStatusData {
  name?: string;
  color?: string;
  isFinal?: boolean;
  isCancelled?: boolean;
}

export interface SaleStatusResponse {
  message: string;
  status: SaleStatus;
}

export interface SaleStatusState {
  statuses: SaleStatus[];
  selectedStatus: SaleStatus | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export interface ReorderStatusesRequest {
  statuses: { id: string; order: number }[];
}

export type ReorderStatusData = ReorderStatusesRequest;

export interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export interface SalesStats {
  daily: number;
  weekly: number;
  monthly: number;
}

/* -----------------------------------------------------
   FIRMA ELECTRÓNICA
----------------------------------------------------- */
export type SignatureStatus = 'pending' | 'signed' | 'rejected';

export interface SignatureRequest {
  id: string;
  saleId: string;
  status: SignatureStatus;
  signerEmail: string;
  providerDocumentId?: string | null;
  signedDocumentUrl?: string | null;
  rejectionReason?: string | null;
  sentAt?: string | null;
  signedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendContractRequest {
  signerEmail: string;
  signerPhone?: string;
  deliveryMethod?: 'email' | 'sms';
  templateId?: string;
}

export interface SignatureRequestResponse {
  message: string;
  signatureRequest: SignatureRequest;
}

export interface SaleHistory {
  id: string;
  saleId: string;
  userId: string | null;
  action: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  user?: { firstName: string; lastName: string } | null;
}

export interface Sale {
  id: string;
  clientId: string;
  client?: ClientSnapshot;

  statusId: string;
  status: SaleStatus;

  totalAmount: number;
  items: SaleItem[];
  histories: SaleHistory[];
  assignments: any[];
  user?: SaleUser | null;
  notes?: any;
  metadata?: any;
  comercial?: string | null;
  signatureRequest?: SignatureRequest | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}


export interface SaleResponse {
  sale: Sale;
}

/* -----------------------------------------------------
   ESTADO GLOBAL DE REDUX
----------------------------------------------------- */
export interface SalesState {
  sales: Sale[];
  selectedSale: Sale | null;
  filters: SaleFilters;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

/* -----------------------------------------------------
   GRABACIONES (RECORDINGS)
----------------------------------------------------- */
export interface RecordingUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Recording {
  id: string;
  saleId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  uploadedById?: string;
  uploadedBy?: RecordingUser;
  createdAt: string;
}

export interface UploadRecordingResponse {
  message: string;
  recording: Recording;
}

export interface DeleteRecordingResponse {
  message: string;
}
