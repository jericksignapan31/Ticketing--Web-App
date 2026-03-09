import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new employee (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({ status: 409, description: 'Employee already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees or filter by status' })
  @ApiQuery({
    name: 'status',
    description: 'Filter by status: active, inactive, or pending',
    required: false,
    enum: ['active', 'inactive', 'pending'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of employees',
  })
  findAll(@Query('status') status?: 'active' | 'inactive' | 'pending') {
    return this.employeeService.findAll(status);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search employees by name or email' })
  @ApiQuery({
    name: 'q',
    description: 'Search term',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching employees',
  })
  search(@Query('q') searchTerm: string) {
    return this.employeeService.search(searchTerm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an employee (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update employee employment status (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'Employment status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateEmploymentStatus(
    @Param('id') id: string,
    @Body('employment_status') employment_status: boolean,
  ) {
    return this.employeeService.updateEmploymentStatus(id, employment_status);
  }

  @Patch(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify and activate employee account (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee account verified and activated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  verifyEmployee(@Param('id') id: string) {
    return this.employeeService.verifyEmployee(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an employee (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    example: 'EMP001',
  })
  @ApiResponse({
    status: 204,
    description: 'Employee deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
