import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliverService } from './deliver.service';
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
}
