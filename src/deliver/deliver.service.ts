import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentInfo, PayPalPayment } from '../merchant/entities';
import {
  CheckDriverAccountBalanceDto,
  GetDriverInformationDto,
  RegisterDriverDto,
} from './dto';
import { AccountWallet, Driver, DriverPaymentInfo } from './entities';
import { EPaymentMethod } from './enums';
import {
  ICanDriverAcceptOrderResponse,
  IDriverResponse,
  IGetDriverInformationResponse,
} from './interfaces';

const COMISSION_FEE_PERCENT = 0.2;
const DEPOSIT_BALANCE_LIMIT_PERCENT = 0.5;

@Injectable()
export class DeliverService {
  private readonly logger = new Logger('DriverService');

  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(AccountWallet)
    private accountWalletRepository: Repository<AccountWallet>,
    @InjectRepository(PayPalPayment)
    private paypalPaymentRepository: Repository<PayPalPayment>,
    @InjectRepository(PaymentInfo)
    private paymentInfoRepository: Repository<PaymentInfo>,
    @InjectRepository(DriverPaymentInfo)
    private driverPaymentInfoRepository: Repository<DriverPaymentInfo>,
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
        merchantIdInPaypal,
        licensePlate,
        avatar,
      } = registerDriverDto;

      //TODO: Tạo bảng AccountWallet
      const accountWallet = new AccountWallet();
      accountWallet.mainBalance = 0;
      accountWallet.depositBalance = 2000000;
      //TODO: Tạo bảng paypalPayment
      const paypalPayment = new PayPalPayment();
      paypalPayment.merchantIdInPayPal = merchantIdInPaypal;
      await Promise.all([
        this.accountWalletRepository.save(accountWallet),
        this.paypalPaymentRepository.save(paypalPayment),
      ]);

      //TODO: Tạo bảng Driver
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
      driver.licensePlate = licensePlate;
      driver.avatar = avatar;
      driver.wallet = accountWallet;
      //TODO: Tạo bảng PaymentInfo
      const paymentInfo = new PaymentInfo();
      paymentInfo.paypal = paypalPayment;
      await Promise.all([
        this.paymentInfoRepository.save(paymentInfo),
        this.driverRepository.save(driver),
      ]);

      //TODO: Tạo bảng DriverPaymentInfo
      const driverPaymentInfo = new DriverPaymentInfo();
      driverPaymentInfo.driver = driver;
      driverPaymentInfo.isDefault = true;
      driverPaymentInfo.paymentInfo = paymentInfo;
      await this.driverPaymentInfoRepository.save(driverPaymentInfo);

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

  //! Kiểm tra balance của driver xem có đủ điều kiện accept đơn ko
  async checkDriverAccountBalance(
    checkDriverAccountBalanceDto: CheckDriverAccountBalanceDto,
  ): Promise<ICanDriverAcceptOrderResponse> {
    const { order, driverId } = checkDriverAccountBalanceDto;
    try {
      //TODO: Lấy thông tin account balance driver
      const accountWallet = await this.accountWalletRepository
        .createQueryBuilder('accountW')
        .leftJoinAndSelect('accountW.driver', 'driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      switch (order.invoice.payment.method) {
        //TODO: Trường hợp COD (Trả sau)
        case EPaymentMethod.COD:
          //TODO: Check xem trong ví (tài khoản chính - 20%*shippingFee).abs() > 50% * tài khoản ký quỹ
          if (
            Math.abs(
              accountWallet.mainBalance -
                COMISSION_FEE_PERCENT * order.delivery.shippingFee,
            ) >
            DEPOSIT_BALANCE_LIMIT_PERCENT * accountWallet.depositBalance
          ) {
            return {
              status: HttpStatus.FORBIDDEN,
              message:
                'Driver cant accept order due to not having enough money in account',
              canAccept: false,
            };
          } else {
            //TODO: Trừ 20% tiền hoa hồng trong tài khoản driver
            accountWallet.mainBalance -=
              COMISSION_FEE_PERCENT * order.delivery.shippingFee;
            await this.accountWalletRepository.save(accountWallet);
            return {
              status: HttpStatus.OK,
              message: 'Driver can accept order',
              canAccept: true,
            };
          }
        //TODO: Trường hợp Paypal (Trả trước)
        case EPaymentMethod.PAYPAL:
          //TODO: Check xem trong ví (tài khoản chính - 20%*shippingFee - tiền hàng).abs()
          //TODO: > 50% * tài khoản ký quỹ
          if (
            Math.abs(
              accountWallet.mainBalance -
                COMISSION_FEE_PERCENT * order.delivery.shippingFee -
                order.subTotal,
            ) >
            DEPOSIT_BALANCE_LIMIT_PERCENT * accountWallet.depositBalance
          ) {
            return {
              status: HttpStatus.FORBIDDEN,
              message:
                'Driver cant accept order due to not having enough money in account',
              canAccept: false,
            };
          } else {
            //TODO: Trừ 20%*shippingFee + tiền hàng trong tài khoản driver
            accountWallet.mainBalance -=
              COMISSION_FEE_PERCENT * order.delivery.shippingFee +
              order.subTotal;
            await this.accountWalletRepository.save(accountWallet);
            return {
              status: HttpStatus.OK,
              message: 'Driver can accept order',
              canAccept: true,
            };
          }
      }
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        canAccept: false,
      };
    }
  }

  //! Lấy sđt, tên, ảnh khuôn mặt, biển số của driver
  async getDriverInformation(
    getDriverInformationDto: GetDriverInformationDto,
  ): Promise<IGetDriverInformationResponse> {
    const { driverId } = getDriverInformationDto;
    try {
      //TODO: Lấy thông tin driver với driverId
      const driver = await this.driverRepository
        .createQueryBuilder('driver')
        .select([
          'driver.phoneNumber',
          'driver.name',
          'driver.licensePlate',
          'driver.avatar',
        ])
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      console.log('Driver', driver);
      return {
        status: HttpStatus.OK,
        message: 'DriverInfo fetched successfully',
        driverInfo: driver,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        driverInfo: null,
      };
    }
  }
}
