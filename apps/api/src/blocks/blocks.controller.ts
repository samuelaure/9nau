import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { FindBlocksQueryDto } from './dto/find-blocks-query.dto';

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

  /**
   * Endpoint to find and retrieve blocks based on query criteria.
   * @param query The query parameters for filtering blocks.
   * @returns A list of blocks that match the criteria.
   */
  @Get()
  findAll(@Query() query: FindBlocksQueryDto) {
    return this.blocksService.findAll(query);
  }

  @Get('remindable')
  getRemindableBlocks() {
    return this.blocksService.getRemindableBlocks();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blocksService.findOne(id);
  }

  /**
   * Endpoint to update an existing block.
   * @param id The ID of the block to update.
   * @param updateBlockDto The data to update the block with.
   * @returns The updated block object.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlockDto: UpdateBlockDto) {
    return this.blocksService.update(id, updateBlockDto);
  }

  /**
   * Endpoint to delete a block.
   * @param id The ID of the block to delete.
   * @returns The result of the deletion operation.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blocksService.remove(id);
  }
}
