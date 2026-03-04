import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['employee_id'] as const),
) {}
