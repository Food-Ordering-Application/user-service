import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeliverService } from './deliver.service';
import { CreateDeliverDto } from './dto/create-deliver.dto';
import { UpdateDeliverDto } from './dto/update-deliver.dto';

@Controller()
export class DeliverController {
  constructor(private readonly deliverService: DeliverService) {}

  @MessagePattern('createDeliver')
  create(@Payload() createDeliverDto: CreateDeliverDto) {
    return this.deliverService.create(createDeliverDto);
  }

  @MessagePattern('findAllDeliver')
  findAll() {
    return this.deliverService.findAll();
  }

  @MessagePattern('findOneDeliver')
  findOne(@Payload() id: number) {
    return this.deliverService.findOne(id);
  }

  @MessagePattern('updateDeliver')
  update(@Payload() updateDeliverDto: UpdateDeliverDto) {
    return this.deliverService.update(updateDeliverDto.id, updateDeliverDto);
  }

  @MessagePattern('removeDeliver')
  remove(@Payload() id: number) {
    return this.deliverService.remove(id);
  }
}
