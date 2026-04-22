import { IsString, MinLength, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

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

  @IsOptional()
  @IsIn(['owner', 'admin', 'member'] satisfies WorkspaceRole[])
  role?: WorkspaceRole;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
