import { MerchantDto } from './dto/merchant.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';
import { MerchantService } from './merchant.service';

@Controller()
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) { }

  @MessagePattern('createMerchant')
  create(@Payload() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @MessagePattern('getAuthenticatedMerchant')
  getAuthenticatedMerchant(@Payload() loginMerchantDto: LoginMerchantDto) {
    const { username, password } = loginMerchantDto;
    return this.merchantService.getAuthenticatedMerchant(username, password);
  }

  // Lay thong tin merchant theo id
  @MessagePattern('findMerchantById')
  findMerchant(@Payload() id: string) {
    return this.merchantService.findMerchantById(id);
  }
}
