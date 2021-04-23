import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import { MerchantDto } from './dto/merchant.dto';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';
import { MerchantService } from './merchant.service';
import { VerifyRestaurantDto } from './dto/verify-restaurant.dto';

@Controller()
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) { }

  @MessagePattern('createMerchant')
  create(@Payload() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @MessagePattern('getAuthenticatedMerchant')
  getAuthenticatedMerchant(@Payload() loginMerchantDto: LoginMerchantDto) {
    const { username, password } = loginMerchantDto;
    return this.merchantService.getAuthenticatedMerchant(username, password);
  }

  // Lay thong tin merchant theo id
  @MessagePattern('findMerchantById')
  async findMerchant(@Payload() id: string) {
    return await this.merchantService.findMerchantById(id);
  }

  @EventPattern('restaurant_created')
  async handleRestaurantCreated(data: RestaurantCreatedEventPayload) {
    return await this.merchantService.handleRestaurantCreated(data);
  }

  @MessagePattern('verifyRestaurant')
  async verifyRestaurant(@Payload() verifyRestaurantDto: VerifyRestaurantDto) {
    return this.merchantService.verifyRestaurant(verifyRestaurantDto);
  }
}
