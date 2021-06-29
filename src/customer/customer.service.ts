import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './entities/customer.entity';
import { ICustomerResponse } from './interfaces/customer-response.interface';
import { SendPhoneNumberOTPVerifyDto } from './dto/send-otp-verify-customer.dto';
import { ICustomerSendOTPVerifyResponse } from './interfaces/customer-send-otp-verify.interface';
import { VerifyCustomerPhoneNumberDto } from './dto/verify-customer-phone-number.dto';
import {
  CreateCustomerAddressDto,
  DeleteCustomerAddressDto,
  GetCustomerInformationToCreateDeliveryDto,
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
  IGetInformationForDeliveryResponse,
  ISimpleResponse,
  IUpdateCustomerInfoResponse,
  IVerifyCustomerEmail,
} from './interfaces';
import { CustomerAddress } from './entities';
import { v4 as uuidv4 } from 'uuid';
import { transporter } from './config/nodemailer.config';
import { google } from 'googleapis';
import { VerifyCustomerEmailDto } from './dto/verify-customer-email.dto';

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

const sendVerifyEmail = (verifyEmailToken, email) => {
  const mailOptions = {
    from: process.env.HOST_EMAIL,
    to: email,
    subject: 'Kích hoạt email',
    html: `
    <p>Bạn đã yêu cầu kích hoạt email</p>
    <p>Vui lòng nhấn vào <a href="${process.env.HOST_URL}/add-email/verify/${verifyEmailToken}">link</a> sau để kích hoạt email</p>
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
    @InjectConnection()
    private connection: Connection,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<ICustomerResponse> {
    let result: ICustomerResponse;
    let { password, phoneNumber } = createCustomerDto;
    password = password.trim();
    phoneNumber = phoneNumber.trim();
    // Tìm xem PhoneNumber có tồn tại hay chưa
    try {
      const customer = await this.customerRepository.findOne({
        phoneNumber: phoneNumber,
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
        newCustomer.phoneNumber = phoneNumber;
        newCustomer.password = password;

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
      console.log('findCustomerByPhoneNumber');
      const customer = await this.customerRepository.findOne(
        {
          phoneNumber: phoneNumber,
        },
        {
          select: [
            'id',
            'password',
            'email',
            'phoneNumber',
            'isEmailVerified',
            'isPhoneNumberVerified',
            'gender',
          ],
        },
      );

      console.log('customer', customer);
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
    try {
      let { phoneNumber } = sendPhoneNumberOTPVerifyDto;
      const { recaptchaToken } = sendPhoneNumberOTPVerifyDto;
      console.log(phoneNumber, recaptchaToken);
      const identityToolkit = google.identitytoolkit({
        auth: process.env.GOOGLE_API_KEY,
        version: 'v3',
      });

      const response = await identityToolkit.relyingparty.sendVerificationCode({
        requestBody: { phoneNumber, recaptchaToken },
      });

      // save sessionInfo into db. You will need this to verify the SMS code
      const sessionInfo = response.data.sessionInfo;

      // Tìm ra user lưu lại sessionInfo
      //TODO: Bỏ đi +84
      phoneNumber = phoneNumber.substring(3);
      //TODO: Thêm 0 ở đầu
      phoneNumber = '0' + phoneNumber;
      console.log('PhoneNumber', phoneNumber);
      const customer = await this.customerRepository.findOne({
        phoneNumber: phoneNumber,
      });
      console.log('customer', customer);
      customer.sessionInfo = sessionInfo;
      await this.customerRepository.save(customer);
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
      const { otp, phoneNumber } = verifyCustomerPhoneNumberDto;
      // Tìm ra customer dựa trên phoneNumber
      const customer = await this.customerRepository.findOne({
        phoneNumber: phoneNumber,
      });

      const identityToolkit = google.identitytoolkit({
        auth: process.env.GOOGLE_API_KEY,
        version: 'v3',
      });

      await identityToolkit.relyingparty.verifyPhoneNumber({
        requestBody: { code: otp, sessionInfo: customer.sessionInfo },
      });

      //TODO: update flag
      customer.isPhoneNumberVerified = true;
      customer.sessionInfo = null;
      await this.customerRepository.save(customer);

      return {
        status: HttpStatus.OK,
        message: 'Verify customer phoneNumber successfully',
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
      const { address, customerId, latitude, longtitude } =
        createCustomerAddressDto;

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
      const { address, customerId, latitude, longtitude, customerAddressId } =
        updateCustomerAddressDto;

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
  ): Promise<ICustomerAddressResponse> {
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
          status: HttpStatus.NOT_FOUND,
          message: 'Customer has no address',
        };
      }
      return {
        status: HttpStatus.OK,
        message: 'Customer addresses fetched successfully',
        address: defaultAddress,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getCustomerInformationToCreateDelivery(
    getCustomerInformationToCreateDeliveryDto: GetCustomerInformationToCreateDeliveryDto,
  ): Promise<IGetInformationForDeliveryResponse> {
    try {
      const { customerId } = getCustomerInformationToCreateDeliveryDto;

      const customer = await this.customerRepository
        .createQueryBuilder('customer')
        .leftJoinAndSelect(
          'customer.customerAddresses',
          'customerAddress',
          'customerAddress.default = :addressDefault',
          {
            addressDefault: true,
          },
        )
        .where('customer.id = :customerId', {
          customerId: customerId,
        })
        .select(['customerAddress', 'customer.name', 'customer.phoneNumber'])
        .getOne();

      if (!customer) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Customer not found',
          data: null,
        };
      }
      const { name, phoneNumber, customerAddresses } = customer;
      const customerAddress =
        Array.isArray(customerAddresses) &&
        customerAddresses.length &&
        customerAddresses[0];

      return {
        status: HttpStatus.OK,
        message: 'Fetch customer information successfully',
        data: {
          // Nếu user chưa có address thì trả về null
          address: customerAddress?.address || null,
          geom: customerAddress?.geom || null,
          name,
          phoneNumber,
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
    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const { customerId, customerAddressId } = updateDefaultCustomerAddressDto;
      //TODO: Tìm ra customerAddress có default = true đổi lại thành false
      const oldDefaultCustomerAddress = await queryRunner.manager
        .getRepository(CustomerAddress)
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
      await queryRunner.manager.save(
        CustomerAddress,
        oldDefaultCustomerAddress,
      );
      const newDefaultCustomerAddress = await queryRunner.manager
        .getRepository(CustomerAddress)
        .createQueryBuilder('cAddress')
        .where('cAddress.id = :customerAddressId', {
          customerAddressId: customerAddressId,
        })
        .getOne();

      newDefaultCustomerAddress.default = true;

      await queryRunner.manager.save(
        CustomerAddress,
        newDefaultCustomerAddress,
      );
      await queryRunner.commitTransaction();
      console.log('Commit');
      return {
        status: HttpStatus.OK,
        message: 'Default customer address updated successfully',
        address: newDefaultCustomerAddress,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        address: null,
      };
    } finally {
      await queryRunner.release();
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
      const customer = await this.customerRepository.findOne({
        email: email,
        isEmailVerified: true,
      });

      //TODO: Nếu không tìm thấy customer
      //TODO: Do customer đó chưa cập nhật email hoặc email chưa được verify
      if (!customer) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message:
            'Không tìm thấy email nào hoặc email liên kết với tài khoản chưa được kích hoạt',
        };
      }

      customer.resetPasswordToken = resetToken;
      customer.resetPasswordTokenExpiration =
        Date.now() + RESET_PASSWORD_TIMEOUT_EXPIRATION;
      await this.customerRepository.save(customer);

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
      console.log('resetToken', resetToken);
      const customer = await this.customerRepository
        .createQueryBuilder('cus')
        .where('cus.resetPasswordToken = :resetToken', {
          resetToken: resetToken,
        })
        .andWhere('cus.resetPasswordTokenExpiration > :now', {
          now: Date.now(),
        })
        .getOne();
      console.log(customer);

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

      customer.password = password;
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
        //TODO: Tìm xem có acccount customer nào liên kết với email này hay chưa
        const findCustomer = await this.customerRepository.findOne({
          email: email,
          isEmailVerified: true,
        });

        if (!findCustomer) {
          //TODO: Tạo unique emailToken
          const verifyEmailToken = uuidv4();
          //TODO: Update trường verifyEmailToken và verifyEmailTokenExpiration
          customer.email = email;
          customer.verifyEmailToken = verifyEmailToken;
          customer.verifyEmailTokenExpiration =
            Date.now() + RESET_PASSWORD_TIMEOUT_EXPIRATION;
          await this.customerRepository.save(customer);

          //TODO: Gửi email cho customer đó
          sendVerifyEmail(verifyEmailToken, email);
          return {
            status: HttpStatus.OK,
            message: 'Send email verify successfully',
            email: email,
          };
        } else {
          return {
            status: HttpStatus.CONFLICT,
            message: 'Email have been registered',
          };
        }
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

  async verifyCustomerEmail(
    verifyCustomerEmailDto: VerifyCustomerEmailDto,
  ): Promise<IVerifyCustomerEmail> {
    try {
      const { verifyEmailToken } = verifyCustomerEmailDto;
      const customer = await this.customerRepository
        .createQueryBuilder('cus')
        .where('cus.verifyEmailToken = :verifyEmailToken', {
          verifyEmailToken: verifyEmailToken,
        })
        .andWhere('cus.verifyEmailTokenExpiration > :now', {
          now: Date.now(),
        })
        .getOne();
      console.log(customer);

      if (!customer) {
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            'User not found with associated email verify token or email verify token has expired',
        };
      }

      customer.verifyEmailToken = null;
      customer.verifyEmailTokenExpiration = null;
      customer.isEmailVerified = true;
      await this.customerRepository.save(customer);
      return {
        status: HttpStatus.OK,
        message: 'Verify customer email successfully',
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
