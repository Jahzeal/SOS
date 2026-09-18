import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneStatus } from '@prisma/client';

@Controller('phones')
@UseGuards(JwtAuthGuard)
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  @Get('check-imei')
  async checkImei(@Request() req, @Query('imei') imei: string) {
    const businessId = req.user.businessId;
    return this.phonesService.checkImei(businessId, imei || '');
  }

  @Post('register')
  async registerPhone(@Request() req, @Body() dto: RegisterPhoneDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.phonesService.registerPhone(businessId, userId, dto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: PhoneStatus,
    @Query('brand') brand?: string,
  ) {
    const businessId = req.user.businessId;
    return this.phonesService.findAll(businessId, { search, status, brand });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.phonesService.findOne(businessId, id);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    const businessId = req.user.businessId;
    return this.phonesService.update(businessId, id, dto);
  }

  @Patch(':id/flag-stolen')
  async flagStolen(@Request() req, @Param('id') id: string, @Body() dto: any) {
    const businessId = req.user.businessId;
    return this.phonesService.flagAsStolen(businessId, id, dto);
  }

  @Patch(':id/clear-stolen')
  async clearStolen(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.phonesService.clearStolenFlag(businessId, id);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.phonesService.delete(businessId, id);
  }
}

