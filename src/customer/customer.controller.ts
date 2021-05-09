import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import {
  CreateCustomerAddressDto,
  CreateCustomerDto,
  DeleteCustomerAddressDto,
  GetListCustomerAddressDto,
  SendPhoneNumberOTPVerifyDto,
  UpdateCustomerAddressDto,
  VerifyCustomerPhoneNumberDto,
} from './dto';
import {
  ICustomerAddressesResponse,
  ICustomerAddressResponse,
  ICustomerResponse,
  ICustomerSendOTPVerifyResponse,
} from './interfaces';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }
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

  // Tạo địa chỉ cho customer
  @MessagePattern('createCustomerAddress')
  createCustomerAddress(
    @Payload() createCustomerAddressDto: CreateCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    return this.customerService.createCustomerAddress(createCustomerAddressDto);
  }

  // Update địa chỉ cho customer
  @MessagePattern('updateCustomerAddress')
  updateCustomerAddress(
    @Payload() updateCustomerAddressDto: UpdateCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    return this.customerService.updateCustomerAddress(updateCustomerAddressDto);
  }

  // Xóa địa chỉ cho customer
  @MessagePattern('deleteCustomerAddress')
  deleteCustomerAddress(
    @Payload() deleteCustomerAddressDto: DeleteCustomerAddressDto,
  ): Promise<ICustomerAddressResponse> {
    return this.customerService.deleteCustomerAddress(deleteCustomerAddressDto);
  }

  // List địa chỉ cho customer
  @MessagePattern('getListCustomerAddress')
  getListCustomerAddress(
    @Payload() getListCustomerAddressDto: GetListCustomerAddressDto,
  ): Promise<ICustomerAddressesResponse> {
    return this.customerService.getListCustomerAddress(
      getListCustomerAddressDto,
    );
  }
}
