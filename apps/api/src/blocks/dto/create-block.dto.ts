import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';
import { CreateBlockDto as ICreateBlockDto } from '@9nau/types';

/**
 * Data Transfer Object for creating a new Block.
 * Implements the shared interface from @9nau/types for consistency.
 * Uses class-validator decorators for automatic request body validation.
 */
export class CreateBlockDto implements ICreateBlockDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  parentId?: string | null;

  @IsObject()
  properties!: Record<string, unknown>;
}
