import { Controller, Post, Body, Delete, Param } from '@nestjs/common';
import { RelationsService } from './relations.service';

@Controller('relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Post()
  create(
    @Body()
    dto: {
      fromBlockId: string;
      toBlockId: string;
      type: string;
      properties?: Record<string, unknown>;
    },
  ) {
    return this.relationsService.create(
      dto.fromBlockId,
      dto.toBlockId,
      dto.type,
      dto.properties,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.relationsService.remove(id);
  }
}
