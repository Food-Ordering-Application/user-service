import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './entities/customer.entity';

import * as bcrypt from 'bcrypt';
import { ICustomerResponse } from './interfaces/customer-response.interface';
import { SendPhoneNumberOTPVerifyDto } from './dto/send-otp-verify-customer.dto';
import { ICustomerSendOTPVerifyResponse } from './interfaces/customer-send-otp-verify.interface';
import { VerifyCustomerPhoneNumberDto } from './dto/verify-customer-phone-number.dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger('CustomerService');

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) { }

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<ICustomerResponse> {
    let result: ICustomerResponse;

    // Tìm xem PhoneNumber có tồn tại hay chưa
    try {
      const customer = await this.customersRepository.findOne({
        phoneNumber: createCustomerDto.phoneNumber,
      });
      // Nếu người dùng đã tồn tại
      if (customer) {
        result = {
          status: HttpStatus.CONFLICT,
          message: 'PhoneNumber already exists',
          user: null,
        };
      } else {
        // Nếu chưa tồn tại thì tạo user mới
        // Hash password
        const newCustomer = new Customer();
        newCustomer.phoneNumber = createCustomerDto.phoneNumber;
        newCustomer.password = createCustomerDto.password;

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

  async findCustomerByPhoneNumber(
    phoneNumber: string,
  ): Promise<ICustomerResponse> {
    try {
      const customer = await this.customersRepository.findOne({
        phoneNumber: phoneNumber,
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

  async findCustomerById(id: string): Promise<ICustomerResponse> {
    try {
      const customer = await this.customersRepository.findOne({
        id,
      });
      delete customer.password;
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

  async sendPhoneNumberOTPVerify(
    sendPhoneNumberOTPVerifyDto: SendPhoneNumberOTPVerifyDto,
  ): Promise<ICustomerSendOTPVerifyResponse> {
    const otp = '123456';
    this.logger.log(otp);
    try {
      // Tìm ra user lưu lại otp
      const customer = await this.customersRepository.findOne({
        phoneNumber: sendPhoneNumberOTPVerifyDto.phoneNumber,
      });
      customer.verifyPhoneNumberOTP = otp;
      this.customersRepository.save(customer);
      return {
        status: HttpStatus.OK,
        message: 'Otp sent successfully',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async verifyCustomerPhoneNumber(
    verifyCustomerPhoneNumberDto: VerifyCustomerPhoneNumberDto,
  ): Promise<ICustomerSendOTPVerifyResponse> {
    try {
      // Tìm ra customer dựa trên phoneNumber
      const customer = await this.customersRepository.findOne({
        phoneNumber: verifyCustomerPhoneNumberDto.phoneNumber,
      });
      // Xét xem otp có khớp không
      if (customer.verifyPhoneNumberOTP === verifyCustomerPhoneNumberDto.otp) {
        customer.verifyPhoneNumberOTP = null;
        customer.isPhoneNumberVerified = true;
        this.customersRepository.save(customer);
        return {
          status: HttpStatus.OK,
          message: 'Verify customer phoneNumber successfully',
        };
      }
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'OTP not match',
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
