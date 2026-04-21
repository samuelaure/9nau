import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateBrandDto, CreateWorkspaceDto, AddMemberDto } from './workspaces.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString } from 'class-validator';

class UpdateRoleDto {
  @IsString()
  role!: string;
}

class RenameWorkspaceDto {
  @IsString()
  name!: string;
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

  /** Service-to-service: fetch a workspace by ID without user JWT */
  @Get(':workspaceId/service')
  @UseGuards(ServiceAuthGuard)
  getWorkspaceService(@Param('workspaceId') workspaceId: string) {
    return this.svc.getWorkspaceById(workspaceId);
  }

  @Patch(':workspaceId')
  @UseGuards(JwtAuthGuard)
  renameWorkspace(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RenameWorkspaceDto,
  ) {
    return this.svc.renameWorkspace(user.sub, workspaceId, dto.name);
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
  async updateMemberRole(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('targetUserId') targetUserId: string,
    @Body('role') role: string,
  ) {
    return this.svc.updateMemberRole(user.sub, workspaceId, targetUserId, role);
  }

  @Post(':workspaceId/members')
  @UseGuards(JwtAuthGuard)
  async addMember(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.svc.addMemberByEmail(user.sub, workspaceId, dto);
  }

  @Delete(':workspaceId/members/:targetUserId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.svc.removeMember(user.sub, workspaceId, targetUserId);
  }
}
