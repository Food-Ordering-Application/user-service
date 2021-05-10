import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './entities/customer.entity';
import { ICustomerResponse } from './interfaces/customer-response.interface';
import { SendPhoneNumberOTPVerifyDto } from './dto/send-otp-verify-customer.dto';
import { ICustomerSendOTPVerifyResponse } from './interfaces/customer-send-otp-verify.interface';
import { VerifyCustomerPhoneNumberDto } from './dto/verify-customer-phone-number.dto';
import {
  CreateCustomerAddressDto,
  DeleteCustomerAddressDto,
  GetDefaultCustomerAddressInfoDto,
  GetListCustomerAddressDto,
  UpdateCustomerAddressDto,
  UpdateDefaultCustomerAddressDto,
} from './dto';
import {
  ICustomerAddressesResponse,
  ICustomerAddressResponse,
  IGetAddressResponse,
} from './interfaces';
import { CustomerAddress } from './entities';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger('CustomerService');

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private customerAddressRepository: Repository<CustomerAddress>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<ICustomerResponse> {
    let result: ICustomerResponse;

    // Tìm xem PhoneNumber có tồn tại hay chưa
    try {
      const customer = await this.customerRepository.findOne({
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

        await this.customerRepository.save(newCustomer);
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
      const customer = await this.customerRepository.findOne({
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
      const customer = await this.customerRepository.findOne({
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
      const customer = await this.customerRepository.findOne({
        phoneNumber: sendPhoneNumberOTPVerifyDto.phoneNumber,
      });
      customer.verifyPhoneNumberOTP = otp;
      this.customerRepository.save(customer);
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
      const customer = await this.customerRepository.findOne({
        phoneNumber: verifyCustomerPhoneNumberDto.phoneNumber,
      });
      // Xét xem otp có khớp không
      if (customer.verifyPhoneNumberOTP === verifyCustomerPhoneNumberDto.otp) {
        customer.verifyPhoneNumberOTP = null;
        customer.isPhoneNumberVerified = true;
        this.customerRepository.save(customer);
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

  async createCustomerAddress(
    createCustomerAddressDto: CreateCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    try {
      const {
        address,
        customerId,
        latitude,
        longtitude,
      } = createCustomerAddressDto;

      // Tìm ra customer với customerId
      const customer = await this.customerRepository
        .createQueryBuilder('customer')
        .select(['customer.id'])
        .leftJoinAndSelect('customer.customerAddresses', 'cAddress')
        .where('customer.id = :customerId', { customerId: customerId })
        .getOne();

      // Tạo address và lưu
      const customerAddress = new CustomerAddress();
      customerAddress.address = address;
      customerAddress.geom = {
        type: 'Point',
        coordinates: [longtitude, latitude],
      };
      customerAddress.default =
        customer.customerAddresses.length >= 1 ? false : true;
      delete customer.customerAddresses;
      customerAddress.customer = customer;
      await this.customerAddressRepository.save(customerAddress);

      return {
        status: HttpStatus.OK,
        message: 'Customer address save successfully',
        address: customerAddress,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        address: null,
      };
    }
  }

  async updateCustomerAddress(
    updateCustomerAddressDto: UpdateCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    try {
      const {
        address,
        customerId,
        latitude,
        longtitude,
        customerAddressId,
      } = updateCustomerAddressDto;

      // Tìm ra customer address và update
      const customerAddress = await this.customerAddressRepository
        .createQueryBuilder('cAddress')
        .where('cAddress.id = :customerAddressId', {
          customerAddressId: customerAddressId,
        })
        .getOne();

      customerAddress.address = address;
      customerAddress.geom = {
        type: 'Point',
        coordinates: [longtitude, latitude],
      };
      // Lưu lại customerAddress
      await this.customerAddressRepository.save(customerAddress);

      return {
        status: HttpStatus.OK,
        message: 'Customer address update successfully',
        address: customerAddress,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        address: null,
      };
    }
  }

  async deleteCustomerAddress(
    deleteCustomerAddressDto: DeleteCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    try {
      const { customerId, customerAddressId } = deleteCustomerAddressDto;

      // Delete customer address
      await this.customerAddressRepository.delete({ id: customerAddressId });

      return {
        status: HttpStatus.OK,
        message: 'Customer address delete successfully',
        address: null,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        address: null,
      };
    }
  }

  async getListCustomerAddress(
    getListCustomerAddressDto: GetListCustomerAddressDto,
  ): Promise<ICustomerAddressesResponse> {
    try {
      const { customerId } = getListCustomerAddressDto;

      const addresses = await this.customerAddressRepository
        .createQueryBuilder('cAddress')
        .leftJoin('cAddress.customer', 'customer')
        .where('customer.id = :customerId', {
          customerId: customerId,
        })
        .getMany();

      return {
        status: HttpStatus.OK,
        message: 'Customer addresses fetched successfully',
        addresses: addresses,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        addresses: null,
      };
    }
  }

  async getDefaultCustomerAddressInfo(
    getDefaultCustomerAddressInfoDto: GetDefaultCustomerAddressInfoDto,
  ): Promise<IGetAddressResponse> {
    try {
      const { customerId } = getDefaultCustomerAddressInfoDto;

      const defaultAddress = await this.customerAddressRepository
        .createQueryBuilder('cAddress')
        .leftJoin('cAddress.customer', 'customer')
        .where('customer.id = :customerId', {
          customerId: customerId,
        })
        .andWhere('cAddress.default = :addressDefault', {
          addressDefault: true,
        })
        .getOne();

      //TODO: Nếu user chưa có address thì trả về null
      if (!defaultAddress) {
        return {
          status: HttpStatus.OK,
          message: 'Customer has no address',
          data: {
            address: null,
            geom: null,
          },
        };
      }
      return {
        status: HttpStatus.OK,
        message: 'Customer addresses fetched successfully',
        data: {
          address: defaultAddress.address,
          geom: defaultAddress.geom,
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        data: null,
      };
    }
  }

  async updateDefaultCustomerAddress(
    updateDefaultCustomerAddressDto: UpdateDefaultCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    try {
      const { customerId, customerAddressId } = updateDefaultCustomerAddressDto;
      //TODO: Tìm ra customerAddress có default = true đổi lại thành false
      const oldDefaultCustomerAddress = await this.customerAddressRepository
        .createQueryBuilder('cAddress')
        .leftJoin('cAddress.customer', 'customer')
        .where('customer.id = :customerId', {
          customerId: customerId,
        })
        .andWhere('cAddress.default = :addressDefault', {
          addressDefault: true,
        })
        .getOne();
      oldDefaultCustomerAddress.default = false;
      await this.customerAddressRepository.save(oldDefaultCustomerAddress);
      //TODO: Update customerAddressId mới thành default
      const newDefaultCustomerAddress = await this.customerAddressRepository
        .createQueryBuilder('cAddress')
        .where('cAddress.id = :customerAddressId', {
          customerAddressId: customerAddressId,
        })
        .getOne();
      newDefaultCustomerAddress.default = true;
      await this.customerAddressRepository.save(newDefaultCustomerAddress);

      return {
        status: HttpStatus.OK,
        message: 'Default customer address updated successfully',
        address: newDefaultCustomerAddress,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        address: null,
      };
    }
  }
}
