import { RestaurantUpdatedEventPayload } from './events/restaurant-updated.event';
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
  UpdateIsAutoConfirmOrderDto,
  GetIsAutoConfirmOrderDto,
  GeneratePosKeyDto,
  RemovePosDeviceDto,
} from './dto';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import {
  IMerchantServiceResponse,
  IMerchantServiceFetchPaymentOfRestaurantResponse,
  IMerchantServiceFetchRestaurantProfilesResponse,
  IMerchantServiceAddPaypalPaymentResponse,
  IGetPayPalSignUpLinkResponse,
  IGetPayPalOnboardStatusResponse,
  IIsAutoConfirmResponse,
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

  @EventPattern({ event: 'restaurant_updated' })
  async handleRestaurantUpdated(data: RestaurantUpdatedEventPayload) {
    return await this.merchantService.handleRestaurantUpdated(data);
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

  @MessagePattern('generatePosAppKey')
  async generatePosAppKey(
    @Payload() generatePosKeyDto: GeneratePosKeyDto,
  ): Promise<IMerchantServiceResponse> {
    return await this.merchantService.generatePosAppKey(generatePosKeyDto);
  }

  @MessagePattern('removePosDevice')
  async removePosDevice(
    @Payload() removePosDeviceDto: RemovePosDeviceDto,
  ): Promise<IMerchantServiceResponse> {
    return await this.merchantService.removePosDevice(removePosDeviceDto);
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

  //! Update th??ng tin isAutoConfirm c???a merchant
  @MessagePattern('updateIsAutoConfirmOrder')
  async updateIsAutoConfirmOrder(
    @Payload()
    updateIsAutoConfirmOrderDto: UpdateIsAutoConfirmOrderDto,
  ): Promise<IIsAutoConfirmResponse> {
    return this.merchantService.updateIsAutoConfirmOrder(
      updateIsAutoConfirmOrderDto,
    );
  }

  //! L???y th??ng tin isAutoConfirm c???a merchant
  @MessagePattern('getIsAutoConfirm')
  async getIsAutoConfirmOrder(
    @Payload()
    getIsAutoConfirmOrderDto: GetIsAutoConfirmOrderDto,
  ): Promise<IIsAutoConfirmResponse> {
    return this.merchantService.getIsAutoConfirmOrder(getIsAutoConfirmOrderDto);
  }
}
