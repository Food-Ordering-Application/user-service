import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @MessagePattern('createStaff')
  create(@Payload() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @MessagePattern('findAllStaff')
  findAll() {
    return this.staffService.findAll();
  }

  @MessagePattern('findOneStaff')
  findOne(@Payload() id: number) {
    return this.staffService.findOne(id);
  }

  @MessagePattern('updateStaff')
  update(@Payload() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(updateStaffDto.id, updateStaffDto);
  }

  @MessagePattern('removeStaff')
  remove(@Payload() id: number) {
    return this.staffService.remove(id);
  }
}
