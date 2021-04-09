import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Hash password
    const newCustomer = new Customer();
    newCustomer.username = createCustomerDto.username;
    newCustomer.password = await bcrypt.hash(createCustomerDto.password, 12);
    await this.customersRepository.save(newCustomer);
    return newCustomer;
  }

  findAll() {
    return this.customersRepository.find();
  }

  async findByUsername(username: string): Promise<Customer> {
    return this.customersRepository.findOne({ username: username });
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
