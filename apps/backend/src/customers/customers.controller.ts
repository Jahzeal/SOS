import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Request() req, @Query('search') search?: string) {
    const businessId = req.user.businessId;
    return this.customersService.findAll(businessId, search);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.customersService.findOne(businessId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateCustomerDto) {
    const businessId = req.user.businessId;
    return this.customersService.create(businessId, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const businessId = req.user.businessId;
    return this.customersService.update(businessId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.customersService.remove(businessId, id);
  }
}
