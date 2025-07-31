import { IsOptional, IsString } from 'class-validator';

export class FindBlocksQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
