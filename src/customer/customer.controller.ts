import { Controller, HttpStatus, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { IUserCreateResponse } from './interfaces/user-create-response.interface';
import { IUser } from './interfaces/user.interface';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('createCustomer')
  async create(
    @Payload() createCustomerDto: CreateCustomerDto,
  ): Promise<IUserCreateResponse> {
    let result: IUserCreateResponse;

    // Tìm xem có username có tồn tại hay chưa
    const customerWithUsername = await this.customerService.findByUsername(
      createCustomerDto.username,
    );
    // Nếu người dùng đã tồn tại
    if (customerWithUsername) {
      result = {
        status: HttpStatus.CONFLICT,
        message: 'user_create_conflict',
        user: null,
        errors: {
          username: {
            message: 'Username already exists',
            path: 'username',
          },
        },
      };
    } else {
      // Nếu chưa tồn tại thì tạo user mới
      const newCustomer: Customer = await this.customerService.create(
        createCustomerDto,
      );
      delete newCustomer.password;
      result = {
        status: HttpStatus.CREATED,
        message: 'user_create_success',
        user: newCustomer,
        errors: null,
      };
    }
    return result;
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
