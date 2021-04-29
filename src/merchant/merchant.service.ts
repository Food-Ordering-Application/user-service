import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { validateHashedPassword } from '../shared/helper';
import { RESTAURANT_EVENT } from './../constants';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { MerchantDto } from './dto/merchant.dto';
import { VerifyPosAppKeyDto } from './dto/verify-pos-app-key.dto';
import { VerifyRestaurantDto } from './dto/verify-restaurant.dto';
import { Merchant } from './entities/merchant.entity';
import { RestaurantProfile } from './entities/restaurant-profile.entity';
import { RestaurantCreatedEventPayload } from './events/restaurant-created.event';
import { IMerchantServiceResponse } from './interfaces/merchant-service-response.interface';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger('MerchantService');

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(RestaurantProfile)
    private restaurantProfileRepository: Repository<RestaurantProfile>,
    @Inject(RESTAURANT_EVENT)
    private restaurantEventClient: ClientProxy,
  ) { }

  async create(createMerchantDto: CreateMerchantDto) {
    const { username, password, email, phone, fullName, IDNumber } = createMerchantDto;
    const merchantWithThisUsername = await this.merchantsRepository.findOne({
      username
    });
    if (merchantWithThisUsername) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Username already exists',
        user: null,
      }
    }
    const newUser = this.merchantsRepository.create({
      username, password, email, phone, fullName, IDNumber
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
      username
    });
    if (!merchant) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Merchant\'s username does not exist',
        user: null,
      };
    }
    const isMatch = await validateHashedPassword(password, merchant.password);
    if (!isMatch)
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Merchant\'s password does not correct',
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
      id
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
    const { name, phone, area, city, address, isActive, isBanned, isVerified } = data;
    const restaurantProfile = this.restaurantProfileRepository.create({
      restaurantId,
      merchantId,
      name,
      phone,
      area,
      city,
      address,
      isActive,
      isBanned,
      isVerified
    });
    await this.restaurantProfileRepository.save(restaurantProfile);
  }

  async verifyRestaurant(verifyRestaurantDto: VerifyRestaurantDto): Promise<IMerchantServiceResponse> {
    const { restaurantId } = verifyRestaurantDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'RestaurantId was not found',
        data: null
      };

    restaurantProfile.isVerified = true;
    await this.getVerifiedRestaurantProfile(restaurantProfile);

    this.restaurantEventClient.emit('restaurant_profile_updated', {
      restaurantId, data: {
        isVerified: true,
      }
    });

    return {
      status: HttpStatus.OK,
      message: 'Verify restaurant successfully',
      data: {
        posAppKey: restaurantProfile.posAppKey
      }
    };
  }

  async verifyPosAppKey(verifyPosAppKeyDto: VerifyPosAppKeyDto): Promise<IMerchantServiceResponse> {
    const { posAppKey } = verifyPosAppKeyDto;
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      posAppKey
    });

    if (!restaurantProfile)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'PosAppKey was not found',
        data: null
      };

    const { merchantId, restaurantId } = restaurantProfile;
    return {
      status: HttpStatus.OK,
      message: 'Verify PosAppKey successfully',
      data: {
        merchantId,
        restaurantId
      }
    };
  }

  private async getVerifiedRestaurantProfile(restaurantProfile: RestaurantProfile) {
    restaurantProfile.posAppKey = randomBytes(20).toString('hex').toUpperCase();
    try {
      await this.restaurantProfileRepository.save(restaurantProfile)
    }
    catch (e) {
      this.getVerifiedRestaurantProfile(restaurantProfile);
    }
  }

  public async isRestaurantAvailable(restaurantId: string): Promise<{ result: boolean, message: string }> {
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId
    });

    if (!restaurantProfile) {
      return {
        result: false,
        message: 'Restaurant was not found'
      };
    }
    const { isBanned, isVerified } = restaurantProfile;
    if (isBanned) {
      return {
        result: false,
        message: 'Restaurant was banned'
      };
    }
    if (!isVerified) {
      return {
        result: false,
        message: 'Restaurant was not verified'
      }
    }
    return {
      result: true,
      message: null
    };
  }

  public async doesRestaurantExist(restaurantId: string): Promise<boolean> {
    const restaurantProfile = await this.restaurantProfileRepository.findOne({
      restaurantId
    });

    if (!restaurantProfile) {
      return false;
    }
    return true;
  }

}
