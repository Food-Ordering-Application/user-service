import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { IUserCreateResponse } from './interfaces/user-create-response.interface';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('createCustomer')
  async create(
    @Payload() createCustomerDto: CreateCustomerDto,
  ): Promise<IUserCreateResponse> {
    return this.customerService.create(createCustomerDto);
  }

  @MessagePattern('findCustomerByUsername')
  findByUsername(@Payload() username: string): Promise<IUserCreateResponse> {
    return this.customerService.findByUsername(username);
  }

  @MessagePattern('findAllCustomer')
  findAll() {
    return this.customerService.findAll();
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
