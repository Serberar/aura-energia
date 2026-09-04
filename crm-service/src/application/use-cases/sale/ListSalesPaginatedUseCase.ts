import { ISaleRepository } from '@domain/repositories/ISaleRepository';
import { SaleFiltersInternal } from '@infrastructure/express/validation/saleSchemas';
import { PaginationOptions } from '@domain/types';
import { CurrentUser } from '@application/shared/types/CurrentUser';
import { checkRolePermission } from '@application/shared/authorization/checkRolePermission';
import { rolePermissions } from '@application/shared/authorization/rolePermissions';

export class ListSalesPaginatedUseCase {
  constructor(private saleRepo: ISaleRepository) {}

  async execute(filters: SaleFiltersInternal, pagination: PaginationOptions, currentUser: CurrentUser) {
    checkRolePermission(
      currentUser,
      rolePermissions.sale.ListSalesPaginatedUseCase,
      'listar ventas paginadas'
    );

    return this.saleRepo.listPaginatedWithRelations(filters, pagination);
  }
}
