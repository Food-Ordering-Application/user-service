import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

import * as bcrypt from 'bcrypt';
import { IUserCreateResponse } from './interfaces/user-create-response.interface';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger('CustomerService');

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<IUserCreateResponse> {
    let result: IUserCreateResponse;

    // Tìm xem có username có tồn tại hay chưa
    try {
      const customer = await this.customersRepository.findOne({
        username: createCustomerDto.username,
      });
      // Nếu người dùng đã tồn tại
      if (customer) {
        result = {
          status: HttpStatus.CONFLICT,
          message: 'Username already exists',
          user: null,
        };
      } else {
        // Nếu chưa tồn tại thì tạo user mới
        // Hash password
        const newCustomer = new Customer();
        newCustomer.username = createCustomerDto.username;
        newCustomer.password = await bcrypt.hash(
          createCustomerDto.password,
          12,
        );
        await this.customersRepository.save(newCustomer);
        delete newCustomer.password;
        result = {
          status: HttpStatus.CREATED,
          message: 'User created successfully',
          user: newCustomer,
        };
      }
      return result;
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        user: null,
      };
    }
  }

  findAll() {
    return this.customersRepository.find();
  }

  async findByUsername(username: string): Promise<IUserCreateResponse> {
    try {
      const customer = await this.customersRepository.findOne({
        username: username,
      });
      return {
        status: HttpStatus.OK,
        message: 'Customer was found successfully',
        user: customer,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        user: null,
      };
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
