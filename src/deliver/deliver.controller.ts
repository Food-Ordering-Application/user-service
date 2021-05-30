import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliverService } from './deliver.service';
import { RegisterDriverDto } from './dto';
import { IDriverResponse } from './interfaces';

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
}
