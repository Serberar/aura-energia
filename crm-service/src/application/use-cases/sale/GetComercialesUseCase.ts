import { ISaleRepository } from '@domain/repositories/ISaleRepository';
import { CurrentUser } from '@application/shared/types/CurrentUser';
import { checkRolePermission } from '@application/shared/authorization/checkRolePermission';
import { rolePermissions } from '@application/shared/authorization/rolePermissions';

export class GetComercialesUseCase {
  constructor(private saleRepo: ISaleRepository) {}

  async execute(currentUser: CurrentUser): Promise<string[]> {
    checkRolePermission(
      currentUser,
      rolePermissions.sale.GetComercialesUseCase,
      'obtener lista de comerciales'
    );

    return this.saleRepo.getDistinctComerciales();
  }
}
