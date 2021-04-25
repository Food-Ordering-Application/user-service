import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { SendPhoneNumberOTPVerifyDto } from './dto/send-otp-verify-customer.dto';
import { VerifyCustomerPhoneNumberDto } from './dto/verify-customer-phone-number.dto';
import { ICustomerResponse } from './interfaces/customer-response.interface';
import { ICustomerSendOTPVerifyResponse } from './interfaces/customer-send-otp-verify.interface';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}
  // Đăng ký customer
  @MessagePattern('createCustomer')
  async create(
    @Payload() createCustomerDto: CreateCustomerDto,
  ): Promise<ICustomerResponse> {
    return this.customerService.create(createCustomerDto);
  }

  // Gửi OTP verify
  @MessagePattern('sendPhoneNumberOTPVerify')
  async sendPhoneNumberOTPVerify(
    @Payload() sendPhoneNumberOTPVerifyDto: SendPhoneNumberOTPVerifyDto,
  ): Promise<ICustomerSendOTPVerifyResponse> {
    return this.customerService.sendPhoneNumberOTPVerify(
      sendPhoneNumberOTPVerifyDto,
    );
  }

  // Verify phoneNumber
  @MessagePattern('verifyCustomerPhoneNumber')
  async verifyCustomerPhoneNumber(
    @Payload() verifyCustomerPhoneNumberDto: VerifyCustomerPhoneNumberDto,
  ): Promise<ICustomerSendOTPVerifyResponse> {
    return this.customerService.verifyCustomerPhoneNumber(
      verifyCustomerPhoneNumberDto,
    );
  }

  // Tìm kiếm customer bằng số điện thoại
  @MessagePattern('findCustomerByPhoneNumber')
  findCustomerByPhoneNumber(
    @Payload() phoneNumber: string,
  ): Promise<ICustomerResponse> {
    return this.customerService.findCustomerByPhoneNumber(phoneNumber);
  }

  // Tìm kiếm customer bằng số điện thoại
  @MessagePattern('findCustomerById')
  findCustomerById(@Payload() customerId: string): Promise<ICustomerResponse> {
    return this.customerService.findCustomerById(customerId);
  }
}
