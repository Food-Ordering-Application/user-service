import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { PaymentInfo, PayPalPayment } from '../merchant/entities';
import {
  ApproveDepositMoneyIntoMainAccountWalletDto,
  CheckDriverAccountBalanceDto,
  DepositMoneyIntoMainAccountWalletDto,
  EventPaypalOrderOccurDto,
  GetDriverInformationDto,
  GetDriverStatisticDto,
  GetListDriverAccountTransactionDto,
  GetListDriverTransactionHistoryDto,
  GetMainAccountWalletBalanceDto,
  OrderHasBeenAssignedToDriverEventDto,
  OrderHasBeenCompletedEventDto,
  RegisterDriverDto,
  UpdateIsActiveOfDriverDto,
  WithdrawMoneyToPaypalAccountDto,
} from './dto';
import {
  AccountTransaction,
  AccountWallet,
  DeliveryHistory,
  Driver,
  DriverPaymentInfo,
  DriverTransaction,
  PayinTransaction,
  RestaurantTransaction,
  WithdrawTransaction,
} from './entities';
import {
  EDriverTransactionType,
  EPayinTransactionStatus,
  EPaymentMethod,
  EWithdrawTransactionStatus,
  EOperationType,
  EGeneralTransactionStatus,
  EIsActive,
  EAccountTransaction,
  ERestaurantTransactionType,
} from './enums';
import {
  IAccountTransactionsReponse,
  IAccountWalletResponse,
  ICanDriverAcceptOrderResponse,
  IDayStatisticData,
  IDepositMoneyIntoMainAccountWalletResponse,
  IDriverDailyStatisticResponse,
  IDriverResponse,
  IDriverStatisticResponse,
  IDriverTransactionsResponse,
  IGetDriverInformationResponse,
  IIsActiveResponse,
  IMainBalanceResponse,
} from './interfaces';
import axios from 'axios';
import * as paypal from '@paypal/checkout-server-sdk';
import * as paypalPayout from '@paypal/payouts-sdk';
import { client } from './config/checkout-paypal';
import { client as payoutClient } from './config/payout-paypal';
import { ISimpleResponse } from '../customer/interfaces';
import * as uniqid from 'uniqid';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '../constants';
import * as momenttimezone from 'moment-timezone';
import * as moment from 'moment';

const DEFAULT_EXCHANGE_RATE = 0.00004;
const COMMISSION_FEE_PERCENT = 0.05;
const DEPOSIT_BALANCE_LIMIT_PERCENT = 0.5;
const MINIMUM_MAIN_ACCOUNT_AMOUNT_TO_WITHDRAW = 300000;
const MINIMUM_MONEY_TO_WITHDRAW_AMOUNT = 200000;
const MAXIMUM_MONEY_TO_WITHDRAW_AMOUNT = 3000000;

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
    @InjectRepository(DriverTransaction)
    private driverTransactionRepository: Repository<DriverTransaction>,
    @InjectRepository(DeliveryHistory)
    private deliveryHistoryRepository: Repository<DeliveryHistory>,
    @InjectRepository(AccountTransaction)
    private accountTransactionRepository: Repository<AccountTransaction>,
    @InjectRepository(RestaurantTransaction)
    private restaurantTransactionRepository: Repository<RestaurantTransaction>,
    @InjectConnection()
    private connection: Connection,
    @Inject(NOTIFICATION_SERVICE)
    private notificationServiceClient: ClientProxy,
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
    let queryRunner;
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
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      //TODO: Check nếu đã có driver với sđt đó r
      const oldDriver = await this.driverRepository
        .createQueryBuilder('driver')
        .where('driver.phoneNumber = :phoneNumber', {
          phoneNumber: phoneNumber,
        })
        .getOne();

      if (oldDriver) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Already have driver with that phoneNumber in the database',
        };
      }

      //TODO: Tạo bảng AccountWallet
      const accountWallet = new AccountWallet();
      accountWallet.mainBalance = 0;
      accountWallet.depositBalance = 2000000;
      //TODO: Tạo bảng paypalPayment
      const paypalPayment = new PayPalPayment();
      paypalPayment.merchantIdInPayPal = merchantIdInPaypal;
      await Promise.all([
        queryRunner.manager.save(AccountWallet, accountWallet),
        queryRunner.manager.save(PayPalPayment, paypalPayment),
      ]);

      //TODO: Tạo bảng Driver
      const driver = new Driver();
      driver.IDNumber = IDNumber;
      driver.city = city;
      const date = new Date(dateOfBirth);
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
        queryRunner.manager.save(PaymentInfo, paymentInfo),
        queryRunner.manager.save(Driver, driver),
      ]);

      //TODO: Tạo bảng DriverPaymentInfo
      const driverPaymentInfo = new DriverPaymentInfo();
      driverPaymentInfo.driver = driver;
      driverPaymentInfo.isDefault = true;
      driverPaymentInfo.paymentInfo = paymentInfo;
      await queryRunner.manager.save(DriverPaymentInfo, driverPaymentInfo);
      await queryRunner.commitTransaction();
      return {
        status: HttpStatus.OK,
        message: 'Driver created successfully',
        driver: driver,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        driver: null,
      };
    } finally {
      await queryRunner.release();
    }
  }

  //! Kiểm tra balance của driver xem có đủ điều kiện accept đơn ko
  async checkDriverAccountBalance(
    checkDriverAccountBalanceDto: CheckDriverAccountBalanceDto,
  ): Promise<ICanDriverAcceptOrderResponse> {
    const { order, driverId } = checkDriverAccountBalanceDto;
    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //TODO: Lấy thông tin account balance driver
      const accountWallet = await queryRunner.manager
        .getRepository(AccountWallet)
        .createQueryBuilder('accountW')
        .leftJoinAndSelect('accountW.driver', 'driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      switch (order.invoice.payment.method) {
        //TODO: Trường hợp COD (Trả sau)
        case EPaymentMethod.COD:
          //TODO: Check xem trong ví (tài khoản chính - 20%*shippingFee).abs() > 50% * tài khoản ký quỹ
          if (
            accountWallet.mainBalance -
              COMMISSION_FEE_PERCENT * order.delivery.shippingFee <
              0 &&
            Math.abs(
              accountWallet.mainBalance -
                COMMISSION_FEE_PERCENT * order.delivery.shippingFee,
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
            return {
              status: HttpStatus.OK,
              message: 'Driver can accept order',
              canAccept: true,
            };
          }
        //TODO: Trường hợp Paypal || ZALOPAY (Trả trước)
        case EPaymentMethod.PAYPAL:
        case EPaymentMethod.ZALOPAY:
          //TODO: Check xem trong ví (tài khoản chính - 20%*shippingFee - tiền hàng).abs()
          //TODO: > 50% * tài khoản ký quỹ
          if (
            accountWallet.mainBalance -
              COMMISSION_FEE_PERCENT * order.delivery.shippingFee -
              order.subTotal <
              0 &&
            Math.abs(
              accountWallet.mainBalance -
                COMMISSION_FEE_PERCENT * order.delivery.shippingFee -
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
            return {
              status: HttpStatus.OK,
              message: 'Driver can accept order',
              canAccept: true,
            };
          }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        canAccept: false,
      };
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
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

      if (!driver) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'DriverInfo not found',
          driver: null,
        };
      }

      return {
        status: HttpStatus.OK,
        message: 'DriverInfo fetched successfully',
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

  //! CreateOrder Nạp tiền vào tài khoản chính driver
  async depositMoneyIntoMainAccountWallet(
    depositMoneyIntoMainAccountWalletDto: DepositMoneyIntoMainAccountWalletDto,
  ): Promise<IDepositMoneyIntoMainAccountWalletResponse> {
    const { callerId, moneyToDeposit, driverId } =
      depositMoneyIntoMainAccountWalletDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      //TODO: Lấy thông tin driver
      const driver = await this.driverRepository
        .createQueryBuilder('driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      let exchangeRate;
      try {
        exchangeRate = await axios.get(
          'https://free.currconv.com/api/v7/convert?q=VND_USD&compact=ultra&apiKey=4ea1fc028af307b152e8',
        );
      } catch (error) {
        console.log('Get ExchangeRate Error -> move to fallback exchangeRate');
      }
      const rate = exchangeRate
        ? exchangeRate.data.VND_USD
        : DEFAULT_EXCHANGE_RATE;
      //TODO: Đổi tiền muốn chuyển từ VND sang USD
      const moneyToDepositUSD = parseFloat((moneyToDeposit * rate).toFixed(2));

      //TODO: Gọi api paypal tạo order
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: moneyToDepositUSD.toString(),
            },
            payee: {
              merchant_id: 'LU9XXKX9PSTRW',
            },
          },
        ],
      });

      const paypalOrder = await client().execute(request);
      console.log('OK');
      //TODO: Tạo đối tượng driverTransaction, payinTransaction
      const driverTransaction = new DriverTransaction();
      driverTransaction.amount = moneyToDeposit;
      driverTransaction.driver = driver;
      driverTransaction.type = EDriverTransactionType.PAYIN;
      await queryRunner.manager.save(DriverTransaction, driverTransaction);
      console.log('driverTransaction', driverTransaction);

      const payinTransaction = new PayinTransaction();
      payinTransaction.paypalOrderId = paypalOrder.result.id;
      payinTransaction.status = EPayinTransactionStatus.PENDING_USER_ACTION;
      payinTransaction.driverTransaction = driverTransaction;
      await queryRunner.manager.save(PayinTransaction, payinTransaction);
      console.log('payinTransaction', payinTransaction);
      await queryRunner.commitTransaction();
      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        paypalOrderId: paypalOrder.result.id,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! ApproveOrder Nạp tiền vào tài khoản chính driver
  async approveDepositMoneyIntoMainAccountWallet(
    approveDepositMoneyIntoMainAccountWalletDto: ApproveDepositMoneyIntoMainAccountWalletDto,
  ): Promise<IMainBalanceResponse> {
    let queryRunner;
    try {
      const { paypalOrderId, callerId, driverId } =
        approveDepositMoneyIntoMainAccountWalletDto;

      //TODO: Nếu như driverId !== callerId
      if (driverId !== callerId) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
        };
      }

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      console.log('START TRANSACTION');
      //TODO: Lấy DriverTransaction và PayinTransaction của driver
      //TODO: Lấy thông tin accountWallet của driver
      const [driverTransaction, accountWallet] = await Promise.all([
        queryRunner.manager
          .getRepository(DriverTransaction)
          .createQueryBuilder('driverTransaction')
          .leftJoinAndSelect(
            'driverTransaction.payinTransaction',
            'payinTransaction',
          )
          .where('payinTransaction.status = :payinTransactionStatus', {
            payinTransactionStatus: EPayinTransactionStatus.PENDING_USER_ACTION,
          })
          .andWhere('payinTransaction.paypalOrderId = :paypalOrderId', {
            paypalOrderId: paypalOrderId,
          })
          .getOne(),
        queryRunner.manager
          .getRepository(AccountWallet)
          .createQueryBuilder('accountW')
          .leftJoin('accountW.driver', 'driver')
          .setLock('pessimistic_write')
          .where('driver.id = :driverId', { driverId: driverId })
          .getOne(),
      ]);

      if (!driverTransaction) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'DriverTransaction not found',
        };
      }

      if (!accountWallet) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'AccountWallet not found',
        };
      }

      //TODO: Call PayPal to capture the order
      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      request.requestBody({});
      const capture = await client().execute(request);
      //TODO: Save the capture ID to your database.
      const captureID =
        capture.result.purchase_units[0].payments.captures[0].id;
      //TODO: Lưu lại captureId
      driverTransaction.payinTransaction.captureId = captureID;
      //TODO: Update lại trạng thái PayinTransaction và update tiền của driver
      driverTransaction.payinTransaction.status =
        EPayinTransactionStatus.SUCCESS;
      accountWallet.mainBalance += driverTransaction.amount;

      await Promise.all([
        queryRunner.manager.save(
          PayinTransaction,
          driverTransaction.payinTransaction,
        ),
        queryRunner.manager.save(AccountWallet, accountWallet),
      ]);
      console.log('BEFORE COMMIT TRANSACTION');
      await queryRunner.commitTransaction();
      console.log('AFTER COMMIT TRANSACTION');
      return {
        status: HttpStatus.OK,
        message: 'Approve deposit money into main account wallet successfully',
        mainBalance: accountWallet.mainBalance,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! Rút tiền từ ví vào tài khoản paypal của driver
  async withdrawMoneyToPaypalAccount(
    withdrawMoneyToPaypalAccountDto: WithdrawMoneyToPaypalAccountDto,
  ): Promise<ISimpleResponse> {
    const { driverId, callerId, moneyToWithdraw } =
      withdrawMoneyToPaypalAccountDto;
    let queryRunner, driverTransaction, withdrawTransaction;
    try {
      console.log(callerId, driverId);
      //TODO: Nếu như driverId !== callerId
      if (driverId !== callerId) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
        };
      }

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //TODO: Lấy AccountWallet của driver
      const driver = await queryRunner.manager
        .getRepository(Driver)
        .createQueryBuilder('driver')
        .leftJoinAndSelect('driver.wallet', 'accountWallet')
        .where('driver.id = :driverId', {
          driverId: driverId,
        })
        .getOne();

      console.log('DriverWalletMainBalance', driver.wallet.mainBalance);
      console.log('moneyToWithdraw', moneyToWithdraw);

      //TODO: Số tiền muốn rút phải nằm trong 200k và 3 củ
      if (
        moneyToWithdraw < MINIMUM_MONEY_TO_WITHDRAW_AMOUNT ||
        moneyToWithdraw > MAXIMUM_MONEY_TO_WITHDRAW_AMOUNT
      ) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Money to withdraw must >= 200000 and <=3000000',
          reason: 'UNPROCESSIBLE_MONEYTOWITHDRAW',
        };
      }
      //TODO: Tối thiểu tài khoản phải có 300k để có thể thực hiện rút tiền
      if (driver.wallet.mainBalance < MINIMUM_MAIN_ACCOUNT_AMOUNT_TO_WITHDRAW) {
        return {
          status: HttpStatus.FORBIDDEN,
          message:
            'Cannot withdraw money because main wallet does not exceed 300k',
          reason: 'MINIMUM_MAIN_ACCOUNT_AMOUNT_REQUIRED_NOT_EXCEEDED',
        };
      }

      //TODO: Nếu số tiền muốn rút vượt quá số tiền hiện có trong ví
      if (moneyToWithdraw > driver.wallet.mainBalance) {
        return {
          status: HttpStatus.FORBIDDEN,
          message:
            'Cannot withdraw money because main wallet does not have enough money',
          reason: 'INSUFFICIENT_AMOUNT_IN_MAIN_ACCOUNT',
        };
      }
      let exchangeRate;
      try {
        exchangeRate = await axios.get(
          'https://free.currconv.com/api/v7/convert?q=VND_USD&compact=ultra&apiKey=4ea1fc028af307b152e8',
        );
      } catch (error) {
        console.log('Get ExchangeRate Error -> move to fallback exchangeRate');
      }
      const rate = exchangeRate
        ? exchangeRate.data.VND_USD
        : DEFAULT_EXCHANGE_RATE;
      //TODO: Đổi tiền muốn rút từ VND sang USD
      const moneyToWithdrawUSD = parseFloat(
        (moneyToWithdraw * rate).toFixed(2),
      );
      //TODO: Tạo sender_batch_id, sender_item_id
      const sender_batch_id = uniqid('senderBatchId-');
      const sender_item_id = uniqid('senderItemId-');

      const requestBody = {
        sender_batch_header: {
          recipient_type: 'EMAIL',
          email_message:
            'You received a payment. Thanks for using our service!',
          note: 'Enjoy your Payout!!',
          sender_batch_id: sender_batch_id,
          email_subject: 'You have money!',
        },
        items: [
          {
            // note: 'ERRPYO005',
            note: 'hahaha',
            amount: {
              currency: 'USD',
              value: moneyToWithdrawUSD.toString(),
            },
            receiver: 'sb-uvrfb6253503@personal.example.com',
            sender_item_id: sender_item_id,
          },
        ],
      };
      //TODO: Tạo đối tượng DriverTransaction, WithdrawTransaction, trừ tiền trong accountWallet
      driverTransaction = new DriverTransaction();
      driverTransaction.driver = driver;
      driverTransaction.amount = moneyToWithdraw;
      driverTransaction.type = EDriverTransactionType.WITHDRAW;
      await queryRunner.manager.save(DriverTransaction, driverTransaction);
      withdrawTransaction = new WithdrawTransaction();
      withdrawTransaction.senderBatchId = sender_batch_id;
      withdrawTransaction.senderItemId = sender_item_id;
      withdrawTransaction.status = EWithdrawTransactionStatus.PROCESSING;
      withdrawTransaction.driverTransaction = driverTransaction;

      const request = new paypalPayout.payouts.PayoutsPostRequest();
      request.requestBody(requestBody);
      const response = await payoutClient().execute(request);
      console.log(`Response: ${JSON.stringify(response)}`);
      // If call returns body in response, you can get the deserialized version from the result attribute of the response.
      console.log(
        `Payouts Create Response: ${JSON.stringify(response.result)}`,
      );
      await queryRunner.manager.save(WithdrawTransaction, withdrawTransaction);
      await queryRunner.commitTransaction();
      return {
        status: HttpStatus.OK,
        message: 'Withdraw is processing, please check your paypal account!',
      };
    } catch (error) {
      if (error.statusCode) {
        //Handle server side/API failure response
        console.log('Status code: ', error.statusCode);
        // Parse failure response to get the reason for failure
        const failedError = JSON.parse(error.message);
        console.log('Failure response: ', failedError);
        console.log('Headers: ', error.headers);
        //TODO: Handle INSUFFICIENT_FUNDS
        if (failedError.name === 'INSUFFICIENT_FUNDS') {
          console.log('INSUFFICIENT_FUNDS error');
          withdrawTransaction.status = EWithdrawTransactionStatus.FAILURE;
          await queryRunner.manager.save(
            WithdrawTransaction,
            withdrawTransaction,
          );
          await queryRunner.commitTransaction();
          return {
            status: HttpStatus.FORBIDDEN,
            message: 'Partner account do not have enough funds',
            reason: 'BUSINESS_ACCOUNT_INSUFFICIENT_FUNDS',
          };
        }
      } else {
        this.logger.error(error);
        await queryRunner.rollbackTransaction();
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          reason: 'OUR_SYSTEM_BROKEN',
        };
      }
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! Sự kiện nạp rút tiền driver
  async eventPaypalOrderOccur(
    eventPaypalOrderOccurDto: EventPaypalOrderOccurDto,
  ) {
    let queryRunner;
    try {
      const { event_type, resource } = eventPaypalOrderOccurDto;
      console.log('Event_type', event_type);
      console.log('Resource', resource);

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const queryBuilder = queryRunner.manager
        .getRepository(DriverTransaction)
        .createQueryBuilder('driverTransaction')
        .leftJoinAndSelect('driverTransaction.driver', 'driver');

      let accountWallet, driverTransaction;

      switch (event_type) {
        case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
          console.log(
            'senderbatchid',
            resource.batch_header.sender_batch_header.sender_batch_id,
          );
          // TODO: Lấy thông tin driver dựa theo paypalOrderId
          driverTransaction = await queryBuilder
            .leftJoinAndSelect(
              'driverTransaction.withdrawTransaction',
              'withdrawTransaction',
            )
            .where('withdrawTransaction.senderBatchId = :senderBatchId', {
              senderBatchId:
                resource.batch_header.sender_batch_header.sender_batch_id,
            })
            .getOne();

          if (!driverTransaction) {
            console.log('Cannot found drivertransaction');
            return;
          }

          //TODO: Lấy thông tin accountWallet
          accountWallet = await queryRunner.manager
            .getRepository(AccountWallet)
            .createQueryBuilder('accountW')
            .leftJoin('accountW.driver', 'driver')
            .setLock('pessimistic_write')
            .where('driver.id = :driverId', {
              driverId: driverTransaction.driver.id,
            })
            .getOne();

          if (!accountWallet) {
            console.log('Cannot found accountWallet');
            return;
          }

          //TODO: Update lại trạng thái WithdrawTransaction và update tiền của driver
          driverTransaction.withdrawTransaction.status =
            EWithdrawTransactionStatus.SUCCESS;
          accountWallet.mainBalance -= driverTransaction.amount;
          this.notificationServiceClient.emit('mainBalanceChange', {
            driverId: driverTransaction.driver.id,
            mainBalance: accountWallet.mainBalance,
          });
          console.log('SENT NOTIFICATION');

          await Promise.all([
            queryRunner.manager.save(
              WithdrawTransaction,
              driverTransaction.withdrawTransaction,
            ),
            queryRunner.manager.save(AccountWallet, accountWallet),
          ]);
          break;
        case 'PAYMENT.PAYOUTS-ITEM.FAILED':
          console.log(
            'senderbatchid',
            resource.batch_header.sender_batch_header.sender_batch_id,
          );
          console.log('PAYMENT.PAYOUTS-ITEM.FAILED');
          // TODO: Lấy thông tin driver dựa theo paypalOrderId
          driverTransaction = await queryBuilder
            .leftJoinAndSelect(
              'driverTransaction.withdrawTransaction',
              'withdrawTransaction',
            )
            .where('withdrawTransaction.senderBatchId = :senderBatchId', {
              senderBatchId:
                resource.batch_header.sender_batch_header.sender_batch_id,
            })
            .getOne();

          if (!driverTransaction) {
            console.log('Cannot found drivertransaction');
            return;
          }

          //TODO: Update lại trạng thái WithdrawTransaction của driver
          driverTransaction.withdrawTransaction.status =
            EWithdrawTransactionStatus.FAILURE;
          this.notificationServiceClient.emit('withdrawFailed', {
            driverId: driverTransaction.driver.id,
          });
          console.log('SENT NOTIFICATION');

          await queryRunner.manager.save(
            WithdrawTransaction,
            driverTransaction.withdrawTransaction,
          );

          break;
        case 'CHECKOUT.ORDER.COMPLETED':
          // TODO: Lấy thông tin driver dựa theo paypalOrderId
          driverTransaction = await queryBuilder
            .leftJoinAndSelect(
              'driverTransaction.payinTransaction',
              'payinTransaction',
            )
            .where('payinTransaction.paypalOrderId = :paypalOrderId', {
              paypalOrderId: resource.id,
            })
            .getOne();

          if (!driverTransaction) {
            console.log('Cannot found drivertransaction');
            return;
          }

          //TODO: Lấy thông tin accountWallet
          accountWallet = await queryRunner.manager
            .getRepository(AccountWallet)
            .createQueryBuilder('accountW')
            .leftJoin('accountW.driver', 'driver')
            .setLock('pessimistic_write')
            .where('driver.id = :driverId', {
              driverId: driverTransaction.driver.id,
            })
            .getOne();

          if (!accountWallet) {
            console.log('Cannot found accountWallet');
            return;
          }

          //TODO: Update lại trạng thái PayinTransaction và update tiền của driver
          driverTransaction.payinTransaction.status =
            EPayinTransactionStatus.SUCCESS;
          accountWallet.mainBalance += driverTransaction.amount;

          await Promise.all([
            queryRunner.manager.save(
              PayinTransaction,
              driverTransaction.payinTransaction,
            ),
            queryRunner.manager.save(AccountWallet, accountWallet),
          ]);
          break;
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! Lấy danh sách lịch sử giao dịch (nạp,rút) tiền của driver
  async getListDriverTransactionHistory(
    getListDriverTransactionHistoryDto: GetListDriverTransactionHistoryDto,
  ): Promise<IDriverTransactionsResponse> {
    const {
      callerId,
      driverId,
      page = 1,
      query = 'ALL',
      transactionStatus = null,
      size = 10,
      from = null,
      to = null,
    } = getListDriverTransactionHistoryDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy thông tin driverTransaction
      let driverTransactionQueryBuilder = this.driverTransactionRepository
        .createQueryBuilder('driverTransaction')
        .leftJoin('driverTransaction.driver', 'driver')
        .leftJoinAndSelect(
          'driverTransaction.withdrawTransaction',
          'withdrawTransaction',
        )
        .leftJoinAndSelect(
          'driverTransaction.payinTransaction',
          'payinTransaction',
        )
        .skip((page - 1) * size)
        .take(size)
        .where('driver.id = :driverId', { driverId: driverId });

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

        driverTransactionQueryBuilder = driverTransactionQueryBuilder
          .andWhere('driverTransaction.createdAt >= :startDate', {
            startDate: fromDate,
          })
          .andWhere('driverTransaction.createdAt <= :endDate', {
            endDate: toDate,
          });
      }

      if (query === EDriverTransactionType.PAYIN) {
        console.log('query = PAYIN');
        driverTransactionQueryBuilder = driverTransactionQueryBuilder.andWhere(
          'driverTransaction.type = :driverTransactionType',
          {
            driverTransactionType: EDriverTransactionType.PAYIN,
          },
        );

        if (
          transactionStatus !== EGeneralTransactionStatus.ALL &&
          transactionStatus
        ) {
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'payinTransaction.status = :payinTransactionStatus',
              {
                payinTransactionStatus: transactionStatus,
              },
            );
        }
      } else if (query === EDriverTransactionType.WITHDRAW) {
        console.log('query = WITHDRAW');
        driverTransactionQueryBuilder = driverTransactionQueryBuilder.andWhere(
          'driverTransaction.type = :driverTransactionType',
          {
            driverTransactionType: EDriverTransactionType.WITHDRAW,
          },
        );

        if (
          transactionStatus !== EGeneralTransactionStatus.ALL &&
          transactionStatus
        ) {
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'withdrawTransaction.status = :withdrawTransactionStatus',
              {
                withdrawTransactionStatus: transactionStatus,
              },
            );
        }
      } else {
        console.log('query = ALL');
        console.log('TransactionStatus', transactionStatus);
        if (
          transactionStatus !== EGeneralTransactionStatus.ALL &&
          transactionStatus
        ) {
          console.log('HAVE TRANSACTION STATUS');
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'withdrawTransaction.status = :status OR payinTransaction.status = :status',
              {
                status: transactionStatus,
              },
            );
        }
      }

      const driverTransactions = await driverTransactionQueryBuilder
        .orderBy('driverTransaction.createdAt', 'DESC')
        .getMany();

      console.log('Driver transactions', driverTransactions);

      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        driverTransactions,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Lấy danh sách lịch sử giao dịch trừ cộng tiền hệ thống của driver
  async getListAccountTransactionDriver(
    getListAccountTransactionDriverDto: GetListDriverAccountTransactionDto,
  ): Promise<IAccountTransactionsReponse> {
    const {
      callerId,
      driverId,
      page = 1,
      query = 'ALL',
      size = 10,
      from = null,
      to = null,
    } = getListAccountTransactionDriverDto;

    console.log('page', page);
    console.log('size', size);
    console.log('query', query);
    console.log('from', from);
    console.log('to', to);

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy thông tin driverTransaction
      let accountTransactionQueryBuilder = this.accountTransactionRepository
        .createQueryBuilder('accountTransaction')
        .leftJoin('accountTransaction.driver', 'driver')
        .skip((page - 1) * size)
        .take(size)
        .where('driver.id = :driverId', { driverId: driverId });

      if (from && to) {
        const fromDate = momenttimezone
          .tz(from, 'Asia/Ho_Chi_Minh')
          .utc()
          .format();
        const toDate = momenttimezone.tz(to, 'Asia/Ho_Chi_Minh').utc().format();

        console.log('fromDate', fromDate);
        console.log('toDate', toDate);

        accountTransactionQueryBuilder = accountTransactionQueryBuilder
          .andWhere('accountTransaction.createdAt >= :startDate', {
            startDate: fromDate,
          })
          .andWhere('accountTransaction.createdAt <= :endDate', {
            endDate: toDate,
          });
      }

      if (query === EOperationType.SYSTEM_ADD) {
        accountTransactionQueryBuilder =
          accountTransactionQueryBuilder.andWhere(
            'accountTransaction.operationType = :accountTransactionType',
            {
              accountTransactionType: EOperationType.SYSTEM_ADD,
            },
          );
      } else if (query === EOperationType.SYSTEM_DEDUCT) {
        accountTransactionQueryBuilder =
          accountTransactionQueryBuilder.andWhere(
            'accountTransaction.operationType = :accountTransactionType',
            {
              accountTransactionType: EOperationType.SYSTEM_DEDUCT,
            },
          );
      }

      const accountTransactions = await accountTransactionQueryBuilder
        .orderBy('accountTransaction.createdAt', 'DESC')
        .getMany();

      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        accountTransactions,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Lấy thông tin balance của tài khoản chính
  async getMainAccountWalletBalance(
    getMainAccountWalletBalanceDto: GetMainAccountWalletBalanceDto,
  ): Promise<IAccountWalletResponse> {
    const { callerId, driverId } = getMainAccountWalletBalanceDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy thông tin accountWallet
      const driver = await this.driverRepository
        .createQueryBuilder('driver')
        .leftJoinAndSelect('driver.wallet', 'accountWallet')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      if (!driver) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Account wallet not found with the associated driverId',
        };
      }

      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        accountWallet: driver.wallet,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Update thông tin isActive của driver
  async updateIsActiveOfDriver(
    updateIsActiveOfDriverDto: UpdateIsActiveOfDriverDto,
  ): Promise<IIsActiveResponse> {
    const { callerId, driverId, isActive } = updateIsActiveOfDriverDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy thông tin driver
      const driver = await this.driverRepository
        .createQueryBuilder('driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      if (!driver) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Driver not found with the associated driverId',
        };
      }

      //TODO: update isActive driver
      if (isActive === EIsActive.TRUE) {
        driver.isActive = true;
      } else {
        driver.isActive = false;
      }
      await this.driverRepository.save(driver);
      return {
        status: HttpStatus.OK,
        message: 'Update isActive successfully',
        isActive: driver.isActive,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Sự kiện driver accept don
  async orderHasBeenAssignedToDriverEvent(
    orderHasBeenAssignedToDriverEventDto: OrderHasBeenAssignedToDriverEventDto,
  ) {
    let queryRunner;
    try {
      const { paymentMethod, driverId, orderSubtotal, shippingFee } =
        orderHasBeenAssignedToDriverEventDto;

      console.log('paymentMethod', paymentMethod);
      console.log('driverId', driverId);
      console.log('orderSubtotal', orderSubtotal);
      console.log('shippingFee', shippingFee);

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const accountWallet = await queryRunner.manager
        .getRepository(AccountWallet)
        .createQueryBuilder('accountW')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('accountW.driver', 'driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      if (!accountWallet) {
        console.log('Account wallet not found with that driverId');
        return;
      }

      if (
        paymentMethod === EPaymentMethod.PAYPAL ||
        paymentMethod === EPaymentMethod.ZALOPAY
      ) {
        //TODO: Trừ 20%*shippingFee + tiền hàng trong tài khoản driver
        const moneyToDeduct =
          COMMISSION_FEE_PERCENT * shippingFee + orderSubtotal;

        //TODO: Tạo đối tượng accountTransaction type = SYSTEM_DEDUCT
        const accountTransaction = this.accountTransactionRepository.create({
          amount: moneyToDeduct,
          driver: accountWallet.driver,
          operationType: EOperationType.SYSTEM_DEDUCT,
          paymentMethod: paymentMethod,
          accountBalance: accountWallet.mainBalance,
        });

        accountWallet.mainBalance -= moneyToDeduct;

        await Promise.all([
          queryRunner.manager.save(AccountWallet, accountWallet),
          queryRunner.manager.save(AccountTransaction, accountTransaction),
        ]);
      } else if (paymentMethod === EPaymentMethod.COD) {
        //TODO: Trừ 20% tiền hoa hồng trong tài khoản driver
        const moneyToDeduct = COMMISSION_FEE_PERCENT * shippingFee;

        //TODO: Tạo đối tượng accountTransaction type = SYSTEM_DEDUCT
        const accountTransaction = this.accountTransactionRepository.create({
          amount: moneyToDeduct,
          driver: accountWallet.driver,
          operationType: EOperationType.SYSTEM_DEDUCT,
          paymentMethod: paymentMethod,
          accountBalance: accountWallet.mainBalance,
        });

        accountWallet.mainBalance -= moneyToDeduct;

        await Promise.all([
          queryRunner.manager.save(AccountWallet, accountWallet),
          queryRunner.manager.save(AccountTransaction, accountTransaction),
        ]);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! Sự kiện driver hoan thanh don
  async orderHasBeenCompletedEvent(
    orderHasBeenCompletedEventDto: OrderHasBeenCompletedEventDto,
  ) {
    let queryRunner;
    try {
      const {
        deliveryDistance,
        deliveryId,
        driverId,
        orderGrandTotal,
        orderId,
        paymentMethod,
        shippingFee,
        restaurantId,
        orderSubTotal,
      } = orderHasBeenCompletedEventDto;

      console.log('deliveryDistance', deliveryDistance);
      console.log('deliveryId', deliveryId);
      console.log('driverId', driverId);
      console.log('orderGrandTotal', orderGrandTotal);
      console.log('orderId', orderId);
      console.log('paymentMethod', paymentMethod);
      console.log('shippingFee', shippingFee);
      console.log('restaurantId', restaurantId);

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const promise: (() => Promise<any>)[] = [];
      //TODO: Check trường hợp trả trước thì trả lại tiền hàng + fullship vào ví cho driver
      if (
        paymentMethod === EPaymentMethod.PAYPAL ||
        paymentMethod === EPaymentMethod.ZALOPAY
      ) {
        const moneyToAdd = orderGrandTotal;
        console.log('MoneyToAdd', moneyToAdd);
        console.log('PaymentMethod', paymentMethod);

        const accountWallet = await queryRunner.manager
          .getRepository(AccountWallet)
          .createQueryBuilder('accountW')
          .setLock('pessimistic_write')
          .leftJoinAndSelect('accountW.driver', 'driver')
          .where('driver.id = :driverId', { driverId: driverId })
          .getOne();

        //TODO: Tạo đối tượng accountTransaction type = SYSTEM_ADD
        const accountTransaction = new AccountTransaction();
        accountTransaction.amount = moneyToAdd;
        accountTransaction.driverId = driverId;
        accountTransaction.operationType = EOperationType.SYSTEM_ADD;
        accountTransaction.accountBalance = accountWallet.mainBalance;
        accountTransaction.paymentMethod = paymentMethod;

        accountWallet.mainBalance += moneyToAdd;

        //* Update accountWallet promise
        const updateAccountWalletPromise = () =>
          queryRunner.manager.save(AccountWallet, accountWallet);
        //* Create accountTransaction promise
        const createAccountTransactionPromise = () =>
          queryRunner.manager.save(AccountTransaction, accountTransaction);

        promise.push(
          updateAccountWalletPromise,
          createAccountTransactionPromise,
        );
      }

      //TODO: Tạo 2 đối tượng RestaurantTransaction ORDERSUB COMISSION_FEE
      const orderSubRestaurantTransaction =
        this.restaurantTransactionRepository.create({
          amount: orderSubTotal,
          restaurantId: restaurantId,
          type: ERestaurantTransactionType.ORDERSUB,
        });

      //* Create restaurantTransaction type = ORDERSUB promise
      const createOrderSubRestaurantTransactionPromise = () =>
        queryRunner.manager.save(
          RestaurantTransaction,
          orderSubRestaurantTransaction,
        );

      const commissionFeeRestaurantTransaction =
        this.restaurantTransactionRepository.create({
          amount: orderSubTotal * COMMISSION_FEE_PERCENT,
          restaurantId: restaurantId,
          type: ERestaurantTransactionType.COMMISSION_FEE,
        });

      //* Create restaurantTransaction type = COMMISSION_FEE promise
      const createCommissionFeeRestaurantTransactionPromise = () =>
        queryRunner.manager.save(
          RestaurantTransaction,
          commissionFeeRestaurantTransaction,
        );

      promise.push(
        createOrderSubRestaurantTransactionPromise,
        createCommissionFeeRestaurantTransactionPromise,
      );
      //TODO: Nếu là COD và PAYPAL thì tạo thêm RestaurantTransaction PAID
      if (
        paymentMethod === EPaymentMethod.COD ||
        paymentMethod == EPaymentMethod.PAYPAL
      ) {
        const paidRestaurantTransaction =
          this.restaurantTransactionRepository.create({
            amount: orderSubTotal,
            restaurantId: restaurantId,
            type: ERestaurantTransactionType.PAID,
          });
        //* Create restaurantTransaction type = PAID promise
        const createPaidRestaurantTransactionPromise = () =>
          queryRunner.manager.save(
            RestaurantTransaction,
            paidRestaurantTransaction,
          );
        promise.push(createPaidRestaurantTransactionPromise);
      }
      //TODO: Nếu là ZALOPAY và PAYPAL thì tạo thêm RestaurantTransaction DEDUCE
      if (
        paymentMethod === EPaymentMethod.ZALOPAY ||
        paymentMethod == EPaymentMethod.PAYPAL
      ) {
        const deduceRestaurantTransaction =
          this.restaurantTransactionRepository.create({
            amount: orderSubTotal * COMMISSION_FEE_PERCENT,
            restaurantId: restaurantId,
            type: ERestaurantTransactionType.DEDUCE,
          });
        //* Create restaurantTransaction type = DEDUCE promise
        const createDeduceRestaurantTransactionPromise = () =>
          queryRunner.manager.save(
            RestaurantTransaction,
            deduceRestaurantTransaction,
          );
        promise.push(createDeduceRestaurantTransactionPromise);
      }

      const deliveryHistory = this.deliveryHistoryRepository.create({
        driverId: driverId,
        orderId: orderId,
        deliveryId: deliveryId,
        shippingFee: shippingFee,
        totalDistance: deliveryDistance,
        commissionFee: shippingFee * COMMISSION_FEE_PERCENT,
        income: shippingFee * (1 - COMMISSION_FEE_PERCENT),
      });
      promise.push(queryRunner.manager.save(DeliveryHistory, deliveryHistory));
      await Promise.all(promise.map((callback) => callback()));
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  //! Api thống kê theo ngày
  async getDriverDailyStatistic(
    getDriverDailyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverDailyStatisticResponse> {
    const { callerId, driverId } = getDriverDailyStatisticDto;
    console.log('TODAY STATISTIC');
    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy ngày giờ UTC đầu tháng, cuối tháng
      const startOfDayUTC = moment()
        .startOf('day')
        .subtract(7, 'hour')
        .utc()
        .toISOString();
      const endOfDayUTC = moment()
        .endOf('day')
        .subtract(7, 'hour')
        .utc()
        .toISOString();
      console.log('HELLO');
      //TODO: Lấy thông tin deliveryHistory của driver trong tháng này
      const deliveryHistories = await this.deliveryHistoryRepository
        .createQueryBuilder('deliveryH')
        .where('deliveryH.createdAt >= :startOfDayUTC', {
          startOfDayUTC: startOfDayUTC,
        })
        .andWhere('deliveryH.createdAt <= :endOfDayUTC', {
          endOfDayUTC: endOfDayUTC,
        })
        .getMany();

      if (!deliveryHistories || deliveryHistories.length === 0) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Cannot found any statistic about this day',
        };
      }

      const date = moment().endOf('day').utc();

      const dayStatisticData: IDayStatisticData = {
        date: {
          day: date.format('D'),
          month: date.format('M'),
          year: date.format('YYYY'),
        },
        income: 0,
        commission: 0,
        numOrderFinished: 0,
      };

      for (let i = 0; i < deliveryHistories.length; i++) {
        dayStatisticData.income += deliveryHistories[i].income;
        dayStatisticData.commission += deliveryHistories[i].commissionFee;
        dayStatisticData.numOrderFinished += 1;
      }

      return {
        status: HttpStatus.OK,
        message: 'Calculate daily statistic successfully',
        statistic: dayStatisticData,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Api thống kê theo tuần
  async getDriverWeeklyStatistic(
    getDriverWeeklyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    const { callerId, driverId } = getDriverWeeklyStatisticDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy ngày giờ UTC đầu tuần, cuối tuần
      const startOfWeekUTC = moment()
        .startOf('isoWeek')
        .subtract(7, 'hour')
        .utc()
        .toISOString();
      const endOfWeekUTC = moment()
        .endOf('isoWeek')
        .subtract(7, 'hour')
        .utc()
        .toISOString();
      console.log('startOfWeekUTC', startOfWeekUTC);
      console.log('endOfWeekUTC', endOfWeekUTC);
      //TODO: Lấy thông tin deliveryHistory của driver trong tuần này
      const deliveryHistories = await this.deliveryHistoryRepository
        .createQueryBuilder('deliveryH')
        .where('deliveryH.createdAt >= :startOfWeekUTC', {
          startOfWeekUTC: startOfWeekUTC,
        })
        .andWhere('deliveryH.createdAt <= :endOfWeekUTC', {
          endOfWeekUTC: endOfWeekUTC,
        })
        .getMany();

      if (!deliveryHistories || deliveryHistories.length === 0) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Cannot found any statistic about this week',
        };
      }

      const statistic: IDayStatisticData[] = [];

      for (let i = 1; i <= 7; i++) {
        const start = moment()
          .startOf('isoWeek')
          .subtract(7, 'hour')
          .add(i - 1, 'day')
          .utc()
          .valueOf();
        const end = moment()
          .startOf('isoWeek')
          .subtract(7, 'hour')
          .add(i, 'day')
          .utc()
          .valueOf();

        console.log(
          'DAUTUAN',
          moment().startOf('isoWeek').subtract(7, 'hour').utc().toISOString(),
        );

        const filteredDeliveryHistories = deliveryHistories.filter(
          (deliveryHistory) => {
            console.log(
              'DeliveryHistoryCreatedAtStart',
              deliveryHistory.createdAt,
            );
            console.log(
              'DeliveryHistoryCreatedAtStart',
              deliveryHistory.createdAt.getTime(),
            );
            console.log(
              'Start',
              moment()
                .startOf('isoWeek')
                .subtract(7, 'hour')
                .add(i - 1, 'day')
                .utc()
                .toISOString(),
            );
            console.log('StartTime', start);
            console.log(
              'end',
              moment()
                .startOf('isoWeek')
                .subtract(7, 'hour')
                .add(i, 'day')
                .utc()
                .toISOString(),
            );
            console.log('endTime', end);

            console.log(
              'createdAt.getTime() > start',
              deliveryHistory.createdAt.getTime() > start,
            );
            console.log(
              'createdAt.getTime() < end',
              deliveryHistory.createdAt.getTime() < end,
            );
            return (
              deliveryHistory.createdAt.getTime() > start &&
              deliveryHistory.createdAt.getTime() < end
            );
          },
        );

        console.log('FilteredDeliveryHistories', filteredDeliveryHistories);
        console.log('BEFORE');
        const date = moment()
          .startOf('isoWeek')
          .add(i - 1, 'day')
          .utc();

        const dayStatisticData: IDayStatisticData = {
          date: {
            day: date.format('D'),
            month: date.format('M'),
            year: date.format('YYYY'),
          },
          income: 0,
          commission: 0,
          numOrderFinished: 0,
        };
        console.log('AFTER');
        for (let i = 0; i < filteredDeliveryHistories.length; i++) {
          console.log('FILTERED ROW', filteredDeliveryHistories[i]);
          dayStatisticData.income += filteredDeliveryHistories[i].income;
          dayStatisticData.commission +=
            filteredDeliveryHistories[i].commissionFee;
          dayStatisticData.numOrderFinished += 1;
        }
        statistic.push(dayStatisticData);
      }

      return {
        status: HttpStatus.OK,
        message: 'Calculate weekly statistic successfully',
        statistic: statistic,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Api thống kê theo tháng
  async getDriverMonthlyStatistic(
    getDriverMonthlyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    const { callerId, driverId } = getDriverMonthlyStatisticDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: Lấy ngày giờ UTC đầu tháng, cuối tháng
      const startOfMonthUTC = moment()
        .startOf('month')
        .subtract(7, 'hour')
        .utc()
        .toISOString();
      const endOfMonthUTC = moment()
        .endOf('month')
        .subtract(7, 'hour')
        .utc()
        .toISOString();

      console.log('startOfMonthUTC', startOfMonthUTC);
      console.log('endOfMonthUTC', endOfMonthUTC);
      //TODO: Lấy thông tin deliveryHistory của driver trong tháng này
      const deliveryHistories = await this.deliveryHistoryRepository
        .createQueryBuilder('deliveryH')
        .where('deliveryH.createdAt >= :startOfMonthUTC', {
          startOfMonthUTC: startOfMonthUTC,
        })
        .andWhere('deliveryH.createdAt <= :endOfMonthUTC', {
          endOfMonthUTC: endOfMonthUTC,
        })
        .getMany();

      if (!deliveryHistories || deliveryHistories.length === 0) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Cannot found any statistic about this month',
        };
      }

      const statistic: IDayStatisticData[] = [];

      const daysInMonth = moment().daysInMonth();
      console.log('daysInMonth', daysInMonth);
      for (let i = 1; i <= daysInMonth; i++) {
        const start = moment()
          .startOf('month')
          .subtract(7, 'hour')
          .add(i - 1, 'day')
          .utc()
          .valueOf();
        const end = moment()
          .startOf('month')
          .subtract(7, 'hour')
          .add(i, 'day')
          .utc()
          .valueOf();
        console.log(
          'start',
          moment()
            .startOf('month')
            .subtract(7, 'hour')
            .add(i, 'day')
            .utc()
            .toISOString(),
        );
        console.log(
          'end',
          moment()
            .startOf('month')
            .subtract(7, 'hour')
            .add(i, 'day')
            .utc()
            .toISOString(),
        );

        const filteredDeliveryHistories = deliveryHistories.filter(
          (deliveryHistory) => {
            console.log('deliveryHistory', deliveryHistory.createdAt);
            return (
              deliveryHistory.createdAt.getTime() > start &&
              deliveryHistory.createdAt.getTime() < end
            );
          },
        );

        const date = moment()
          .startOf('month')
          .subtract(7, 'hour')
          .add(i, 'day')
          .utc();

        const dayStatisticData: IDayStatisticData = {
          date: {
            day: date.format('D'),
            month: date.format('M'),
            year: date.format('YYYY'),
          },
          income: 0,
          commission: 0,
          numOrderFinished: 0,
        };

        for (let i = 0; i < filteredDeliveryHistories.length; i++) {
          dayStatisticData.income += filteredDeliveryHistories[i].income;
          dayStatisticData.commission +=
            filteredDeliveryHistories[i].commissionFee;
          dayStatisticData.numOrderFinished += 1;
        }

        statistic.push(dayStatisticData);
      }

      return {
        status: HttpStatus.OK,
        message: 'Calculate monthly statistic successfully',
        statistic: statistic,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  //! Test locking route 1
  async testUpdateAccountWallet(testUpdateAccountWalletDto) {
    const { callerId, driverId } = testUpdateAccountWalletDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }

    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      //TODO: Lấy thông tin accountWallet
      const accountWallet = await queryRunner.manager
        .getRepository(AccountWallet)
        .createQueryBuilder('accountW')
        .leftJoin('accountW.driver', 'driver')
        .setLock('pessimistic_write')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      if (!accountWallet) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Account wallet not found with the associated driverId',
        };
      }
      accountWallet.mainBalance += 5;
      await queryRunner.manager.save(AccountWallet, accountWallet);

      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        accountWallet: accountWallet,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
    // finally {
    //   if (queryRunner) {
    //     await queryRunner.release();
    //   }
    // }
  }

  //! Test locking route 2
  async testGetAccountWallet(testGetAccountWalletDto) {
    const { callerId, driverId } = testGetAccountWalletDto;

    //TODO: Nếu như driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      console.log('Getting ACCOUNTWALLET');
      //TODO: Lấy thông tin accountWallet
      const accountWallet = await queryRunner.manager
        .getRepository(AccountWallet)
        .createQueryBuilder('accountW')
        .leftJoin('accountW.driver', 'driver')
        .setLock('pessimistic_write')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      console.log('Get success');

      if (!accountWallet) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Account wallet not found with the associated driverId',
        };
      }

      accountWallet.mainBalance -= 1;
      await queryRunner.manager.save(AccountWallet, accountWallet);
      await queryRunner.commitTransaction();
      return {
        status: HttpStatus.OK,
        message: 'Successfully',
        accountWallet: accountWallet,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async updateDriverRating(driverId: string, { rating }: { rating: number }) {
    const { affected } = await this.driverRepository.update(
      { id: driverId },
      { rating: rating },
    );
    return affected > 0;
  }
}
