import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Brand } from './entities/brand.entity';
import { Asset } from './entities/asset.entity';
import { Ticket } from './entities/ticket.entity';
import { RepairLog } from './entities/repair-log.entity';
import { AssetStatusHistory } from './entities/asset-status-history.entity';
import { AssetAssignmentHistory } from './entities/asset-assignment-history.entity';
import { AssetMovementHistory } from './entities/asset-movement-history.entity';
import { Message } from './chat/entities/message.entity';
import { Conversation } from './chat/entities/conversation.entity';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { BrandModule } from './brand/brand.module';
import { AssetModule } from './asset/asset.module';
import { TicketModule } from './ticket/ticket.module';
import { RepairLogModule } from './repair-log/repair-log.module';
import { UserAccountModule } from './user-account/user-account.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (60 seconds)
        limit: 100, // Max requests per ttl window
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Employee,
          UserAccount,
          Branch,
          Department,
          Brand,
          Asset,
          Ticket,
          RepairLog,
          AssetStatusHistory,
          AssetAssignmentHistory,
          AssetMovementHistory,
          Message,
          Conversation,
        ],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: ['error', 'warn', 'query'],
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? {
                rejectUnauthorized:
                  configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') ===
                  'true',
              }
            : undefined,
      }),
    }),
    AuthModule,
    EmployeeModule,
    BranchModule,
    DepartmentModule,
    BrandModule,
    AssetModule,
    TicketModule,
    RepairLogModule,
    UserAccountModule,
    DashboardModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
  ],
})
export class AppModule {}
