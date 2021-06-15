import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ISimpleResponse } from '../customer/interfaces';
import { DeliverService } from './deliver.service';
import {
  ApproveDepositMoneyIntoMainAccountWalletDto,
  DepositMoneyIntoMainAccountWalletDto,
  EventPaypalOrderOccurDto,
  GetDriverInformationDto,
  GetDriverStatisticDto,
  GetListDriverTransactionHistoryDto,
  GetMainAccountWalletBalanceDto,
  OrderHasBeenAssignedToDriverEventDto,
  OrderHasBeenCompletedEventDto,
  RegisterDriverDto,
  UpdateIsActiveOfDriverDto,
  WithdrawMoneyToPaypalAccountDto,
} from './dto';
import { CheckDriverAccountBalanceDto } from './dto/check-driver-account-balance.dto';
import {
  IAccountWalletResponse,
  ICanDriverAcceptOrderResponse,
  IDepositMoneyIntoMainAccountWalletResponse,
  IDriverResponse,
  IDriverStatisticResponse,
  IDriverTransactionsResponse,
  IGetDriverInformationResponse,
  IIsActiveResponse,
  IMainBalanceResponse,
} from './interfaces';

@Controller()
export class DeliverController {
  constructor(private readonly deliverService: DeliverService) {}

  //! Tìm kiếm driver bằng số điện thoại
  @MessagePattern('findDriverByPhonenumber')
  findDriverByPhonenumber(
    @Payload() phoneNumber: string,
  ): Promise<IDriverResponse> {
    return this.deliverService.findDriverByPhonenumber(phoneNumber);
  }

  //! Đăng ký driver
  @MessagePattern('registerDriver')
  registerDriver(
    @Payload() registerDriverDto: RegisterDriverDto,
  ): Promise<IDriverResponse> {
    return this.deliverService.registerDriver(registerDriverDto);
  }

  //! Kiểm tra balance của driver xem có đủ điều kiện accept đơn ko
  @MessagePattern('checkDriverAccountBalance')
  async checkDriverAccountBalance(
    @Payload()
    checkDriverAccountBalanceDto: CheckDriverAccountBalanceDto,
  ): Promise<ICanDriverAcceptOrderResponse> {
    return this.deliverService.checkDriverAccountBalance(
      checkDriverAccountBalanceDto,
    );
  }

  //! Lấy sđt, tên, ảnh khuôn mặt, biển số của driver
  @MessagePattern('getDriverInformation')
  async getDriverInformation(
    @Payload()
    getDriverInformationDto: GetDriverInformationDto,
  ): Promise<IGetDriverInformationResponse> {
    return this.deliverService.getDriverInformation(getDriverInformationDto);
  }

  //! CreateOrder Nạp tiền vào tài khoản chính driver
  @MessagePattern('depositMoneyIntoMainAccountWallet')
  async depositMoneyIntoMainAccountWallet(
    @Payload()
    depositMoneyIntoMainAccountWalletDto: DepositMoneyIntoMainAccountWalletDto,
  ): Promise<IDepositMoneyIntoMainAccountWalletResponse> {
    return this.deliverService.depositMoneyIntoMainAccountWallet(
      depositMoneyIntoMainAccountWalletDto,
    );
  }

  //! ApproveOrder Nạp tiền vào tài khoản chính driver
  @MessagePattern('approveDepositMoneyIntoMainAccountWallet')
  async approveDepositMoneyIntoMainAccountWallet(
    @Payload()
    approveDepositMoneyIntoMainAccountWalletDto: ApproveDepositMoneyIntoMainAccountWalletDto,
  ): Promise<IMainBalanceResponse> {
    return this.deliverService.approveDepositMoneyIntoMainAccountWallet(
      approveDepositMoneyIntoMainAccountWalletDto,
    );
  }

  //! Rút tiền từ ví vào tài khoản paypal của driver
  @MessagePattern('withdrawMoneyToPaypalAccount')
  async withdrawMoneyToPaypalAccount(
    @Payload()
    withdrawMoneyToPaypalAccountDto: WithdrawMoneyToPaypalAccountDto,
  ): Promise<ISimpleResponse> {
    return this.deliverService.withdrawMoneyToPaypalAccount(
      withdrawMoneyToPaypalAccountDto,
    );
  }

  //! Sự kiện nạp, rút tiền driver
  @EventPattern('eventPaypalOrderOccur')
  async eventPaypalOrderOccur(
    @Payload()
    eventPaypalOrderOccurDto: EventPaypalOrderOccurDto,
  ) {
    this.deliverService.eventPaypalOrderOccur(eventPaypalOrderOccurDto);
  }

  //! Lấy danh sách lịch sử giao dịch (nạp,rút) tiền của driver
  @MessagePattern('getListDriverTransactionHistory')
  async getListDriverTransactionHistory(
    @Payload()
    getListDriverTransactionHistoryDto: GetListDriverTransactionHistoryDto,
  ): Promise<IDriverTransactionsResponse> {
    return this.deliverService.getListDriverTransactionHistory(
      getListDriverTransactionHistoryDto,
    );
  }

  //! Lấy thông tin balance của tài khoản chính
  @MessagePattern('getMainAccountWalletBalance')
  async getMainAccountWalletBalance(
    @Payload()
    getMainAccountWalletBalanceDto: GetMainAccountWalletBalanceDto,
  ): Promise<IAccountWalletResponse> {
    return this.deliverService.getMainAccountWalletBalance(
      getMainAccountWalletBalanceDto,
    );
  }

  //! Update thông tin isActive của driver
  @MessagePattern('updateIsActiveOfDriver')
  async updateIsActiveOfDriver(
    @Payload()
    updateIsActiveOfDriverDto: UpdateIsActiveOfDriverDto,
  ): Promise<IIsActiveResponse> {
    return this.deliverService.updateIsActiveOfDriver(
      updateIsActiveOfDriverDto,
    );
  }

  //! Sự kiện driver accept don
  @EventPattern('orderHasBeenAssignedToDriverEvent')
  async orderHasBeenAssignedToDriverEvent(
    @Payload()
    orderHasBeenAssignedToDriverEventDto: OrderHasBeenAssignedToDriverEventDto,
  ) {
    console.log('orderHasBeenAssignedToDriverEvent');
    this.deliverService.orderHasBeenAssignedToDriverEvent(
      orderHasBeenAssignedToDriverEventDto,
    );
  }

  //! Sự kiện driver hoàn thành đơn
  @EventPattern('orderHasBeenCompletedEvent')
  async orderHasBeenCompletedEvent(
    @Payload()
    orderHasBeenCompletedEventDto: OrderHasBeenCompletedEventDto,
  ) {
    console.log('orderHasBeenCompletedEvent');
    this.deliverService.orderHasBeenCompletedEvent(
      orderHasBeenCompletedEventDto,
    );
  }

  //! Api thống kê theo tuần
  @MessagePattern('getDriverWeeklyStatistic')
  async getDriverWeeklyStatistic(
    @Payload()
    getDriverWeeklyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    return this.deliverService.getDriverWeeklyStatistic(
      getDriverWeeklyStatisticDto,
    );
  }

  //! Api thống kê theo tháng
  @MessagePattern('getDriverMonthlyStatistic')
  async getDriverMonthlyStatistic(
    @Payload()
    getDriverMonthlyStatisticDto: GetDriverStatisticDto,
  ): Promise<IDriverStatisticResponse> {
    return this.deliverService.getDriverMonthlyStatistic(
      getDriverMonthlyStatisticDto,
    );
  }

  //! Test locking route 1
  @MessagePattern('testUpdateAccountWallet')
  async testUpdateAccountWallet(
    @Payload()
    testUpdateAccountWalletDto,
  ) {
    return this.deliverService.testUpdateAccountWallet(
      testUpdateAccountWalletDto,
    );
  }
  //! Test locking route 2
  @MessagePattern('testGetAccountWallet')
  async testGetAccountWallet(
    @Payload()
    testGetAccountWalletDto,
  ) {
    return this.deliverService.testGetAccountWallet(testGetAccountWalletDto);
  }
}
