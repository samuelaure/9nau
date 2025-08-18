import { UpsertScheduleDto as IUpsertScheduleDto } from '@9nau/types';
import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class UpsertScheduleDto implements IUpsertScheduleDto {
  @IsString()
  @IsNotEmpty()
  blockId!: string;

  @IsISO8601()
  @IsNotEmpty()
  startDate!: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string | null;

  @IsString()
  @IsOptional()
  rrule?: string | null;
}
