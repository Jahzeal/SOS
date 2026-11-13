import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { ContactService } from './contact.service';
import { ContactMessageDto } from './contact.dto';

@Controller('contact')
@UseGuards(RateLimitGuard)
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public Contact Us form. Limited per connection and per sender email. */
  @Post()
  @HttpCode(200)
  @RateLimit({ name: 'contact-form', limit: 5, windowSeconds: 60 * 60 })
  send(@Body() dto: ContactMessageDto) {
    return this.contact.send(dto);
  }
}
