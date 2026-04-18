import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID', '');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME', '');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  onModuleInit() {
    if (!this.bucket) {
      this.logger.warn('R2_BUCKET_NAME not set — StorageService will be unavailable');
    }
    if (!this.publicUrl) {
      this.logger.warn('R2_PUBLIC_URL not set — CDN URLs will be unavailable');
    }
  }

  get isConfigured(): boolean {
    return Boolean(
      this.bucket &&
        this.publicUrl &&
        this.configService.get('R2_ACCOUNT_ID') &&
        this.configService.get('R2_ACCESS_KEY_ID') &&
        this.configService.get('R2_SECRET_ACCESS_KEY'),
    );
  }

  /**
   * Generates a pre-signed PutObject URL valid for 15 minutes.
   * The client uploads the file directly to R2 using this URL (HTTP PUT).
   */
  async getUploadUrl(
    key: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });

    return { uploadUrl, storageKey: key };
  }

  /**
   * Returns the public CDN URL for a storage key.
   * Never exposes R2 credentials or the internal bucket URL.
   */
  getDownloadUrl(storageKey: string): string {
    const base = this.publicUrl.endsWith('/') ? this.publicUrl.slice(0, -1) : this.publicUrl;
    return `${base}/${storageKey}`;
  }
}
