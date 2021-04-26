import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStaffDto } from './dto/create-staff.dto';
import { FetchStaffDto } from './dto/fetch-staff.dto';
import { StaffDto } from './dto/staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';
import { IStaffServiceCreateStaffResponse } from './interfaces/staff-service-create-staff-response.interface';
import { IStaffServiceFetchStaffResponse } from './interfaces/staff-service-fetch-staff-response.interface';
import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>
  ) {
  }

  async create(createStaffDto: CreateStaffDto): Promise<IStaffServiceCreateStaffResponse> {
    const { data, merchantId } = createStaffDto;
    const { username, password, firstName, lastName, IDNumber, dateOfBirth, phone } = data;

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
      username, password, firstName, lastName, IDNumber, dateOfBirth, phone, merchantId
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

  async findAll(fetchStaffDto: FetchStaffDto): Promise<IStaffServiceFetchStaffResponse> {
    const { merchantId, size, page } = fetchStaffDto;
    const [results, total] = await this.staffRepository.findAndCount({
      where: [{ merchantId }],
      take: size,
      skip: page * size
    });

    return {
      status: HttpStatus.OK,
      message: 'Fetched staff successfully',
      data: {
        results: results.map((staff) => StaffDto.EntityToDTO(staff)),
        size,
        total
      }
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
