import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NauStorage, createStorage } from 'nau-storage';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private storage: NauStorage | null = null;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('R2_ENDPOINT', '');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY', '');
    const bucket = this.configService.get<string>('R2_BUCKET_NAME', '');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (endpoint && accessKeyId && secretAccessKey && bucket && publicUrl) {
      this.storage = createStorage({ endpoint, accessKeyId, secretAccessKey, bucket, publicUrl });
    }
  }

  onModuleInit() {
    if (!this.storage) {
      this.logger.warn('R2 storage env vars incomplete — StorageService will be unavailable');
    }
  }

  get isConfigured(): boolean {
    return this.storage !== null;
  }

  /**
   * Generates a pre-signed PutObject URL valid for 15 minutes.
   * The client uploads the file directly to R2 using this URL (HTTP PUT).
   */
  async getUploadUrl(
    key: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    if (!this.storage) throw new Error('StorageService is not configured');

    const { uploadUrl, storageKey } = await this.storage.presignUpload(key, mimeType, 900);
    return { uploadUrl, storageKey };
  }

  /**
   * Returns the public CDN URL for a storage key.
   */
  getDownloadUrl(storageKey: string): string {
    if (!this.storage) throw new Error('StorageService is not configured');
    return this.storage.cdnUrl(storageKey);
  }
}
