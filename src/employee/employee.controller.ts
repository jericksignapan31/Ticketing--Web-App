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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({ status: 409, description: 'Employee already exists' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({
    status: 200,
    description: 'List of all employees',
  })
  findAll() {
    return this.employeeService.findAll();
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
  @ApiOperation({ summary: 'Update an employee' })
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
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an employee' })
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
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
