import { IsObject, IsOptional, IsString } from 'class-validator';
import { UpdateBlockDto as IUpdateBlockDto } from '@9nau/types';

/**
 * Data Transfer Object for updating an existing Block.
 * Implements the shared interface from @9nau/types for consistency.
 */
export class UpdateBlockDto implements IUpdateBlockDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  parentId?: string | null;
}
