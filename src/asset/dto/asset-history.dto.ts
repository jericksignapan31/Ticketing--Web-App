import { ApiProperty } from '@nestjs/swagger';

export class AssetHistoryEventDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'status_change', enum: ['status_change', 'assignment', 'repair', 'movement'] })
  type: 'status_change' | 'assignment' | 'repair' | 'movement';

  @ApiProperty({ example: 'Status changed from available to in_use' })
  description: string;

  @ApiProperty({ nullable: true })
  previousValue?: string;

  @ApiProperty({ nullable: true })
  newValue?: string;

  @ApiProperty({ example: 'John Admin' })
  changedBy: string;

  @ApiProperty({ example: 'ADMIN' })
  changedByRole?: string;

  @ApiProperty({ example: '2026-05-10T14:30:00Z' })
  timestamp: string;

  @ApiProperty({ type: Object, nullable: true })
  details?: any;
}

export class AssetHistoryResponseDto {
  @ApiProperty({ example: 1 })
  assetId: number;

  @ApiProperty({ example: 'LAP-2024-001' })
  assetTag: string;

  @ApiProperty({ example: 15 })
  totalEvents: number;

  @ApiProperty({ type: [AssetHistoryEventDto] })
  events: AssetHistoryEventDto[];
}
