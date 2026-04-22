import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, CreateBrandDto, AddMemberDto, UpdateBrandDto } from './workspaces.dto';
import { NauthenticityService } from '../integrations/nauthenticity.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nauthenticity: NauthenticityService,
  ) {}

  async getWorkspaceById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { brands: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return { workspace };
  }

  async getWorkspacesForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { include: { brands: true } } },
    });
    return memberships.map((m) => ({ ...m.workspace, role: m.role }));
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        members: { create: { userId, role: WorkspaceRole.owner } },
      },
      include: { members: true, brands: true },
    });
  }

  async getBrandsForWorkspace(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    return this.prisma.brand.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createBrand(userId: string, workspaceId: string, dto: CreateBrandDto) {
    await this.assertMembership(userId, workspaceId);
    return this.prisma.brand.create({
      data: { workspaceId, name: dto.name, timezone: dto.timezone ?? 'UTC' },
    });
  }

  async getBrandsForWorkspaceService(workspaceId: string) {
    return this.prisma.brand.findMany({ where: { workspaceId } });
  }

  async createBrandService(workspaceId: string, dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: { workspaceId, name: dto.name, timezone: dto.timezone ?? 'UTC' },
    });
  }

  async updateBrandService(workspaceId: string, brandId: string, dto: UpdateBrandDto) {
    return this.prisma.brand.update({
      where: { id: brandId, workspaceId },
      data: dto,
    });
  }

  async deleteBrandService(workspaceId: string, brandId: string) {
    return this.prisma.brand.delete({
      where: { id: brandId, workspaceId },
    });
  }

  async deleteBrand(userId: string, workspaceId: string, brandId: string) {
    await this.assertMembership(userId, workspaceId);
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId, workspaceId } });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.prisma.brand.delete({ where: { id: brandId } });
  }

  async deleteWorkspace(userId: string, workspaceId: string) {
    const member = await this.assertMembership(userId, workspaceId);
    if (member.role !== 'owner') throw new ForbiddenException('Only owners can delete a workspace');
    return this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async updateBrand(userId: string, workspaceId: string, brandId: string, dto: UpdateBrandDto) {
    // 1. Verify existence and membership in CURRENT workspace
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');
    await this.assertMembership(userId, workspaceId);

    // 2. If moving workspace, verify membership in TARGET workspace
    if (dto.workspaceId && dto.workspaceId !== workspaceId) {
      await this.assertMembership(userId, dto.workspaceId);
    }

    // 3. Update master record in 9naŭ
    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: dto,
    });

    // 4. Sync structural changes to Nauthenticity operational copy
    if (dto.workspaceId) {
      await this.nauthenticity.syncBrandStructuralData(brandId, { workspaceId: dto.workspaceId });
    }

    return updated;
  }

  private async assertMembership(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    return member;
  }

  async getWorkspaceMembers(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async renameWorkspace(userId: string, workspaceId: string, name: string) {
    await this.assertMembership(userId, workspaceId);
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async updateMemberRole(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    role: WorkspaceRole,
  ) {
    const actor = await this.assertMembership(actorId, workspaceId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only owners can change roles');
    return this.prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: role as WorkspaceRole },
    });
  }

  async addMemberByEmail(actorId: string, workspaceId: string, dto: AddMemberDto) {
    const actor = await this.assertMembership(actorId, workspaceId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only owners can add members');

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User with that email not found');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId, role: (dto.role as WorkspaceRole) ?? WorkspaceRole.member },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(actorId: string, workspaceId: string, targetUserId: string) {
    const actor = await this.assertMembership(actorId, workspaceId);
    if (actor.role !== 'owner' && actorId !== targetUserId) {
      throw new ForbiddenException('Only owners can remove members (or yourself)');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') {
      const ownersCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: 'owner' },
      });
      if (ownersCount <= 1) throw new ForbiddenException('Cannot remove the last owner');
    }

    return this.prisma.workspaceMember.delete({
      where: { id: member.id },
    });
  }
}
