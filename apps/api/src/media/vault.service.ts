import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export interface VaultUploadResult {
  fileId: string;
  fileUniqueId: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class VaultService implements OnModuleInit {
  private readonly logger = new Logger(VaultService.name);
  private client: AxiosInstance;
  private botToken: string;
  private channelId: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.channelId = this.configService.get<string>('VAULT_CHANNEL_ID', '');

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      timeout: 120_000, // 2 minutes for large uploads
    });
  }

  onModuleInit() {
    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not set — VaultService will be unavailable',
      );
    }
    if (!this.channelId) {
      this.logger.warn(
        'VAULT_CHANNEL_ID not set — VaultService will be unavailable',
      );
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.botToken && this.channelId);
  }

  /**
   * Upload a media file to the Telegram Vault channel.
   * Uses sendDocument to preserve original quality (no Telegram compression).
   *
   * @param fileBuffer - Raw file data
   * @param filename - Original filename
   * @param mimeType - MIME type (e.g. "video/mp4", "image/jpeg")
   * @param caption - Optional caption for the message
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    caption?: string,
  ): Promise<VaultUploadResult> {
    if (!this.isConfigured) {
      throw new Error(
        'VaultService is not configured (missing TELEGRAM_BOT_TOKEN or VAULT_CHANNEL_ID)',
      );
    }

    this.logger.log(
      `Uploading to Vault: ${filename} (${mimeType}, ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`,
    );

    const form = new FormData();
    form.append('chat_id', this.channelId);
    form.append('document', fileBuffer, {
      filename,
      contentType: mimeType,
    });
    if (caption) {
      form.append('caption', caption.slice(0, 1024)); // Telegram caption limit
    }

    try {
      const response = await this.client.post('/sendDocument', form, {
        headers: form.getHeaders(),
        maxContentLength: 2 * 1024 * 1024 * 1024, // 2GB
        maxBodyLength: 2 * 1024 * 1024 * 1024,
      });

      const result = response.data?.result;
      if (!result?.document) {
        this.logger.error('Telegram response missing document field', result);
        throw new Error('Telegram upload did not return a document');
      }

      const doc = result.document;
      this.logger.log(
        `Upload successful: file_id=${doc.file_id}, size=${doc.file_size}`,
      );

      return {
        fileId: doc.file_id,
        fileUniqueId: doc.file_unique_id,
        fileSize: doc.file_size,
        mimeType: doc.mime_type || mimeType,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload to Vault: ${message}`);
      throw error;
    }
  }

  /**
   * Get a readable stream for a file stored in the Telegram Vault.
   * Uses Telegram's getFile → file_path → download endpoint.
   *
   * @param fileId - The Telegram file_id obtained during upload
   * @returns A readable stream of the file content and content metadata
   */
  async streamMedia(
    fileId: string,
  ): Promise<{ stream: Readable; contentType: string; fileSize: number }> {
    if (!this.isConfigured) {
      throw new Error(
        'VaultService is not configured (missing TELEGRAM_BOT_TOKEN or VAULT_CHANNEL_ID)',
      );
    }

    // Step 1: Get file path from Telegram
    const fileInfo = await this.client.get('/getFile', {
      params: { file_id: fileId },
    });

    const filePath = fileInfo.data?.result?.file_path;
    const fileSize = fileInfo.data?.result?.file_size || 0;

    if (!filePath) {
      throw new Error(`Telegram getFile returned no file_path for ${fileId}`);
    }

    // Step 2: Stream the file from Telegram's file download API
    const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;

    const downloadResponse = await axios.get(downloadUrl, {
      responseType: 'stream',
      timeout: 120_000,
    });

    // Infer content type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      webm: 'video/webm',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return {
      stream: downloadResponse.data,
      contentType,
      fileSize,
    };
  }
}
