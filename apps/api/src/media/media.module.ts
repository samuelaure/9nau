import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { StorageService } from './storage.service';
import { VaultService } from './vault.service';

@Module({
  controllers: [MediaController],
  providers: [StorageService, VaultService],
  exports: [StorageService, VaultService],
})
export class MediaModule {}
