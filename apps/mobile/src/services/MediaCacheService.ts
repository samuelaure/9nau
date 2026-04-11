import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';

export const MediaCacheService = {
  getFilename: (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
  },

  getLocalUri: (url: string) => {
    const filename = MediaCacheService.getFilename(url);
    return `${FileSystem.documentDirectory}${filename}`;
  },

  getThumbnailUri: (videoFilename: string) => {
    return `${FileSystem.documentDirectory}${videoFilename}_thumb.jpg`;
  },

  ensureMediaCached: async (url: string): Promise<string> => {
    const localUri = MediaCacheService.getLocalUri(url);
    const info = await FileSystem.getInfoAsync(localUri);

    if (info.exists) {
      return localUri;
    }

    try {
      const download = await FileSystem.downloadAsync(url, localUri);
      return download.uri;
    } catch (error) {
      console.error('Failed to download media:', error);
      return url;
    }
  },

  ensureThumbnailCached: async (videoLocalUri: string): Promise<string | null> => {
    if (!videoLocalUri) return null;

    // Generate a consistent filename for the thumbnail based on the video filename
    const videoFilename = videoLocalUri.split('/').pop() || 'video';
    const thumbUri = MediaCacheService.getThumbnailUri(videoFilename);

    const info = await FileSystem.getInfoAsync(thumbUri);
    if (info.exists) {
      return thumbUri;
    }

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoLocalUri, {
        time: 1000, // Capture at 1s
        quality: 0.7,
      });

      // Move the generated thumbnail to our cache directory with the consistent name
      await FileSystem.moveAsync({
        from: uri,
        to: thumbUri
      });

      return thumbUri;
    } catch (e) {
      console.warn('Failed to generate thumbnail', e);
      return null;
    }
  },

  clearCache: async () => {
    const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
    for (const file of files) {
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${file}`);
    }
  },
};
