import {
  Body,
  Controller,
  Post,
  UseGuards,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { StorageService } from './storage.service';
import { randomUUID } from 'crypto';

interface UploadRequestDto {
  mimeType: string;
  /** Optional prefix, e.g. "users/abc123/captures" */
  prefix?: string;
}

@Controller('media')
@UseGuards(ServiceAuthGuard)
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Request a pre-signed URL for direct client-to-R2 upload.
   *
   * Returns { uploadUrl, storageKey, cdnUrl } where:
   *   - uploadUrl: HTTP PUT target (expires in 15 min)
   *   - storageKey: the R2 object key to store in the DB
   *   - cdnUrl: the public playback URL once upload completes
   */
  @Post('upload-request')
  async requestUploadUrl(@Body() dto: UploadRequestDto) {
    if (!this.storageService.isConfigured) {
      throw new ServiceUnavailableException('Storage service is not configured on this server');
    }

    if (!dto.mimeType) {
      throw new BadRequestException('mimeType is required');
    }

    const ext = this.extensionFromMime(dto.mimeType);
    const id = randomUUID();
    const prefix = dto.prefix ?? 'uploads';
    const storageKey = `${prefix}/${id}.${ext}`;

    this.logger.log(`Issuing upload URL for key: ${storageKey} (${dto.mimeType})`);

    const { uploadUrl } = await this.storageService.getUploadUrl(storageKey, dto.mimeType);
    const cdnUrl = this.storageService.getDownloadUrl(storageKey);

    return { uploadUrl, storageKey, cdnUrl };
  }

  private extensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
    };
    return map[mimeType] ?? 'bin';
  }
}
