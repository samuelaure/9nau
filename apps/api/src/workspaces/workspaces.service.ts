import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, CreateBrandDto, AddMemberDto } from './workspaces.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

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
        members: { create: { userId, role: 'owner' } },
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
    role: string,
  ) {
    const actor = await this.assertMembership(actorId, workspaceId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only owners can change roles');
    return this.prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role },
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
      data: { userId: user.id, workspaceId, role: dto.role ?? 'member' },
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
