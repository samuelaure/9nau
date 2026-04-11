import axios from 'axios';
import { API_CONFIG } from '@/constants';
import { SelectedBrandAction } from '@/components/SpecialFunctionsModal';

class NauthenticityService {
  private readonly client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    headers: {
      'x-nau-service-key': API_CONFIG.serviceKey,
    },
  });

  async triggerSpecialFunctions(url: string, selectedActions: SelectedBrandAction[]) {
    console.log('[NauthenticityService] Triggering functions for:', url);
    
    const results = [];
    
    for (const brandAction of selectedActions) {
      const { brandId, actions } = brandAction;
      
      // Action A: Proactive (Add Profile)
      if (actions.includes('PROACTIVE_COMMENT')) {
        try {
          // Extract username from URL if possible
          const usernameMatch = url.match(/instagram.com\/([^/?#&]+)/);
          const username = usernameMatch ? usernameMatch[1] : null;
          
          if (username) {
            await this.client.post('/integrations/nauthenticity/targets', {
              brandId,
              usernames: [username],
            });
            results.push({ brandId, action: 'PROACTIVE_COMMENT', status: 'success' });
          }
        } catch (error) {
          console.error('[NauthenticityService] Action A failed:', error);
          results.push({ brandId, action: 'PROACTIVE_COMMENT', status: 'error' });
        }
      }
      
      // Action B: Reactive (Generate Comment)
      if (actions.includes('REACTIVE_COMMENT')) {
        try {
          const response = await this.client.post('/integrations/nauthenticity/generate-comment', {
            targetUrl: url,
            brandId,
          });
          results.push({ 
            brandId, 
            action: 'REACTIVE_COMMENT', 
            status: 'success',
            suggestions: response.data.suggestions || []
          });
        } catch (error) {
          console.error('[NauthenticityService] Action B failed:', error);
          results.push({ brandId, action: 'REACTIVE_COMMENT', status: 'error' });
        }
      }
    }
    
    return results;
  }
}

export const nauthenticityService = new NauthenticityService();
