import { Injectable } from '@nestjs/common';
import { CreateDeliverDto } from './dto/create-deliver.dto';
import { UpdateDeliverDto } from './dto/update-deliver.dto';

@Injectable()
export class DeliverService {
  create(createDeliverDto: CreateDeliverDto) {
    return 'This action adds a new deliver';
  }

  findAll() {
    return `This action returns all deliver`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deliver`;
  }

  update(id: number, updateDeliverDto: UpdateDeliverDto) {
    return `This action updates a #${id} deliver`;
  }

  remove(id: number) {
    return `This action removes a #${id} deliver`;
  }
}
