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
  GetListDriverTransactionHistoryDto,
  GetMainAccountWalletBalanceDto,
  RegisterDriverDto,
  UpdateIsActiveOfDriverDto,
  WithdrawMoneyToPaypalAccountDto,
} from './dto';
import {
  AccountTransaction,
  AccountWallet,
  Driver,
  DriverPaymentInfo,
  DriverTransaction,
  PayinTransaction,
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
} from './enums';
import {
  IAccountWalletResponse,
  ICanDriverAcceptOrderResponse,
  IDepositMoneyIntoMainAccountWalletResponse,
  IDriverResponse,
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

const DEFAULT_EXCHANGE_RATE = 0.00004;
const COMISSION_FEE_PERCENT = 0.2;
const DEPOSIT_BALANCE_LIMIT_PERCENT = 0.5;
const MINIMUM_MAIN_ACCOUNT_AMOUNT_TO_WITHDRAW = 300000;

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
    @InjectRepository(PayinTransaction)
    private payinTransactionRepository: Repository<PayinTransaction>,
    @InjectRepository(WithdrawTransaction)
    private withdrawTransactionRepository: Repository<WithdrawTransaction>,
    @InjectRepository(AccountTransaction)
    private accountTransactionRepository: Repository<AccountTransaction>,
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
      //TODO: Lấy thông tin account balance driver
      const accountWallet = await this.accountWalletRepository
        .createQueryBuilder('accountW')
        .leftJoinAndSelect('accountW.driver', 'driver')
        .where('driver.id = :driverId', { driverId: driverId })
        .getOne();

      queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

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
            const moneyToDeduct =
              COMISSION_FEE_PERCENT * order.delivery.shippingFee;
            accountWallet.mainBalance -= moneyToDeduct;
            //TODO: Tạo đối tượng accountTransaction type = SYSTEM_DEDUCT
            const accountTransaction = new AccountTransaction();
            accountTransaction.amount = moneyToDeduct;
            accountTransaction.driver = accountWallet.driver;
            accountTransaction.operationType = EOperationType.SYSTEM_DEDUCT;
            await Promise.all([
              queryRunner.manager.save(AccountWallet, accountWallet),
              queryRunner.manager.save(AccountTransaction, accountTransaction),
            ]);
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
            const moneyToDeduct =
              COMISSION_FEE_PERCENT * order.delivery.shippingFee +
              order.subTotal;
            accountWallet.mainBalance -= moneyToDeduct;
            //TODO: Tạo đối tượng accountTransaction type = SYSTEM_DEDUCT
            const accountTransaction = new AccountTransaction();
            accountTransaction.amount = moneyToDeduct;
            accountTransaction.driver = accountWallet.driver;
            accountTransaction.operationType = EOperationType.SYSTEM_DEDUCT;
            await Promise.all([
              queryRunner.manager.save(AccountWallet, accountWallet),
              queryRunner.manager.save(AccountTransaction, accountTransaction),
            ]);
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
      await queryRunner.release();
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

      const exchangeRate = await axios.get(
        'https://free.currconv.com/api/v7/convert?q=VND_USD&compact=ultra&apiKey=4ea1fc028af307b152e8',
      );
      const rate = exchangeRate.data.VND_USD || DEFAULT_EXCHANGE_RATE;
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
      await queryRunner.release();
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

      //TODO: Lấy DriverTransaction và PayinTransaction của driver
      const driverTransaction = await this.driverTransactionRepository
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
        .getOne();

      if (!driverTransaction) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'DriverTransaction not found',
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
      //TODO: Đổi trạng thái payinTransaction sang đang xử lý
      driverTransaction.payinTransaction.status =
        EPayinTransactionStatus.PROCESSING;
      // //TODO: Update lại trạng thái PayinTransaction và update tiền của driver
      // driverTransaction.payinTransaction.status =
      //   EPayinTransactionStatus.SUCCESS;
      // driverTransaction.driver.wallet.mainBalance += driverTransaction.amount;
      // queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.save(
        PayinTransaction,
        driverTransaction.payinTransaction,
      );
      await queryRunner.commitTransaction();
      return {
        status: HttpStatus.OK,
        message: 'Approve deposit money into main account wallet successfully',
        // mainBalance: driverTransaction.driver.wallet.mainBalance,
      };
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  //! Rút tiền từ ví vào tài khoản paypal của driver
  async withdrawMoneyToPaypalAccount(
    withdrawMoneyToPaypalAccountDto: WithdrawMoneyToPaypalAccountDto,
  ): Promise<ISimpleResponse> {
    const { driverId, callerId, moneyToWithdraw } =
      withdrawMoneyToPaypalAccountDto;
    let queryRunner;
    try {
      console.log(callerId, driverId);
      //TODO: Nếu như driverId !== callerId
      if (driverId !== callerId) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
        };
      }
      //TODO: Lấy AccountWallet của driver
      const driver = await this.driverRepository
        .createQueryBuilder('driver')
        .leftJoinAndSelect('driver.wallet', 'accountWallet')
        .where('driver.id = :driverId', {
          driverId: driverId,
        })
        .getOne();

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

      const exchangeRate = await axios.get(
        'https://free.currconv.com/api/v7/convert?q=VND_USD&compact=ultra&apiKey=4ea1fc028af307b152e8',
      );
      const rate = exchangeRate.data.VND_USD || DEFAULT_EXCHANGE_RATE;
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
            note: 'Your Payout!',
            amount: {
              currency: 'USD',
              value: moneyToWithdrawUSD.toString(),
            },
            receiver: 'sb-uvrfb6253503@personal.example.com',
            sender_item_id: sender_item_id,
          },
        ],
      };

      // Construct a request object and set desired parameters
      // Here, PayoutsPostRequest() creates a POST request to /v1/payments/payouts
      const request = new paypalPayout.payouts.PayoutsPostRequest();
      request.requestBody(requestBody);
      try {
        const response = await payoutClient().execute(request);
        queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(
          `Payouts Create Response: ${JSON.stringify(response.result)}`,
        );
        //TODO: Tạo đối tượng DriverTransaction, WithdrawTransaction, trừ tiền trong accountWallet
        const driverTransaction = new DriverTransaction();
        driverTransaction.driver = driver;
        driverTransaction.amount = moneyToWithdraw;
        driverTransaction.type = EDriverTransactionType.WITHDRAW;
        await queryRunner.manager.save(DriverTransaction, driverTransaction);
        const withdrawTransaction = new WithdrawTransaction();
        withdrawTransaction.senderBatchId = sender_batch_id;
        withdrawTransaction.senderItemId = sender_item_id;
        withdrawTransaction.status = EWithdrawTransactionStatus.PROCESSING;
        withdrawTransaction.driverTransaction = driverTransaction;
        driver.wallet.mainBalance -= moneyToWithdraw;
        await Promise.all([
          queryRunner.manager.save(WithdrawTransaction, withdrawTransaction),
          queryRunner.manager.save(AccountWallet, driver.wallet),
        ]);
        await queryRunner.commitTransaction();
        return {
          status: HttpStatus.OK,
          message: 'Withdraw successfully, please check your paypal account!',
        };
      } catch (e) {
        await queryRunner.rollbackTransaction();
        if (e.statusCode) {
          //Handle server side/API failure response
          console.log('Status code: ', e.statusCode);
          // Parse failure response to get the reason for failure
          const error = JSON.parse(e.message);
          console.log('Failure response: ', error);
          console.log('Headers: ', e.headers);
        } else {
          //Hanlde client side failure
          console.log(e);
        }
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Withdraw failed',
          reason: 'PAYPAL_BROKEN',
        };
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        reason: 'OUR_SYSTEM_BROKEN',
      };
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

      const queryBuilder = this.driverTransactionRepository
        .createQueryBuilder('driverTransaction')
        .leftJoinAndSelect('driverTransaction.driver', 'driver')
        .leftJoinAndSelect('driver.wallet', 'accountWallet');
      switch (event_type) {
        case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
          console.log(
            'senderbatchid',
            resource.batch_header.sender_batch_header.sender_batch_id,
          );
          // TODO: Lấy thông tin driver dựa theo paypalOrderId
          const driverTransaction1 = await queryBuilder
            .leftJoinAndSelect(
              'driverTransaction.withdrawTransaction',
              'withdrawTransaction',
            )
            .where('withdrawTransaction.senderBatchId = :senderBatchId', {
              senderBatchId:
                resource.batch_header.sender_batch_header.sender_batch_id,
            })
            .getOne();

          if (!driverTransaction1) {
            console.log('Cannot found drivertransaction');
            return;
          }
          //TODO: Update lại trạng thái WithdrawTransaction và update tiền của driver
          driverTransaction1.withdrawTransaction.status =
            EWithdrawTransactionStatus.SUCCESS;
          driverTransaction1.driver.wallet.mainBalance -=
            driverTransaction1.amount;

          this.notificationServiceClient.emit('mainBalanceChange', {
            driverId: driverTransaction1.driver.id,
            mainBalance: driverTransaction1.driver.wallet.mainBalance,
          });

          await Promise.all([
            queryRunner.manager.save(
              WithdrawTransaction,
              driverTransaction1.withdrawTransaction,
            ),
            queryRunner.manager.save(
              AccountWallet,
              driverTransaction1.driver.wallet,
            ),
          ]);
          break;
        case 'CHECKOUT.ORDER.COMPLETED':
          // TODO: Lấy thông tin driver dựa theo paypalOrderId
          const driverTransaction = await queryBuilder
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

          //TODO: Update lại trạng thái PayinTransaction và update tiền của driver
          driverTransaction.payinTransaction.status =
            EPayinTransactionStatus.SUCCESS;
          driverTransaction.driver.wallet.mainBalance +=
            driverTransaction.amount;

          await Promise.all([
            queryRunner.manager.save(
              PayinTransaction,
              driverTransaction.payinTransaction,
            ),
            queryRunner.manager.save(
              AccountWallet,
              driverTransaction.driver.wallet,
            ),
          ]);
          break;
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
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

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        driverTransactionQueryBuilder = driverTransactionQueryBuilder
          .andWhere('driverTransaction.createdAt >= :startDate', {
            startDate: fromDate.toISOString(),
          })
          .andWhere('driverTransaction.createdAt <= :endDate', {
            endDate: toDate.toISOString(),
          });
      }

      if (query === EDriverTransactionType.PAYIN) {
        driverTransactionQueryBuilder = driverTransactionQueryBuilder.andWhere(
          'driverTransaction.type = :driverTransactionType',
          {
            driverTransactionType: EDriverTransactionType.PAYIN,
          },
        );

        if (transactionStatus !== EGeneralTransactionStatus.ALL) {
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'payinTransaction.status = :payinTransactionStatus',
              {
                payinTransactionStatus: transactionStatus,
              },
            );
        }
      } else if (query === EDriverTransactionType.WITHDRAW) {
        driverTransactionQueryBuilder = driverTransactionQueryBuilder.andWhere(
          'driverTransaction.type = :driverTransactionType',
          {
            driverTransactionType: EDriverTransactionType.WITHDRAW,
          },
        );

        if (transactionStatus !== EGeneralTransactionStatus.ALL) {
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'withdrawTransaction.status = :withdrawTransactionStatus',
              {
                withdrawTransactionStatus: transactionStatus,
              },
            );
        }
      } else {
        if (transactionStatus !== EGeneralTransactionStatus.ALL) {
          driverTransactionQueryBuilder =
            driverTransactionQueryBuilder.andWhere(
              'withdrawTransaction.status = :status OR payinTransaction.status = :status',
              {
                status: transactionStatus,
              },
            );
        }
      }

      const driverTransactions = await driverTransactionQueryBuilder.getMany();

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
}
