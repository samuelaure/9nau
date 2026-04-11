import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import { VaultService } from './vault.service';

@Controller('media')
@UseGuards(ServiceAuthGuard)
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly vaultService: VaultService) {}

  /**
   * Upload a media file to the Telegram Vault.
   * Accepts multipart/form-data with a single file field named "file".
   *
   * Returns: { fileId, fileUniqueId, fileSize, mimeType }
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per upload via Telegram Bot API (standard limit)
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!this.vaultService.isConfigured) {
      throw new ServiceUnavailableException(
        'Vault storage is not configured on this server',
      );
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(
      `Received upload: ${file.originalname} (${file.mimetype}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    );

    const result = await this.vaultService.uploadMedia(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return result;
  }

  /**
   * Stream a media file from the Telegram Vault.
   * Acts as a transparent proxy: mobile app requests → API fetches from Telegram → streams back.
   */
  @Get(':fileId')
  async stream(@Param('fileId') fileId: string, @Res() res: Response) {
    if (!this.vaultService.isConfigured) {
      throw new ServiceUnavailableException(
        'Vault storage is not configured on this server',
      );
    }

    if (!fileId) {
      throw new BadRequestException('fileId parameter is required');
    }

    this.logger.log(`Streaming file from Vault: ${fileId}`);

    try {
      const { stream, contentType, fileSize } =
        await this.vaultService.streamMedia(fileId);

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      });

      if (fileSize > 0) {
        res.set('Content-Length', fileSize.toString());
      }

      stream.pipe(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to stream file ${fileId}: ${message}`);
      res.status(502).json({
        statusCode: 502,
        message: 'Failed to stream file from Vault',
      });
    }
  }
}
