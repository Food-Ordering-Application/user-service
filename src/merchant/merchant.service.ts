import {
  HttpService,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { ILike, Repository } from 'typeorm';
import { validateHashedPassword } from '../shared/helper';
import { RESTAURANT_SERVICE } from '../constants';
import {
  AddPaypalPaymentDto,
  CreateMerchantDto,
  FetchPaymentDto,
  FetchRestaurantProfilesDto,
  GeneratePosKeyDto,
  GetIsAutoConfirmOrderDto,
  GetPayPalOnboardStatusDto,
  GetPayPalSignUpLinkDto,
  MerchantDto,
  PaymentDto,
  RemovePosDeviceDto,
  RestaurantProfileDto,
  UpdateIsAutoConfirmOrderDto,
  VerifyPosAppKeyDto,
  VerifyRestaurantDto,
} from './dto';
import {
  Merchant,
  PaymentInfo,
  PayPalPayment,
  RestaurantProfile,
} from './entities';
import { PayPalOnboardStatus } from './enums/paypal-onboard-status';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import { RestaurantProfileUpdatedEventPayload } from './events/restaurant-profile-updated.event';
import { PayPalClient } from './helpers/paypal-client';
import {
  IGetPayPalOnboardStatusResponse,
  IGetPayPalSignUpLinkResponse,
  IIsAutoConfirmResponse,
  IMerchantServiceAddPaypalPaymentResponse,
  IMerchantServiceFetchPaymentOfRestaurantResponse,
  IMerchantServiceFetchRestaurantProfilesResponse,
  IMerchantServiceResponse,
} from './interfaces';
import { ETrueFalse } from '../shared/enum';
import { RestaurantUpdatedEventPayload } from './events/restaurant-updated.event';
@Injectable()
export class MerchantService {
  private readonly logger = new Logger('MerchantService');

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(RestaurantProfile)
    private restaurantProfileRepository: Repository<RestaurantProfile>,
    @InjectRepository(PaymentInfo)
    private paymentRepository: Repository<PaymentInfo>,
    @InjectRepository(PayPalPayment)
    private paypalPaymentRepository: Repository<PayPalPayment>,
    @Inject(RESTAURANT_SERVICE)
    private restaurantServiceClient: ClientProxy,
    private httpService: HttpService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto) {
    const { username, password, email, phone, fullName, IDNumber } =
      createMerchantDto;
    const merchantWithThisUsername = await this.merchantsRepository.findOne({
      username,
    });
    if (merchantWithThisUsername) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Username already exists',
        user: null,
      };
    }
    const newUser = this.merchantsRepository.create({
      username,
      password,
      email,
      phone,
      fullName,
      IDNumber,
    });
    await this.merchantsRepository.save(newUser);
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      user: MerchantDto.EntityToDTO(newUser),
    };
  }

  async getAuthenticatedMerchant(username: string, password: string) {
    const merchant = await this.merchantsRepository.findOne({
      username,
    });
    if (!merchant) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Merchant's username does not exist",
        user: null,
      };
    }
    const isMatch = await validateHashedPassword(password, merchant.password);
    if (!isMatch)
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Merchant's password does not correct",
        user: null,
      };
    return {
      status: HttpStatus.OK,
      message: 'Merchant information is verified',
      user: MerchantDto.EntityToDTO(merchant),
    };
  }

  async findMerchantById(id: string) {
    const merchant = await this.merchantsRepository.findOne({
      id,
    });

    if (!merchant)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Merchant was not found',
        user: null,
      };

    return {
      status: HttpStatus.OK,
      message: 'Merchant was found successfully',
      user: MerchantDto.EntityToDTO(merchant),
    };
  }

  async handleRestaurantCreated(payload: RestaurantCreatedEventPayload) {
    const { merchantId, restaurantId, data } = payload;
    const {
      name,
      phone,
      areaId,
      coverImageUrl,
      cityId,
      address,
      isActive,
      isBanned,
      isVerified,
    } = data;
    const restaurantProfile = this.restaurantProfileRepository.create({
      restaurantId,
      merchantId,
      name,
      phone,
      areaId,
      cityId,
      image: coverImageUrl,
      address,
      isActive,
      isBanned,
      isVerified,
    });
    restaurantProfile.paymentInfo = this.createNewPayment();
    await this.restaurantProfileRepository.save(restaurantProfile);
  }

  async handleRestaurantUpdated(payload: RestaurantUpdatedEventPayload) {
    const { merchantId, restaurantId, data } = payload;
    const {
      name,
      phone,
      coverImageUrl,
      address,
      isActive,
      verifiedImageUrl,
      videoUrl,
    } = data;

    this.restaurantProfileRepository.update(
      { restaurantId },
      {
        name,
        phone,
        // coverImageUrl,
        address,
        isActive,
        // verifiedImageUrl,
        // videoUrl,
        image: coverImageUrl,
      },
    );
  }

  createNewPayment(): PaymentInfo {
    return this.paymentRepository.create({
      paypal: this.paypalPaymentRepository.create(),
    });
  }

  async verifyRestaurant(
    verifyRestaurantDto: VerifyRestaurantDto,
  ): Promise<IMerchantServiceResponse> {
    const { restaurantId } = verifyRestaurantDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId,
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'RestaurantId was not found',
        data: null,
      };

    restaurantProfile.isVerified = true;
    const restaurantProfileUpdatedEventPayload: RestaurantProfileUpdatedEventPayload =
      {
        restaurantId,
        data: {
          isVerified: true,
        },
      };

    await this.restaurantProfileRepository.save(restaurantProfile);
    this.restaurantServiceClient.emit(
      { event: 'restaurant_profile_updated' },
      restaurantProfileUpdatedEventPayload,
    );

    return {
      status: HttpStatus.OK,
      message: 'Verify restaurant successfully',
      data: {},
    };
  }

  async generatePosAppKey(
    generatePosKeyDto: GeneratePosKeyDto,
  ): Promise<IMerchantServiceResponse> {
    const { restaurantId } = generatePosKeyDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId,
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'RestaurantId was not found',
        data: null,
      };
    try {
      await this.getVerifiedRestaurantProfile(restaurantProfile);
      return {
        status: HttpStatus.OK,
        message: 'Generate POS app key for restaurant successfully',
        data: {
          posAppKey: restaurantProfile.posAppKey,
        },
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
        data: {},
      };
    }
  }

  async verifyPosAppKey(
    verifyPosAppKeyDto: VerifyPosAppKeyDto,
  ): Promise<IMerchantServiceResponse> {
    const { posAppKey, deviceId } = verifyPosAppKeyDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      posAppKey,
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'PosAppKey was not found',
        data: null,
      };

    if (restaurantProfile.deviceId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Restaurant already used the code',
        data: null,
      };
    }

    await this.restaurantProfileRepository.update(restaurantProfile, {
      deviceId,
    });
    const { merchantId, restaurantId } = restaurantProfile;
    return {
      status: HttpStatus.OK,
      message: 'Verify PosAppKey successfully',
      data: {
        merchantId,
        restaurantId,
      },
    };
  }

  async removePosDevice(
    removePosDeviceDto: RemovePosDeviceDto,
  ): Promise<IMerchantServiceResponse> {
    const { restaurantId } = removePosDeviceDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId,
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant was not found',
        data: null,
      };

    try {
      await this.restaurantProfileRepository.update(restaurantProfile, {
        deviceId: null,
      });

      return {
        status: HttpStatus.OK,
        message: 'Remove POS device successfully',
        data: {},
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
        data: {},
      };
    }
  }

  private async getVerifiedRestaurantProfile(
    restaurantProfile: RestaurantProfile,
    count = 0,
  ) {
    const getRandom = () => randomBytes(2).toString('hex').toUpperCase();
    restaurantProfile.posAppKey = `${getRandom()}-${getRandom()}-${getRandom()}`;
    try {
      await this.restaurantProfileRepository.save(restaurantProfile);
    } catch (e) {
      if (count > 5) {
        throw new Error('Cannot generate random key');
      }
      this.getVerifiedRestaurantProfile(restaurantProfile, count + 1);
    }
  }

  public async isRestaurantAvailable(
    restaurantId: string,
  ): Promise<{ result: boolean; message: string }> {
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId,
    });

    if (!restaurantProfile) {
      return {
        result: false,
        message: 'Restaurant was not found',
      };
    }
    const { isBanned, isVerified } = restaurantProfile;
    if (isBanned) {
      return {
        result: false,
        message: 'Restaurant was banned',
      };
    }
    if (!isVerified) {
      return {
        result: false,
        message: 'Restaurant was not verified',
      };
    }
    return {
      result: true,
      message: null,
    };
  }

  public async doesRestaurantExist(restaurantId: string): Promise<boolean> {
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId,
    });

    if (!restaurantProfile) {
      return false;
    }
    return true;
  }

  public async doesMerchantExist(merchantId: string): Promise<boolean> {
    const count = await this.merchantsRepository.count({
      where: { id: merchantId },
    });
    return count > 0;
  }

  async fetchRestaurantProfiles(
    fetchRestaurantsOfMerchantDto: FetchRestaurantProfilesDto,
  ): Promise<IMerchantServiceFetchRestaurantProfilesResponse> {
    const { size, page, query = '' } = fetchRestaurantsOfMerchantDto;
    const queryString = query.toLowerCase();
    const [results, total] =
      await this.restaurantProfileRepository.findAndCount({
        where: queryString.length
          ? [
              {
                name: ILike(`%${queryString}%`),
              },
              { address: ILike(`%${queryString}%`) },
            ]
          : null,
        take: size,
        skip: page * size,
        relations: ['merchant'],
        order: { contractId: 'DESC' },
      });

    return {
      status: HttpStatus.OK,
      message: 'Fetched restaurants successfully',
      data: {
        results: results.map((staff) =>
          RestaurantProfileDto.EntityToDTO(staff),
        ),
        size,
        total,
      },
    };
  }

  async validateMerchantId(merchantId: string): Promise<boolean> {
    const doesExist = await this.doesMerchantExist(merchantId);
    return doesExist;
  }

  async fetchPaymentOfRestaurant(
    fetchPaymentOfRestaurantDto: FetchPaymentDto,
  ): Promise<IMerchantServiceFetchPaymentOfRestaurantResponse> {
    const { merchantId, restaurantId } = fetchPaymentOfRestaurantDto;
    const paymentOfRestaurant = await this.restaurantProfileRepository.findOne(
      {
        merchantId: merchantId,
        restaurantId: restaurantId,
      },
      { relations: ['paymentInfo'] },
    );

    if (!paymentOfRestaurant) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
        data: null,
      };
    }

    const { paymentInfo } = paymentOfRestaurant;
    if (!paymentInfo) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot query paymentInfo information',
        data: null,
      };
    }

    return {
      status: HttpStatus.OK,
      message: 'Fetched paymentInfo of restaurant successfully',
      data: {
        payment: PaymentDto.EntityToDto(paymentInfo),
      },
    };
  }

  async addPaypalPaymentToRestaurant(
    addPaypalPaymentToRestaurantDto: AddPaypalPaymentDto,
  ): Promise<IMerchantServiceAddPaypalPaymentResponse> {
    const { merchantId, restaurantId, data } = addPaypalPaymentToRestaurantDto;
    const { merchantIdInPayPal } = data;

    const paymentOfRestaurant = await this.restaurantProfileRepository.findOne(
      {
        merchantId: merchantId,
        restaurantId: restaurantId,
      },
      { relations: ['paymentInfo'] },
    );

    if (!paymentOfRestaurant) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
      };
    }

    const { paymentInfo } = paymentOfRestaurant;
    if (!paymentInfo?.paypal) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot query paymentInfo information',
      };
    }

    paymentInfo.paypal.merchantIdInPayPal = merchantIdInPayPal;

    try {
      // save to database
      await this.paypalPaymentRepository.save(paymentInfo.paypal);
      return {
        status: HttpStatus.OK,
        message: 'Add Paypal paymentInfo successfully',
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
      };
    }
  }

  async getPayPalSignUpLink(
    getPayPalSignUpLinkDto: GetPayPalSignUpLinkDto,
  ): Promise<IGetPayPalSignUpLinkResponse> {
    const { merchantId, redirectUrl, restaurantId } = getPayPalSignUpLinkDto;
    try {
      const actionUrl = await PayPalClient.generateSignUpLink(
        restaurantId,
        redirectUrl,
        this.httpService,
      );
      return {
        status: HttpStatus.OK,
        message: 'Generate PayPal partner referral sign up link successfully',
        data: {
          action_url: actionUrl,
        },
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
        data: null,
      };
    }
  }

  async getPayPalOnboardStatus(
    getPayPalOnboardStatusDto: GetPayPalOnboardStatusDto,
  ): Promise<IGetPayPalOnboardStatusResponse> {
    const { merchantId, restaurantId } = getPayPalOnboardStatusDto;
    const paymentOfRestaurant = await this.restaurantProfileRepository.findOne(
      {
        merchantId: merchantId,
        restaurantId: restaurantId,
      },
      { relations: ['paymentInfo'] },
    );

    if (!paymentOfRestaurant) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
        data: null,
      };
    }

    const { paymentInfo } = paymentOfRestaurant;
    if (!paymentInfo?.paypal) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot query paymentInfo information',
        data: null,
      };
    }
    const { paypal } = paymentInfo;
    const { isOnboard, merchantIdInPayPal } = paypal;

    // already onboard
    if (isOnboard) {
      return {
        status: HttpStatus.OK,
        message: 'Restaurant was onboard',
        data: {
          isOnboard: true,
          message: PayPalOnboardStatus.ONBOARD,
        },
      };
    }
    try {
      // already add merchant Id (not confirm yet)
      if (!merchantIdInPayPal) {
        let merchantIdInPayPal: string = null;

        try {
          merchantIdInPayPal = await PayPalClient.getMerchantIdInPayPal(
            PayPalClient.PartnerId(),
            restaurantId,
            this.httpService,
          );
        } catch (e) {
          return {
            status: HttpStatus.OK,
            message: e.message + '. User may not click and confirm yet.',
            data: {
              isOnboard: false,
              message: PayPalOnboardStatus.TRY_AGAIN,
            },
          };
        }

        paypal.merchantIdInPayPal = merchantIdInPayPal;
      }

      const onboardStatusResponse = await PayPalClient.getOnboardStatus(
        PayPalClient.PartnerId(),
        paypal.merchantIdInPayPal,
        this.httpService,
      );

      const {
        payments_receivable,
        primary_email_confirmed,
        oauth_integrations,
      } = onboardStatusResponse;

      if (!payments_receivable) {
        return {
          status: HttpStatus.OK,
          message: 'PayPal account problem',
          data: {
            isOnboard: false,
            message: PayPalOnboardStatus.SELLER_CANNOT_RECEIVE_PAYMENT,
          },
        };
      }

      if (!primary_email_confirmed) {
        return {
          status: HttpStatus.OK,
          message: 'PayPal account problem',
          data: {
            isOnboard: false,
            message: PayPalOnboardStatus.SELLER_EMAIL_WAS_NOT_CONFIRMED,
          },
        };
      }

      const didSellerGrantPermission =
        oauth_integrations &&
        oauth_integrations.length &&
        oauth_integrations[0].oauth_third_party?.length;

      if (!didSellerGrantPermission) {
        return {
          status: HttpStatus.OK,
          message: 'PayPal account problem. User did not grant permission',
          data: {
            isOnboard: false,
            message: PayPalOnboardStatus.SELLER_DID_NOT_GRANT_PERMISSION,
          },
        };
      }

      paypal.isOnboard = true;
      await this.paypalPaymentRepository.save(paypal);

      const restaurantProfileUpdatedEventPayload: RestaurantProfileUpdatedEventPayload =
        {
          restaurantId,
          data: {
            merchantIdInPayPal,
          },
        };

      this.restaurantServiceClient.emit(
        { event: 'restaurant_profile_updated' },
        restaurantProfileUpdatedEventPayload,
      );

      return {
        status: HttpStatus.OK,
        message: 'Restaurant was onboard',
        data: {
          isOnboard: paypal.isOnboard,
          message: PayPalOnboardStatus.ONBOARD,
        },
      };
    } catch (e) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
        data: null,
      };
    }
  }

  //! Update th??ng tin isAutoConfirm c???a merchant
  async updateIsAutoConfirmOrder(
    updateIsAutoConfirmOrderDto: UpdateIsAutoConfirmOrderDto,
  ): Promise<IIsAutoConfirmResponse> {
    const { isAutoConfirm, restaurantId, tokenRestaurantId } =
      updateIsAutoConfirmOrderDto;

    if (restaurantId !== tokenRestaurantId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }

    try {
      //TODO: L????y th??ng tin restaurantProfile
      const restaurantProfile = await this.restaurantProfileRepository
        .createQueryBuilder('resProfile')
        .where('resProfile.restaurantId = :restaurantId', {
          restaurantId: restaurantId,
        })
        .getOne();

      if (!restaurantProfile) {
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            'restaurantProfile not found with the associated restaurantId',
        };
      }

      //TODO: update isAutoConfirm restaurantProfile
      if (isAutoConfirm === ETrueFalse.TRUE) {
        restaurantProfile.isAutoConfirm = true;
      } else {
        restaurantProfile.isAutoConfirm = false;
      }
      await this.restaurantProfileRepository.save(restaurantProfile);
      return {
        status: HttpStatus.OK,
        message: 'Update isAutoConfirm successfully',
        isAutoConfirm: restaurantProfile.isAutoConfirm,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! L???y th??ng tin isAutoConfirm c???a merchant
  async getIsAutoConfirmOrder(
    getIsAutoConfirmOrderDto: GetIsAutoConfirmOrderDto,
  ): Promise<IIsAutoConfirmResponse> {
    const { restaurantId } = getIsAutoConfirmOrderDto;

    try {
      //TODO: L????y th??ng tin restaurantProfile
      const restaurantProfile = await this.restaurantProfileRepository
        .createQueryBuilder('resProfile')
        .where('resProfile.restaurantId = :restaurantId', {
          restaurantId: restaurantId,
        })
        .getOne();

      if (!restaurantProfile) {
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            'restaurantProfile not found with the associated restaurantId',
        };
      }

      return {
        status: HttpStatus.OK,
        message: 'Fetch isAutoConfirm successfully',
        isAutoConfirm: restaurantProfile.isAutoConfirm,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
