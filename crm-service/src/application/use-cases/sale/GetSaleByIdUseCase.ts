import { ISaleRepository } from '@domain/repositories/ISaleRepository';
import { CurrentUser } from '@application/shared/types/CurrentUser';
import { checkRolePermission } from '@application/shared/authorization/checkRolePermission';
import { rolePermissions } from '@application/shared/authorization/rolePermissions';
import { NotFoundError } from '@application/shared/AppError';

export class GetSaleByIdUseCase {
  constructor(private saleRepo: ISaleRepository) {}

  async execute(saleId: string, currentUser: CurrentUser) {
    checkRolePermission(
      currentUser,
      rolePermissions.sale.GetSaleByIdUseCase,
      'ver venta'
    );

    const saleWithRelations = await this.saleRepo.findWithRelations(saleId);
    if (!saleWithRelations) {
      throw new NotFoundError('Venta', saleId);
    }

    return saleWithRelations;
  }
}
