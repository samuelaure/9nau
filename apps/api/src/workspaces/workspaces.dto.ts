import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

export class CreateBrandDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class AddMemberDto {
  @IsString()
  email!: string;

  @IsString()
  @IsOptional()
  role?: string;
}
