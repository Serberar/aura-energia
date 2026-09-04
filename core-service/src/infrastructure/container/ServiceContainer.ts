import { UserPrismaRepository } from '@infrastructure/prisma/UserPrismaRepository';
import { AllowedIpPrismaRepository } from '@infrastructure/prisma/AllowedIpPrismaRepository';
import { SystemSettingPrismaRepository } from '@infrastructure/prisma/SystemSettingPrismaRepository';

import { RegisterUserUseCase } from '@application/use-cases/user/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/user/LoginUserUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/user/RefreshTokenUseCase';
import { LogoutUserUseCase } from '@application/use-cases/user/LogoutUserUseCase';
import { GetAllUsersUseCase } from '@application/use-cases/user/GetAllUsersUseCase';
import { DeleteUserUseCase } from '@application/use-cases/user/DeleteUserUseCase';
import { UpdateUserUseCase } from '@application/use-cases/user/UpdateUserUseCase';

import { ListAllowedIpsUseCase } from '@application/use-cases/allowedIp/ListAllowedIpsUseCase';
import { CreateAllowedIpUseCase } from '@application/use-cases/allowedIp/CreateAllowedIpUseCase';
import { DeleteAllowedIpUseCase } from '@application/use-cases/allowedIp/DeleteAllowedIpUseCase';

import { GetSystemSettingUseCase } from '@application/use-cases/settings/GetSystemSettingUseCase';
import { SetSystemSettingUseCase } from '@application/use-cases/settings/SetSystemSettingUseCase';

import { HealthChecker } from '@infrastructure/express/health/HealthChecker';
import { AppConfig, loadConfig } from '@infrastructure/config/AppConfig';
import logger from '@infrastructure/observability/logger/logger';

class ServiceContainer {
  private static instance: ServiceContainer;

  private _config?: AppConfig;

  // Repositorios
  private _userRepository?: UserPrismaRepository;
  private _allowedIpRepository?: AllowedIpPrismaRepository;
  private _systemSettingRepository?: SystemSettingPrismaRepository;

  // Casos de uso de Usuario
  private _registerUserUseCase?: RegisterUserUseCase;
  private _loginUserUseCase?: LoginUserUseCase;
  private _refreshTokenUseCase?: RefreshTokenUseCase;
  private _logoutUserUseCase?: LogoutUserUseCase;
  private _getAllUsersUseCase?: GetAllUsersUseCase;
  private _deleteUserUseCase?: DeleteUserUseCase;
  private _updateUserUseCase?: UpdateUserUseCase;

  // Casos de uso de AllowedIp
  private _listAllowedIpsUseCase?: ListAllowedIpsUseCase;
  private _createAllowedIpUseCase?: CreateAllowedIpUseCase;
  private _deleteAllowedIpUseCase?: DeleteAllowedIpUseCase;

  // Casos de uso de SystemSetting
  private _getSystemSettingUseCase?: GetSystemSettingUseCase;
  private _setSystemSettingUseCase?: SetSystemSettingUseCase;

  private _healthChecker?: HealthChecker;

  private constructor() {}

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // CONFIGURACIÓN
  get config(): AppConfig {
    if (!this._config) {
      this._config = loadConfig();
      logger.info('Configuration loaded', {
        environment: this._config.app.environment,
        version: this._config.app.version,
        database: {
          poolSize: this._config.database.poolSize,
          timeout: this._config.database.timeout,
        },
      });
    }
    return this._config;
  }

  // REPOSITORIOS
  get userRepository(): UserPrismaRepository {
    if (!this._userRepository) {
      this._userRepository = new UserPrismaRepository();
    }
    return this._userRepository;
  }

  get allowedIpRepository(): AllowedIpPrismaRepository {
    if (!this._allowedIpRepository) {
      this._allowedIpRepository = new AllowedIpPrismaRepository();
    }
    return this._allowedIpRepository;
  }

  get systemSettingRepository(): SystemSettingPrismaRepository {
    if (!this._systemSettingRepository) {
      this._systemSettingRepository = new SystemSettingPrismaRepository();
    }
    return this._systemSettingRepository;
  }

  // CASOS DE USO: USUARIO
  get registerUserUseCase(): RegisterUserUseCase {
    if (!this._registerUserUseCase) {
      this._registerUserUseCase = new RegisterUserUseCase(this.userRepository);
    }
    return this._registerUserUseCase;
  }

  get loginUserUseCase(): LoginUserUseCase {
    if (!this._loginUserUseCase) {
      this._loginUserUseCase = new LoginUserUseCase(this.userRepository);
    }
    return this._loginUserUseCase;
  }

  get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = new RefreshTokenUseCase(this.userRepository);
    }
    return this._refreshTokenUseCase;
  }

  get logoutUserUseCase(): LogoutUserUseCase {
    if (!this._logoutUserUseCase) {
      this._logoutUserUseCase = new LogoutUserUseCase(this.userRepository);
    }
    return this._logoutUserUseCase;
  }

  get getAllUsersUseCase(): GetAllUsersUseCase {
    if (!this._getAllUsersUseCase) {
      this._getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    }
    return this._getAllUsersUseCase;
  }

  get deleteUserUseCase(): DeleteUserUseCase {
    if (!this._deleteUserUseCase) {
      this._deleteUserUseCase = new DeleteUserUseCase(this.userRepository);
    }
    return this._deleteUserUseCase;
  }

  get updateUserUseCase(): UpdateUserUseCase {
    if (!this._updateUserUseCase) {
      this._updateUserUseCase = new UpdateUserUseCase(this.userRepository);
    }
    return this._updateUserUseCase;
  }

  // CASOS DE USO: ALLOWED IP
  get listAllowedIpsUseCase(): ListAllowedIpsUseCase {
    if (!this._listAllowedIpsUseCase) {
      this._listAllowedIpsUseCase = new ListAllowedIpsUseCase(this.allowedIpRepository);
    }
    return this._listAllowedIpsUseCase;
  }

  get createAllowedIpUseCase(): CreateAllowedIpUseCase {
    if (!this._createAllowedIpUseCase) {
      this._createAllowedIpUseCase = new CreateAllowedIpUseCase(this.allowedIpRepository);
    }
    return this._createAllowedIpUseCase;
  }

  get deleteAllowedIpUseCase(): DeleteAllowedIpUseCase {
    if (!this._deleteAllowedIpUseCase) {
      this._deleteAllowedIpUseCase = new DeleteAllowedIpUseCase(this.allowedIpRepository);
    }
    return this._deleteAllowedIpUseCase;
  }

  // CASOS DE USO: SYSTEM SETTING
  get getSystemSettingUseCase(): GetSystemSettingUseCase {
    if (!this._getSystemSettingUseCase) {
      this._getSystemSettingUseCase = new GetSystemSettingUseCase(this.systemSettingRepository);
    }
    return this._getSystemSettingUseCase;
  }

  get setSystemSettingUseCase(): SetSystemSettingUseCase {
    if (!this._setSystemSettingUseCase) {
      this._setSystemSettingUseCase = new SetSystemSettingUseCase(this.systemSettingRepository);
    }
    return this._setSystemSettingUseCase;
  }

  // HEALTH CHECKER
  get healthChecker(): HealthChecker {
    if (!this._healthChecker) {
      this._healthChecker = new HealthChecker(
        this.userRepository,
        null,
        null,
        this.config.app.version,
        this.config.app.environment
      );
      logger.info('Health checker initialized');
    }
    return this._healthChecker;
  }

  getSystemInfo() {
    return {
      app: this.config.app,
      services: {
        database: {
          connected: true,
          poolSize: this.config.database.poolSize,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  configureEnvironment(newConfig: Partial<AppConfig>): void {
    if (this._config) {
      this._config = { ...this._config, ...newConfig };
      logger.info('Configuration updated', newConfig);
    }
  }

  public reset(): void {
    this._userRepository = undefined;
    this._allowedIpRepository = undefined;
    this._systemSettingRepository = undefined;

    this._registerUserUseCase = undefined;
    this._loginUserUseCase = undefined;
    this._refreshTokenUseCase = undefined;
    this._logoutUserUseCase = undefined;
    this._getAllUsersUseCase = undefined;
    this._deleteUserUseCase = undefined;
    this._updateUserUseCase = undefined;

    this._listAllowedIpsUseCase = undefined;
    this._createAllowedIpUseCase = undefined;
    this._deleteAllowedIpUseCase = undefined;

    this._getSystemSettingUseCase = undefined;
    this._setSystemSettingUseCase = undefined;

    this._healthChecker = undefined;

    logger.info('ServiceContainer reset completed');
  }

  public resetAll(): void {
    this.reset();
    this._config = undefined;
    logger.info('ServiceContainer complete reset (including config)');
  }
}

export const serviceContainer = ServiceContainer.getInstance();
