import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Controller()
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @MessagePattern('createMerchant')
  create(@Payload() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @MessagePattern('findAllMerchant')
  findAll() {
    return this.merchantService.findAll();
  }

  @MessagePattern('findOneMerchant')
  findOne(@Payload() id: number) {
    return this.merchantService.findOne(id);
  }

  @MessagePattern('updateMerchant')
  update(@Payload() updateMerchantDto: UpdateMerchantDto) {
    return this.merchantService.update(updateMerchantDto.id, updateMerchantDto);
  }

  @MessagePattern('removeMerchant')
  remove(@Payload() id: number) {
    return this.merchantService.remove(id);
  }
}
