import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserAccountService } from './user-account.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('User Accounts')
@Controller('user-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all user accounts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all user accounts with employee details',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAll() {
    return this.userAccountService.findAll();
  }

  @Get('user/:user_id')
  @ApiOperation({ summary: 'Get user account by user ID' })
  @ApiParam({
    name: 'user_id',
    description: 'User Account UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User account found',
  })
  @ApiResponse({ status: 404, description: 'User account not found' })
  findByUserId(@Param('user_id') user_id: string) {
    return this.userAccountService.findByUserId(user_id);
  }

  @Get('employee/:employee_id')
  @ApiOperation({ summary: 'Get user account by employee ID' })
  @ApiParam({
    name: 'employee_id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'User account found',
  })
  @ApiResponse({ status: 404, description: 'User account not found' })
  findByEmployeeId(@Param('employee_id') employee_id: string) {
    return this.userAccountService.findByEmployeeId(employee_id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user account by username' })
  @ApiParam({
    name: 'username',
    description: 'Username',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'User account found',
  })
  @ApiResponse({ status: 404, description: 'User account not found' })
  findByUsername(@Param('username') username: string) {
    return this.userAccountService.findByUsername(username);
  }
}
