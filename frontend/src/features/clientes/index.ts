/**
 * Export principal de la feature de clientes
 */

// Slice y acciones
export {
  default as clientsReducer,
  selectClient,
  clearError,
  clearSelectedClient,
  addClient,
  resetClientsState,
  fetchClients,
  fetchClientById,
  searchClient,
  createClient
} from './clientsSlice';

// Hooks
export * from './hooks';

// Componentes
export * from './components';

// Servicios (por si se necesitan directamente)
export * as clientService from './services/clientService';
