import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ISimpleResponse } from '../customer/interfaces';
import { DeliverService } from './deliver.service';
import {
  ApproveDepositMoneyIntoMainAccountWalletDto,
  DepositMoneyIntoMainAccountWalletDto,
  GetDriverInformationDto,
  RegisterDriverDto,
  WithdrawMoneyToPaypalAccountDto,
} from './dto';
import { CheckDriverAccountBalanceDto } from './dto/check-driver-account-balance.dto';
import {
  ICanDriverAcceptOrderResponse,
  IDepositMoneyIntoMainAccountWalletResponse,
  IDriverResponse,
  IGetDriverInformationResponse,
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
  ): Promise<ISimpleResponse> {
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
}
