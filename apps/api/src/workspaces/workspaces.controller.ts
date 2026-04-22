import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateBrandDto, CreateWorkspaceDto, AddMemberDto, UpdateBrandDto } from './workspaces.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString } from 'class-validator';

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

  @Get('service/user/:userId')
  @UseGuards(ServiceAuthGuard)
  getWorkspacesServiceForUser(@Param('userId') userId: string) {
    return this.svc.getWorkspacesForUser(userId);
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

  @Delete(':workspaceId')
  @UseGuards(JwtAuthGuard)
  deleteWorkspace(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.svc.deleteWorkspace(user.sub, workspaceId);
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
    return this.svc.getBrandsForWorkspaceService(workspaceId);
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

  /** Service-to-service: create brand without user JWT */
  @Post(':workspaceId/brands/service')
  @UseGuards(ServiceAuthGuard)
  createBrandService(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBrandDto,
  ) {
    return this.svc.createBrandService(workspaceId, dto);
  }

  @Patch(':workspaceId/brands/:brandId')
  @UseGuards(JwtAuthGuard)
  updateBrand(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('brandId') brandId: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.svc.updateBrand(user.sub, workspaceId, brandId, dto);
  }

  /** Service-to-service: update brand without user JWT */
  @Patch(':workspaceId/brands/:brandId/service')
  @UseGuards(ServiceAuthGuard)
  updateBrandService(
    @Param('workspaceId') workspaceId: string,
    @Param('brandId') brandId: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.svc.updateBrandService(workspaceId, brandId, dto);
  }

  @Delete(':workspaceId/brands/:brandId')
  @UseGuards(JwtAuthGuard)
  deleteBrand(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('brandId') brandId: string,
  ) {
    return this.svc.deleteBrand(user.sub, workspaceId, brandId);
  }

  /** Service-to-service: delete brand without user JWT */
  @Delete(':workspaceId/brands/:brandId/service')
  @UseGuards(ServiceAuthGuard)
  deleteBrandService(
    @Param('workspaceId') workspaceId: string,
    @Param('brandId') brandId: string,
  ) {
    return this.svc.deleteBrandService(workspaceId, brandId);
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
