import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateHashedPassword } from '../shared/helper';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { AdminDto } from './dto/admin.dto';
import { GetListDriverDto } from './dto';
import { IDriversResponse } from './interfaces';
import { Driver } from '../deliver/entities';

import * as momenttimezone from 'moment-timezone';

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async getAuthenticatedAdmin(username: string, password: string) {
    const admin = await this.adminsRepository.findOne({
      username,
    });
    if (!admin) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Admin's username does not exist",
        user: null,
      };
    }
    const isMatch = await validateHashedPassword(password, admin.password);
    if (!isMatch)
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Admin's password does not correct",
        user: null,
      };
    return {
      status: HttpStatus.OK,
      message: 'Admin information is verified',
      user: AdminDto.EntityToDTO(admin),
    };
  }

  //! Lấy danh sách tài xế
  async getListDriver(
    getListDriverDto: GetListDriverDto,
  ): Promise<IDriversResponse> {
    const {
      page = 1,
      size = 10,
      from = null,
      to = null,
      adminId,
    } = getListDriverDto;

    try {
      //TODO: Lấy danh sách admin, nếu adminId không trùng thì trả về
      const admins = await this.adminsRepository
        .createQueryBuilder('admin')
        .getMany();
      let flag = 0;
      for (const admin of admins) {
        if (adminId === admin.id) {
          flag = 1;
          break;
        }
      }

      if (!flag) {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
          drivers: null,
        };
      }

      //TODO: Lấy thông tin driver
      let driverQueryBuilder = this.driverRepository
        .createQueryBuilder('driver')
        .select([
          'driver.id',
          'driver.phoneNumber',
          'driver.email',
          'driver.name',
          'driver.city',
          'driver.isBanned',
          'driver.isVerified',
          'driver.dateOfBirth',
          'driver.IDNumber',
          'driver.licensePlate',
          'driver.avatar',
          'driver.identityCardImageUrl',
          'driver.driverLicenseImageUrl',
          'driver.vehicleRegistrationCertificateImageUrl',
          'driver.isActive',
        ])
        .skip((page - 1) * size)
        .take(size);

      console.log('from', from);
      console.log('to', to);

      if (from && to) {
        const fromDate = momenttimezone
          .tz(from, 'Asia/Ho_Chi_Minh')
          .utc()
          .format();
        const toDate = momenttimezone.tz(to, 'Asia/Ho_Chi_Minh').utc().format();

        console.log('fromDate', fromDate);
        console.log('toDate', toDate);

        driverQueryBuilder = driverQueryBuilder
          .andWhere('driver.createdAt >= :startDate', {
            startDate: fromDate,
          })
          .andWhere('driver.createdAt <= :endDate', {
            endDate: toDate,
          });
      }

      const drivers = await driverQueryBuilder
        .orderBy('driver.createdAt', 'DESC')
        .getMany();

      console.log('Drivers', drivers);

      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        drivers: drivers,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
