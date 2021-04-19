import { MerchantDto } from './dto/merchant.dto';
import { Merchant } from './entities/merchant.entity';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Repository } from 'typeorm';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger('CustomerService');

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

  // findAll() {
  //   return `This action returns all merchant`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} merchant`;
  // }

  // update(id: number, updateMerchantDto: UpdateMerchantDto) {
  //   return `This action updates a #${id} merchant`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} merchant`;
  // }
}
