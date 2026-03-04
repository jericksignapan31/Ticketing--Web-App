import { PartialType } from '@nestjs/swagger';
import { CreateRepairLogDto } from './create-repair-log.dto';

export class UpdateRepairLogDto extends PartialType(CreateRepairLogDto) {}
