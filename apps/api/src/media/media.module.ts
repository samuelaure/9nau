import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { VaultService } from './vault.service';

@Module({
  controllers: [MediaController],
  providers: [VaultService],
  exports: [VaultService],
})
export class MediaModule {}
