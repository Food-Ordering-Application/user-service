import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { SendPhoneNumberOTPVerifyDto } from './dto/send-otp-verify-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { VerifyCustomerPhoneNumberDto } from './dto/verify-customer-phone-number.dto';
import { ICustomerCreateResponse } from './interfaces/customer-create-response.interface';
import { ICustomerSendOTPVerifyResponse } from './interfaces/customer-send-otp-verify.interface';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}
  // Đăng ký customer
  @MessagePattern('createCustomer')
  async create(
    @Payload() createCustomerDto: CreateCustomerDto,
  ): Promise<ICustomerCreateResponse> {
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
  ): Promise<ICustomerCreateResponse> {
    return this.customerService.findCustomerByPhoneNumber(phoneNumber);
  }

  // @MessagePattern('findAllCustomer')
  // findAll() {
  //   return this.customerService.findAll();
  // }

  // @MessagePattern('updateCustomer')
  // update(@Payload() updateCustomerDto: UpdateCustomerDto) {
  //   return this.customerService.update(updateCustomerDto.id, updateCustomerDto);
  // }

  // @MessagePattern('removeCustomer')
  // remove(@Payload() id: number) {
  //   return this.customerService.remove(id);
  // }
}
