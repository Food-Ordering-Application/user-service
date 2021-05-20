import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { validateHashedPassword } from '../shared/helper';
import { RESTAURANT_SERVICE } from './../constants';
import {
  CreateMerchantDto,
  FetchPaymentDto,
  FetchRestaurantProfilesDto,
  MerchantDto,
  PaymentDto,
  RestaurantProfileDto,
  VerifyPosAppKeyDto,
  VerifyRestaurantDto,
} from './dto';
import {
  Merchant,
  Payment,
  PayPalPayment,
  RestaurantProfile,
} from './entities';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import { RestaurantProfileUpdatedEventPayload } from './events/restaurant-profile-updated.event';
import {
  IMerchantServiceFetchPaymentOfRestaurantResponse,
  IMerchantServiceFetchRestaurantProfilesResponse,
  IMerchantServiceResponse,
} from './interfaces';
@Injectable()
export class MerchantService {
  private readonly logger = new Logger('MerchantService');

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(RestaurantProfile)
    private restaurantProfileRepository: Repository<RestaurantProfile>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PayPalPayment)
    private paypalPaymentRepository: Repository<PayPalPayment>,
    @Inject(RESTAURANT_SERVICE)
    private restaurantServiceClient: ClientProxy,
  ) {}

  async create(createMerchantDto: CreateMerchantDto) {
    const {
      username,
      password,
      email,
      phone,
      fullName,
      IDNumber,
    } = createMerchantDto;
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
      area,
      coverImageUrl,
      city,
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
      area,
      city,
      image: coverImageUrl,
      address,
      isActive,
      isBanned,
      isVerified,
    });
    restaurantProfile.payment = this.createNewPayment();
    await this.restaurantProfileRepository.save(restaurantProfile);
  }

  createNewPayment(): Payment {
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
    await this.getVerifiedRestaurantProfile(restaurantProfile);

    const restaurantProfileUpdatedEventPayload: RestaurantProfileUpdatedEventPayload = {
      restaurantId,
      data: {
        isVerified: true,
      },
    };
    this.restaurantServiceClient.emit(
      { event: 'restaurant_profile_updated' },
      restaurantProfileUpdatedEventPayload,
    );

    return {
      status: HttpStatus.OK,
      message: 'Verify restaurant successfully',
      data: {
        posAppKey: restaurantProfile.posAppKey,
      },
    };
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

  private async getVerifiedRestaurantProfile(
    restaurantProfile: RestaurantProfile,
  ) {
    const getRandom = () => randomBytes(2).toString('hex').toUpperCase();
    restaurantProfile.posAppKey = `${getRandom()}-${getRandom()}-${getRandom()}`;
    try {
      await this.restaurantProfileRepository.save(restaurantProfile);
    } catch (e) {
      this.getVerifiedRestaurantProfile(restaurantProfile);
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
    const { size, page } = fetchRestaurantsOfMerchantDto;

    const [
      results,
      total,
    ] = await this.restaurantProfileRepository.findAndCount({
      take: size,
      skip: page * size,
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
      { relations: ['payment'] },
    );

    if (!paymentOfRestaurant) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
        data: null,
      };
    }

    const { payment } = paymentOfRestaurant;
    if (!payment) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot query payment information',
        data: null,
      };
    }

    return {
      status: HttpStatus.OK,
      message: 'Fetched payment of restaurant successfully',
      data: {
        payment: PaymentDto.EntityToDto(payment),
      },
    };
  }
}
