import { MerchantService } from './../merchant/merchant.service';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateHashedPassword } from '../shared/helper';
import { Repository } from 'typeorm';
import { CreateStaffDto } from './dto/create-staff.dto';
import { FetchStaffDto } from './dto/fetch-staff.dto';
import { StaffDto } from './dto/staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff } from './entities/staff.entity';
import { IStaffServiceCreateStaffResponse } from './interfaces/staff-service-create-staff-response.interface';
import { IStaffServiceFetchStaffResponse } from './interfaces/staff-service-fetch-staff-response.interface';
import { IStaffServiceLoginPosResponse } from './interfaces/staff-service-login-pos-response.interface';
import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    private merchantService: MerchantService
  ) {
  }

  async create(createStaffDto: CreateStaffDto): Promise<IStaffServiceCreateStaffResponse> {
    const { data, merchantId, restaurantId } = createStaffDto;
    const { username, password, firstName, lastName, IDNumber, dateOfBirth, phone } = data;

    const doesRestaurantExistPromise = this.merchantService.doesRestaurantExist(restaurantId);
    const staffWithThisUsernamePromise = this.staffRepository.findOne({
      username,
      merchantId,
      restaurantId
    });

    const [doesRestaurantExist, staffWithThisUsername] = await Promise.all([doesRestaurantExistPromise, staffWithThisUsernamePromise]);

    if (!doesRestaurantExist) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
        data: null
      }
    }
    if (staffWithThisUsername) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Staff\'s username already exists',
        data: null
      }
    }

    const newUser = this.staffRepository.create({
      username, password, firstName, lastName, IDNumber, dateOfBirth, phone, merchantId, restaurantId
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
    const { merchantId, restaurantId, size, page } = fetchStaffDto;
    const doesRestaurantExistPromise = this.merchantService.doesRestaurantExist(restaurantId);
    const fetchPromise = this.staffRepository.findAndCount({
      where: [{ merchantId, restaurantId }],
      take: size,
      skip: page * size
    });

    const [doesRestaurantExist, [results, total]] = await Promise.all([doesRestaurantExistPromise, fetchPromise]);

    if (!doesRestaurantExist) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Restaurant not found',
        data: null
      };
    }

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