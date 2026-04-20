import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateBrandDto, CreateWorkspaceDto } from './workspaces.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString } from 'class-validator';

class UpdateRoleDto {
  @IsString()
  role!: string;
}

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly svc: WorkspacesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getWorkspaces(@CurrentUser() user: { sub: string }) {
    return this.svc.getWorkspacesForUser(user.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createWorkspace(@CurrentUser() user: { sub: string }, @Body() dto: CreateWorkspaceDto) {
    return this.svc.createWorkspace(user.sub, dto);
  }

  @Get(':workspaceId/brands')
  @UseGuards(JwtAuthGuard)
  getBrands(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.svc.getBrandsForWorkspace(user.sub, workspaceId);
  }

  /** Service-to-service: fetch brands for a workspace without user JWT */
  @Get(':workspaceId/brands/service')
  @UseGuards(ServiceAuthGuard)
  getBrandsService(@Param('workspaceId') workspaceId: string) {
    // No user-level auth — trusted service call
    return this.svc['prisma'].brand.findMany({ where: { workspaceId } });
  }

  @Post(':workspaceId/brands')
  @UseGuards(JwtAuthGuard)
  createBrand(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBrandDto,
  ) {
    return this.svc.createBrand(user.sub, workspaceId, dto);
  }

  @Get(':workspaceId/members')
  @UseGuards(JwtAuthGuard)
  getMembers(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.svc.getWorkspaceMembers(user.sub, workspaceId);
  }

  @Put(':workspaceId/members/:targetUserId')
  @UseGuards(JwtAuthGuard)
  updateMemberRole(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.svc.updateMemberRole(user.sub, workspaceId, targetUserId, dto.role);
  }
}
