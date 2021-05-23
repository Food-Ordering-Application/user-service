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
  GetCustomerResetPasswordTokenDto,
  GetDefaultCustomerAddressInfoDto,
  GetListCustomerAddressDto,
  SendResetPasswordEmailDto,
  UpdateCustomerAddressDto,
  UpdateCustomerInfoDto,
  UpdateCustomerPasswordDto,
  UpdateDefaultCustomerAddressDto,
} from './dto';
import {
  ICustomerAddressesResponse,
  ICustomerAddressResponse,
  IGetAddressResponse,
  IGetCustomerResetPasswordTokenResponse,
  ISimpleResponse,
  IUpdateCustomerInfoResponse,
} from './interfaces';
import { CustomerAddress } from './entities';
import { v4 as uuidv4 } from 'uuid';
import { transporter } from './config/nodemailer.config';
import * as bcrypt from 'bcrypt';

const RESET_PASSWORD_TIMEOUT_EXPIRATION = 5 * 36000000;

const sendMail = (mailOptions) => {
  console.log('Transporter', transporter);
  transporter().sendMail(mailOptions, (err, data) => {
    if (err) {
      console.log('Lỗi khi gửi mail', err);
      return false;
    } else {
      console.log('Email đã được gửi!');
      return true;
    }
  });
};

const sendRsPasswordEmail = (resetToken, email) => {
  const mailOptions = {
    from: process.env.HOST_EMAIL,
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: `
    <p>Bạn đã yêu cầu đặt lại mật khẩu</p>
    <p>Vui lòng nhấn vào <a href="${process.env.HOST_URL}/reset-password/verify/${resetToken}">link</a> sau để đặt lại mật khẩu</p>
    `,
  };
  sendMail(mailOptions);
};
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
        coordinates: [latitude, longtitude],
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
        coordinates: [latitude, longtitude],
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

  async sendResetPasswordEmail(
    sendResetPasswordEmailDto: SendResetPasswordEmailDto,
  ): Promise<ISimpleResponse> {
    try {
      const { email } = sendResetPasswordEmailDto;
      //TODO: Tạo unique resetToken
      const resetToken = uuidv4();
      //TODO: Update trường resetPasswordToken và resetPasswordTokenExpiration
      const customer = await this.customerRepository.findOne({ email: email });
      customer.resetPasswordToken = resetToken;
      customer.resetPasswordTokenExpiration =
        Date.now() + RESET_PASSWORD_TIMEOUT_EXPIRATION;
      await this.customerRepository.save(customer);

      console.log(resetToken);
      console.log(resetToken);
      console.log(Date.now() + RESET_PASSWORD_TIMEOUT_EXPIRATION);
      //TODO: Gửi email cho customer đó
      sendRsPasswordEmail(resetToken, email);
      return {
        status: HttpStatus.OK,
        message: 'Send reset password email successfully',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getCustomerResetPasswordToken(
    getCustomerResetPasswordTokenDto: GetCustomerResetPasswordTokenDto,
  ): Promise<IGetCustomerResetPasswordTokenResponse> {
    try {
      const { resetToken } = getCustomerResetPasswordTokenDto;
      const customer = await this.customerRepository
        .createQueryBuilder('cus')
        .where('cus.resetPasswordToken = :resetToken', {
          resetToken: resetToken,
        })
        .andWhere('cus.resetPasswordTokenExpiration > :now', {
          now: Date.now(),
        })
        .getOne();

      if (!customer) {
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            'User not found with associated reset token or reset token has expired',
          customerId: null,
        };
      }

      return {
        status: HttpStatus.OK,
        message: 'Found customer associated',
        customerId: customer.id,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        customerId: null,
      };
    }
  }

  async updateCustomerPassword(
    updateCustomerPasswordDto: UpdateCustomerPasswordDto,
  ): Promise<ISimpleResponse> {
    try {
      const { resetToken, password, customerId } = updateCustomerPasswordDto;
      console.log(resetToken, password, customerId);
      const customer = await this.customerRepository
        .createQueryBuilder('cus')
        .where('cus.resetPasswordToken = :resetToken', {
          resetToken: resetToken,
        })
        .andWhere('cus.resetPasswordTokenExpiration > :now', {
          now: Date.now(),
        })
        .andWhere('cus.id = :customerId', { customerId: customerId })
        .getOne();

      if (!customer) {
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            'User not found with associated reset token or reset token has expired',
        };
      }

      const hashPassword = await bcrypt.hash(password, 12);
      customer.password = hashPassword;
      customer.resetPasswordToken = null;
      customer.resetPasswordTokenExpiration = null;
      await this.customerRepository.save(customer);

      return {
        status: HttpStatus.OK,
        message: 'Update customer password successfully',
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async updateCustomerInfo(
    updateCustomerInfoDto: UpdateCustomerInfoDto,
  ): Promise<IUpdateCustomerInfoResponse> {
    try {
      const { customerId, avatar, email, gender, name } = updateCustomerInfoDto;

      console.log(customerId);
      console.log(avatar);
      console.log(email);
      console.log(gender);
      console.log(name);
      const customer = await this.customerRepository.findOne({
        id: customerId,
      });

      if (!customer) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Customer not found',
        };
      }

      if (avatar) {
        customer.avatar = avatar;
        await this.customerRepository.save(customer);
        return {
          status: HttpStatus.OK,
          message: 'Update customer avatar successfully',
          avatar: avatar,
        };
      } else if (email) {
        customer.email = email;
        await this.customerRepository.save(customer);
        return {
          status: HttpStatus.OK,
          message: 'Update customer email successfully',
          email: email,
        };
      } else if (gender) {
        customer.gender = gender;
        await this.customerRepository.save(customer);
        return {
          status: HttpStatus.OK,
          message: 'Update customer gender successfully',
          gender: gender,
        };
      } else if (name) {
        customer.name = name;
        await this.customerRepository.save(customer);
        return {
          status: HttpStatus.OK,
          message: 'Update customer name successfully',
          name: name,
        };
      }
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
