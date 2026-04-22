import { API_CONFIG } from '@/constants';
import { getSetting } from '@/repositories/SettingsRepository';

export interface NauBrand {
  id: string;
  name: string;
  timezone: string;
  isActive: boolean;
}

export interface NauWorkspace {
  id: string;
  name: string;
  role: string;
  brands: NauBrand[];
}

class WorkspacesService {
  async fetchBrands(): Promise<NauBrand[]> {
    const userId = await getSetting('nau_user_id');
    if (!userId) return [];

    try {
      const res = await fetch(
        `${API_CONFIG.baseUrl}/workspaces/service/user/${userId}`,
        { headers: { 'x-nau-service-key': API_CONFIG.serviceKey } },
      );
      if (!res.ok) return [];
      const workspaces: NauWorkspace[] = await res.json();
      return workspaces.flatMap((ws) =>
        ws.brands.filter((b) => b.isActive).map((b) => ({ ...b, workspaceName: ws.name })),
      );
    } catch {
      return [];
    }
  }

  async fetchWorkspaces(): Promise<NauWorkspace[]> {
    const userId = await getSetting('nau_user_id');
    if (!userId) return [];

    try {
      const res = await fetch(
        `${API_CONFIG.baseUrl}/workspaces/service/user/${userId}`,
        { headers: { 'x-nau-service-key': API_CONFIG.serviceKey } },
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }
}

export const workspacesService = new WorkspacesService();
