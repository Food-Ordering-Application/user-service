import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDriverDto } from './dto';
import { Driver } from './entities';
import { IDriverResponse } from './interfaces';

@Injectable()
export class DeliverService {
  private readonly logger = new Logger('DriverService');

  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  //! Tìm kiếm driver bằng số điện thoại
  async findDriverByPhonenumber(phoneNumber: string): Promise<IDriverResponse> {
    try {
      const driver = await this.driverRepository.findOne({
        phoneNumber: phoneNumber,
      });
      return {
        status: HttpStatus.OK,
        message: 'Driver was found successfully',
        driver: driver,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        driver: null,
      };
    }
  }

  //! Đăng ký driver
  async registerDriver(
    registerDriverDto: RegisterDriverDto,
  ): Promise<IDriverResponse> {
    try {
      const {
        IDNumber,
        city,
        dateOfBirth,
        driverLicenseImageUrl,
        email,
        identityCardImageUrl,
        name,
        password,
        phoneNumber,
        vehicleRegistrationCertificateImageUrl,
      } = registerDriverDto;

      const driver = new Driver();
      driver.IDNumber = IDNumber;
      driver.city = city;
      const date = new Date(dateOfBirth);
      console.log('Date', date);
      driver.dateOfBirth = date;
      driver.driverLicenseImageUrl = driverLicenseImageUrl;
      driver.email = email;
      driver.identityCardImageUrl = identityCardImageUrl;
      driver.name = name;
      driver.phoneNumber = phoneNumber;
      driver.vehicleRegistrationCertificateImageUrl =
        vehicleRegistrationCertificateImageUrl;
      driver.password = password;

      await this.driverRepository.save(driver);

      return {
        status: HttpStatus.OK,
        message: 'Driver created successfully',
        driver: driver,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        driver: null,
      };
    }
  }
}
