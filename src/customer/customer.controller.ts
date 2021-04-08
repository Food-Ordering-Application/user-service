import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { IUserCreateResponse } from './interfaces/user-create-response.interface';
import { IUser } from './interfaces/user.interface';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('createCustomer')
  async create(
    @Payload() createCustomerDto: CreateCustomerDto,
  ): Promise<IUserCreateResponse> {
    const user = await this.customerService.create(createCustomerDto);
    return {
      user,
      message: 'User created successfully',
      status: HttpStatus.CREATED,
      errors: null,
    };
  }

  @MessagePattern('findAllCustomer')
  findAll() {
    return this.customerService.findAll();
  }

  @MessagePattern('findOneCustomer')
  findOne(@Payload() id: number) {
    return this.customerService.findOne(id);
  }

  @MessagePattern('updateCustomer')
  update(@Payload() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(updateCustomerDto.id, updateCustomerDto);
  }

  @MessagePattern('removeCustomer')
  remove(@Payload() id: number) {
    return this.customerService.remove(id);
  }
}
