import { MediaItem } from '@/repositories/PostRepository';

export interface ApifyScrapResult {
  status: 'success' | 'error' | 'restricted';
  username?: string;
  instagram_user_id?: string;
  profile_image?: string;
  instagram_caption?: string;
  mediaItems?: MediaItem[];
}

export interface ApifyProfileResult {
  status: 'success' | 'error';
  id?: string;
  username?: string;
  profile_image?: string;
}

/**
 * Service to interact directly with the Apify API.
 * This removes the dependency on Make.com for orchestration.
 */
export class ApifyService {
  /**
   * Scrapes an Instagram post using the apify/instagram-scraper actor.
   * Uses the run-sync-get-dataset-items endpoint for immediate results.
   */
  static async scrapPost(instagramUrl: string, token: string): Promise<ApifyScrapResult> {
    const actorId = 'apify~instagram-scraper';
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;

    const input = {
      directUrls: [instagramUrl],
      resultsType: 'details',
      resultsLimit: 1,
      addParentData: false,
    };

    try {
      console.log(`[ApifyService] Scraping URL: ${instagramUrl}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Apify returned ${response.status}: ${await response.text()}`);
      }

      const items = await response.json();

      if (!Array.isArray(items) || items.length === 0) {
        return { status: 'error' };
      }

      const item = items[0];

      if (item.error === 'restricted_page') {
        return {
          status: 'restricted',
          instagram_caption: item.caption || item.title || item.description || 'Restricted Content',
        };
      }

      // Map Apify fields to our internal structure
      const mediaItems: MediaItem[] = [];

      // Handle Carousel / Single Image / Video
      if (item.childPosts && item.childPosts.length > 0) {
        item.childPosts.forEach((child: any) => {
          mediaItems.push({
            type: child.type === 'Video' ? 'video' : 'image',
            url: child.videoUrl || child.displayUrl,
          });
        });
      } else {
        mediaItems.push({
          type: item.type === 'Video' ? 'video' : 'image',
          url: item.videoUrl || item.displayUrl,
        });
      }

      const username = item.ownerUsername || item.owner?.username;
      const profileImage =
        item.ownerProfilePicUrl ||
        item.owner?.profile_pic_url ||
        `https://unavatar.io/instagram/${username}`;

      return {
        status: 'success',
        username,
        profile_image: profileImage,
        instagram_caption: item.caption,
        mediaItems,
      };
    } catch (error) {
      console.error('[ApifyService] Error scraping post:', error);
      return { status: 'error' };
    }
  }

  /**
   * Fetches detailed profile information using the coderx/instagram-profile-scraper-bio-posts actor.
   */
  static async fetchProfileInfo(username: string, token: string): Promise<ApifyProfileResult> {
    const actorId = 'coderx~instagram-profile-scraper-bio-posts';
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;

    const input = {
      usernames: [username],
    };

    try {
      console.log(`[ApifyService] Fetching profile info for: ${username}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Apify Profile Scraper returned ${response.status}`);
      }

      const items = await response.json();
      if (!Array.isArray(items) || items.length === 0) {
        return { status: 'error' };
      }

      const info = items[0];
      return {
        status: 'success',
        id: info.id,
        username: info.username,
        profile_image: info.hdProfilePicUrl || info.profilePicUrl,
      };
    } catch (error) {
      console.error('[ApifyService] Error fetching profile info:', error);
      return { status: 'error' };
    }
  }
}
