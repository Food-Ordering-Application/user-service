import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { FetchRestaurantProfilesDto } from './dto/fetch-restaurants-of-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';
import { VerifyPosAppKeyDto } from './dto/verify-pos-app-key.dto';
import { VerifyRestaurantDto } from './dto/verify-restaurant.dto';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import { IMerchantServiceFetchRestaurantProfilesResponse } from './interfaces/merchant-service-fetch-restaurant-profiles-response.interface';
import { IMerchantServiceResponse } from './interfaces/merchant-service-response.interface';
import { MerchantService } from './merchant.service';

@Controller()
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

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

  @EventPattern({ event: 'restaurant_created' })
  async handleRestaurantCreated(data: RestaurantCreatedEventPayload) {
    return await this.merchantService.handleRestaurantCreated(data);
  }

  @MessagePattern('fetchRestaurantProfiles')
  async fetchRestaurantsOfMerchant(
    @Payload() fetchRestaurantProfilesDto: FetchRestaurantProfilesDto,
  ): Promise<IMerchantServiceFetchRestaurantProfilesResponse> {
    return await this.merchantService.fetchRestaurantProfiles(
      fetchRestaurantProfilesDto,
    );
  }

  @MessagePattern('verifyRestaurant')
  async verifyRestaurant(
    @Payload() verifyRestaurantDto: VerifyRestaurantDto,
  ): Promise<IMerchantServiceResponse> {
    return await this.merchantService.verifyRestaurant(verifyRestaurantDto);
  }
  @MessagePattern('verifyPosAppKey')
  async verifyPosAppKey(
    @Payload() verifyPosAppKeyDto: VerifyPosAppKeyDto,
  ): Promise<IMerchantServiceResponse> {
    return await this.merchantService.verifyPosAppKey(verifyPosAppKeyDto);
  }

  @MessagePattern('validateMerchantId')
  async verifyMerchant(@Payload() merchantId: string): Promise<boolean> {
    return await this.merchantService.validateMerchantId(merchantId);
  }
}
