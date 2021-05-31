import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliverService } from './deliver.service';
import { RegisterDriverDto } from './dto';
import { CheckDriverAccountBalanceDto } from './dto/check-driver-account-balance.dto';
import { ICanDriverAcceptOrderResponse, IDriverResponse } from './interfaces';

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
  // @MessagePattern('getDriverInformation')
  // async getDriverInformation(
  //   @Payload()
  //   getDriverInformationDto: GetDriverInformationDto,
  // ): Promise<IGetDriverInformationResponse> {
  //   return this.deliverService.getDriverInformation(getDriverInformationDto);
  // }
}
