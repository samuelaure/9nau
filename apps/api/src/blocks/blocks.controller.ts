import { Controller, Post, Body } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

/**
 * The controller for the Blocks feature.
 * It exposes the API endpoints for block-related operations.
 * It is responsible for handling incoming requests and returning responses.
 * The controller remains lean, delegating business logic to the BlocksService.
 */
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * Endpoint to create a new block.
   * The @Body() decorator with the CreateBlockDto class automatically
   * triggers validation based on the decorators in the DTO.
   * @param createBlockDto The request body containing the new block data.
   * @returns The created block object.
   */
  @Post()
  create(@Body() createBlockDto: CreateBlockDto) {
    return this.blocksService.create(createBlockDto);
  }
}
