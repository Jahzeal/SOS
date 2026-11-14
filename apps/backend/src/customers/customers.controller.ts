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
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { StoreRoleGuard, StoreRoles, SELLERS, MANAGERS } from '../common/staff/store-role.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard, StoreRoleGuard, SubscriptionGuard)
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

  @StoreRoles(...SELLERS, 'TECHNICIAN')
  @Post()
  async create(@Request() req, @Body() dto: CreateCustomerDto) {
    const businessId = req.user.businessId;
    return this.customersService.create(businessId, dto);
  }

  @StoreRoles(...SELLERS, 'TECHNICIAN')
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const businessId = req.user.businessId;
    return this.customersService.update(businessId, id, dto);
  }

  @StoreRoles(...MANAGERS)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.customersService.remove(businessId, id);
  }
}
