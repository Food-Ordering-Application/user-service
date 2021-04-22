import { MerchantDto } from './dto/merchant.dto';
import { Merchant } from './entities/merchant.entity';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Repository } from 'typeorm';
import { validateHashedPassword } from '../shared/helper';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger('MerchantService');

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
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

}
