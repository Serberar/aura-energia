/**
 * Feature de Usuarios - Exports principales
 */

export * from './components';

// Redux slice exports (thunks y acciones)
export {
  fetchUsers,
  createUser,
  deleteUser,
  updateUser,
  selectUser,
  clearError,
  clearSelectedUser,
  resetUsersState,
  default as usersReducer,
} from './usersSlice';
export type { UsersState } from './usersSlice';

// Service exports (funciones API) - con alias para evitar conflictos
export {
  getAllUsers,
  createUser as createUserApi,
  deleteUser as deleteUserApi,
  updateUser as updateUserApi,
} from './services/userService';
export type { UserData, CreateUserData, UpdateUserData, UserResponse } from './services/userService';
