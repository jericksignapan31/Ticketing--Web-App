import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Employee } from './entities/employee.entity';
import { UserAccount } from './entities/user-account.entity';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'ithelp_desk.db',
      entities: [Employee, UserAccount],
      synchronize: true, // Set to false in production
    }),
    AuthModule,
    EmployeeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
