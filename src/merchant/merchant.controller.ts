import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateMerchantDto,
  FetchRestaurantProfilesDto,
  LoginMerchantDto,
  VerifyRestaurantDto,
  VerifyPosAppKeyDto,
  FetchPaymentDto,
  AddPaypalPaymentDto,
  GetPayPalSignUpLinkDto,
  GetPayPalOnboardStatusDto,
} from './dto';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import {
  IMerchantServiceResponse,
  IMerchantServiceFetchPaymentOfRestaurantResponse,
  IMerchantServiceFetchRestaurantProfilesResponse,
  IMerchantServiceAddPaypalPaymentResponse,
  IGetPayPalSignUpLinkResponse,
  IGetPayPalOnboardStatusResponse,
} from './interfaces';
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

  @MessagePattern('fetchPaymentOfRestaurant')
  async fetchPaymentOfRestaurant(
    @Payload() fetchPaymentOfRestaurantDto: FetchPaymentDto,
  ): Promise<IMerchantServiceFetchPaymentOfRestaurantResponse> {
    return await this.merchantService.fetchPaymentOfRestaurant(
      fetchPaymentOfRestaurantDto,
    );
  }

  @MessagePattern('addPaypalPaymentToRestaurant')
  async addPaypalPaymentToRestaurant(
    @Payload() addPaypalPaymentToRestaurantDto: AddPaypalPaymentDto,
  ): Promise<IMerchantServiceAddPaypalPaymentResponse> {
    return await this.merchantService.addPaypalPaymentToRestaurant(
      addPaypalPaymentToRestaurantDto,
    );
  }

  @MessagePattern('getPayPalSignUpLink')
  async getPayPalSignUpLink(
    @Payload() getPayPalSignUpLinkDto: GetPayPalSignUpLinkDto,
  ): Promise<IGetPayPalSignUpLinkResponse> {
    return await this.merchantService.getPayPalSignUpLink(
      getPayPalSignUpLinkDto,
    );
  }

  @MessagePattern('getPayPalOnboardStatus')
  async getPayPalOnboardStatus(
    @Payload() getPayPalOnboardStatusDto: GetPayPalOnboardStatusDto,
  ): Promise<IGetPayPalOnboardStatusResponse> {
    return await this.merchantService.getPayPalOnboardStatus(
      getPayPalOnboardStatusDto,
    );
  }
}
