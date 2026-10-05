import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminErrorsService } from './admin-errors.service';

@Controller('admin/errors')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminErrorsController {
  constructor(private readonly errorsService: AdminErrorsService) {}

  @Get()
  async getErrorLogs(
    @Query('search') search?: string,
    @Query('statusCode') statusCode?: number,
    @Query('errorType') errorType?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.errorsService.getErrorLogs({
      search,
      statusCode,
      errorType,
      limit,
      page,
    });
  }

  @Get(':id')
  async getErrorById(@Param('id') id: string) {
    return this.errorsService.getErrorById(id);
  }

  @Delete(':id')
  async deleteError(@Param('id') id: string) {
    return this.errorsService.deleteError(id);
  }

  @Delete()
  async clearAllLogs() {
    return this.errorsService.clearAllLogs();
  }
}
