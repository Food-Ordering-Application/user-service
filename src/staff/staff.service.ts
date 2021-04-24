import { StaffDto } from './dto/staff.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';
import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>
  ) {
  }

  async create(createStaffDto: CreateStaffDto): Promise<IStaffServiceResponse> {
    const { data, merchantId } = createStaffDto;
    const { username, password, fullName, IDNumber, dateOfBirth, phone } = data;

    const staffWithThisUsername = await this.staffRepository.findOne({
      username,
      merchantId
    });

    if (staffWithThisUsername) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Staff\'s username already exists',
        data: null
      }
    }

    const newUser = this.staffRepository.create({
      username, password, fullName, IDNumber, dateOfBirth, phone, merchantId
    });
    await this.staffRepository.save(newUser);

    return {
      status: HttpStatus.CREATED,
      message: 'Staff created successfully',
      data: {
        staff: StaffDto.EntityToDTO(newUser)
      }
    };
  }

  async findAll(): Promise<IStaffServiceResponse> {
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      // user: MerchantDto.EntityToDTO(newUser),
      data: null
    };
  }

  async findOne(id: number): Promise<IStaffServiceResponse> {
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      // user: MerchantDto.EntityToDTO(newUser),
      data: null
    };
  }

  async update(id: number, updateStaffDto: UpdateStaffDto): Promise<IStaffServiceResponse> {
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      // user: MerchantDto.EntityToDTO(newUser),
      data: null
    };
  }

  async remove(id: number): Promise<IStaffServiceResponse> {
    return {
      status: HttpStatus.CREATED,
      message: 'User created successfully',
      // user: MerchantDto.EntityToDTO(newUser),
      data: null
    };
  }
}
