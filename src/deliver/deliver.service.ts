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

  //! Ti??m ki????m driver b????ng s???? ??i????n thoa??i
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

  //! ????ng ky?? driver
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
      //TODO: Check n???u ???? c?? driver v???i s??t ???? r
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

      //TODO: Ta??o ba??ng AccountWallet
      const accountWallet = new AccountWallet();
      accountWallet.mainBalance = 0;
      accountWallet.depositBalance = 2000000;
      //TODO: Ta??o ba??ng paypalPayment
      const paypalPayment = new PayPalPayment();
      paypalPayment.merchantIdInPayPal = merchantIdInPaypal;
      await Promise.all([
        queryRunner.manager.save(AccountWallet, accountWallet),
        queryRunner.manager.save(PayPalPayment, paypalPayment),
      ]);

      //TODO: Ta??o ba??ng Driver
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
      //TODO: Ta??o ba??ng PaymentInfo
      const paymentInfo = new PaymentInfo();
      paymentInfo.paypal = paypalPayment;
      await Promise.all([
        queryRunner.manager.save(PaymentInfo, paymentInfo),
        queryRunner.manager.save(Driver, driver),
      ]);

      //TODO: Ta??o ba??ng DriverPaymentInfo
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

  //! Ki????m tra balance cu??a driver xem co?? ??u?? ??i????u ki????n accept ????n ko
  async checkDriverAccountBalance(
    checkDriverAccountBalanceDto: CheckDriverAccountBalanceDto,
  ): Promise<ICanDriverAcceptOrderResponse> {
    const { order, driverId } = checkDriverAccountBalanceDto;
    let queryRunner;
    try {
      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //TODO: L????y th??ng tin account balance driver
      const accountWallet = await queryRunner.manager
        .getRepository(AccountWallet)
        .createQueryBuilder('accountW')
        .leftJoinAndSelect('accountW.driver', 'driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      switch (order.invoice.payment.method) {
        //TODO: Tr??????ng h????p COD (Tra?? sau)
        case EPaymentMethod.COD:
          //TODO: Check xem trong vi?? (ta??i khoa??n chi??nh - 20%*shippingFee).abs() > 50% * ta??i khoa??n ky?? quy??
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
        //TODO: Tr??????ng h????p Paypal || ZALOPAY (Tra?? tr??????c)
        case EPaymentMethod.PAYPAL:
        case EPaymentMethod.ZALOPAY:
          //TODO: Check xem trong vi?? (ta??i khoa??n chi??nh - 20%*shippingFee - ti????n ha??ng).abs()
          //TODO: > 50% * ta??i khoa??n ky?? quy??
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

  //! L????y s??t, t??n, a??nh khu??n m????t, bi????n s???? cu??a driver
  async getDriverInformation(
    getDriverInformationDto: GetDriverInformationDto,
  ): Promise<IGetDriverInformationResponse> {
    const { driverId } = getDriverInformationDto;
    try {
      //TODO: L????y th??ng tin driver v????i driverId
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

  //! CreateOrder Na??p ti????n va??o ta??i khoa??n chi??nh driver
  async depositMoneyIntoMainAccountWallet(
    depositMoneyIntoMainAccountWalletDto: DepositMoneyIntoMainAccountWalletDto,
  ): Promise<IDepositMoneyIntoMainAccountWalletResponse> {
    const { callerId, moneyToDeposit, driverId } =
      depositMoneyIntoMainAccountWalletDto;

    //TODO: N????u nh?? driverId !== callerId
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
      //TODO: L????y th??ng tin driver
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
      //TODO: ??????i ti????n mu????n chuy????n t???? VND sang USD
      const moneyToDepositUSD = parseFloat((moneyToDeposit * rate).toFixed(2));

      //TODO: Go??i api paypal ta??o order
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
      //TODO: Ta??o ??????i t??????ng driverTransaction, payinTransaction
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

  //! ApproveOrder Na??p ti????n va??o ta??i khoa??n chi??nh driver
  async approveDepositMoneyIntoMainAccountWallet(
    approveDepositMoneyIntoMainAccountWalletDto: ApproveDepositMoneyIntoMainAccountWalletDto,
  ): Promise<IMainBalanceResponse> {
    let queryRunner;
    try {
      const { paypalOrderId, callerId, driverId } =
        approveDepositMoneyIntoMainAccountWalletDto;

      //TODO: N????u nh?? driverId !== callerId
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
      //TODO: L????y DriverTransaction v?? PayinTransaction cu??a driver
      //TODO: L???y th??ng tin accountWallet c???a driver
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
      //TODO: L??u la??i captureId
      driverTransaction.payinTransaction.captureId = captureID;
      //TODO: Update l???i tr???ng th??i PayinTransaction v?? update ti???n c???a driver
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

  //! Ru??t ti????n t???? vi?? va??o ta??i khoa??n paypal cu??a driver
  async withdrawMoneyToPaypalAccount(
    withdrawMoneyToPaypalAccountDto: WithdrawMoneyToPaypalAccountDto,
  ): Promise<ISimpleResponse> {
    const { driverId, callerId, moneyToWithdraw } =
      withdrawMoneyToPaypalAccountDto;
    let queryRunner, driverTransaction, withdrawTransaction;
    try {
      console.log(callerId, driverId);
      //TODO: N????u nh?? driverId !== callerId
      if (driverId !== callerId) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
        };
      }

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //TODO: L????y AccountWallet cu??a driver
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

      //TODO: S??? ti???n mu???n r??t ph???i n???m trong 200k v?? 3 c???
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
      //TODO: T????i thi????u ta??i khoa??n pha??i co?? 300k ?????? co?? th???? th????c hi????n ru??t ti????n
      if (driver.wallet.mainBalance < MINIMUM_MAIN_ACCOUNT_AMOUNT_TO_WITHDRAW) {
        return {
          status: HttpStatus.FORBIDDEN,
          message:
            'Cannot withdraw money because main wallet does not exceed 300k',
          reason: 'MINIMUM_MAIN_ACCOUNT_AMOUNT_REQUIRED_NOT_EXCEEDED',
        };
      }

      //TODO: N????u s???? ti????n mu????n ru??t v??????t qua?? s???? ti????n hi????n co?? trong vi??
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
      //TODO: ??????i ti????n mu????n ru??t t???? VND sang USD
      const moneyToWithdrawUSD = parseFloat(
        (moneyToWithdraw * rate).toFixed(2),
      );
      //TODO: Ta??o sender_batch_id, sender_item_id
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
      //TODO: T???o ?????i t?????ng DriverTransaction, WithdrawTransaction, tr??? ti???n trong accountWallet
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

  //! S??? ki???n n???p r??t ti???n driver
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
          // TODO: L???y th??ng tin driver d???a theo paypalOrderId
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

          //TODO: L???y th??ng tin accountWallet
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

          //TODO: Update l???i tr???ng th??i WithdrawTransaction v?? update ti???n c???a driver
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
          // TODO: L???y th??ng tin driver d???a theo paypalOrderId
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

          //TODO: Update l???i tr???ng th??i WithdrawTransaction c???a driver
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
          // TODO: L???y th??ng tin driver d???a theo paypalOrderId
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

          //TODO: L???y th??ng tin accountWallet
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

          //TODO: Update l???i tr???ng th??i PayinTransaction v?? update ti???n c???a driver
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

  //! L???y danh s??ch l???ch s??? giao d???ch (n???p,r??t) ti???n c???a driver
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

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L????y th??ng tin driverTransaction
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

  //! L???y danh s??ch l???ch s??? giao d???ch tr??? c???ng ti???n h??? th???ng c???a driver
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

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L????y th??ng tin driverTransaction
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

  //! L???y th??ng tin balance c???a t??i kho???n ch??nh
  async getMainAccountWalletBalance(
    getMainAccountWalletBalanceDto: GetMainAccountWalletBalanceDto,
  ): Promise<IAccountWalletResponse> {
    const { callerId, driverId } = getMainAccountWalletBalanceDto;

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L????y th??ng tin accountWallet
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

  //! Update th??ng tin isActive c???a driver
  async updateIsActiveOfDriver(
    updateIsActiveOfDriverDto: UpdateIsActiveOfDriverDto,
  ): Promise<IIsActiveResponse> {
    const { callerId, driverId, isActive } = updateIsActiveOfDriverDto;

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L????y th??ng tin driver
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

  //! S??? ki???n driver accept don
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
        //TODO: Tr???? 20%*shippingFee + ti????n ha??ng trong ta??i khoa??n driver
        const moneyToDeduct =
          COMMISSION_FEE_PERCENT * shippingFee + orderSubtotal;

        //TODO: T???o ?????i t?????ng accountTransaction type = SYSTEM_DEDUCT
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
        //TODO: Tr???? 20% ti????n hoa h????ng trong ta??i khoa??n driver
        const moneyToDeduct = COMMISSION_FEE_PERCENT * shippingFee;

        //TODO: T???o ?????i t?????ng accountTransaction type = SYSTEM_DEDUCT
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

  //! S??? ki???n driver hoan thanh don
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
      //TODO: Check tr?????ng h???p tr??? tr?????c th?? tr??? l???i ti???n h??ng + fullship v??o v?? cho driver
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

        //TODO: T???o ?????i t?????ng accountTransaction type = SYSTEM_ADD
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

      //TODO: T???o 2 ?????i t?????ng RestaurantTransaction ORDERSUB COMISSION_FEE
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
      //TODO: N???u l?? COD v?? PAYPAL th?? t???o th??m RestaurantTransaction PAID
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
      //TODO: N???u l?? ZALOPAY v?? PAYPAL th?? t???o th??m RestaurantTransaction DEDUCE
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

  //! Api th???ng k?? theo ng??y
  async getDriverDailyStatistic(
    getDriverDailyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverDailyStatisticResponse> {
    const { callerId, driverId } = getDriverDailyStatisticDto;
    console.log('TODAY STATISTIC');
    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L???y ng??y gi??? UTC ?????u th??ng, cu???i th??ng
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
      //TODO: L???y th??ng tin deliveryHistory c???a driver trong th??ng n??y
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

  //! Api th???ng k?? theo tu???n
  async getDriverWeeklyStatistic(
    getDriverWeeklyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    const { callerId, driverId } = getDriverWeeklyStatisticDto;

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L???y ng??y gi??? UTC ?????u tu???n, cu???i tu???n
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
      //TODO: L???y th??ng tin deliveryHistory c???a driver trong tu???n n??y
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

  //! Api th???ng k?? theo th??ng
  async getDriverMonthlyStatistic(
    getDriverMonthlyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    const { callerId, driverId } = getDriverMonthlyStatisticDto;

    //TODO: N????u nh?? driverId !== callerId
    if (driverId !== callerId) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      };
    }
    try {
      //TODO: L???y ng??y gi??? UTC ?????u th??ng, cu???i th??ng
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
      //TODO: L???y th??ng tin deliveryHistory c???a driver trong th??ng n??y
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

    //TODO: N????u nh?? driverId !== callerId
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
      //TODO: L????y th??ng tin accountWallet
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

    //TODO: N????u nh?? driverId !== callerId
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
      //TODO: L????y th??ng tin accountWallet
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
