import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @MessagePattern('createStaff')
  async create(@Payload() createStaffDto: CreateStaffDto): Promise<IStaffServiceResponse> {
    return await this.staffService.create(createStaffDto);
  }

  @MessagePattern('findAllStaff')
  async findAll(): Promise<IStaffServiceResponse> {
    return await this.staffService.findAll();
  }

  @MessagePattern('findOneStaff')
  async findOne(@Payload() id: number): Promise<IStaffServiceResponse> {
    return await this.staffService.findOne(id);
  }

  @MessagePattern('updateStaff')
  async update(@Payload() updateStaffDto: UpdateStaffDto): Promise<IStaffServiceResponse> {
    return await this.staffService.update(updateStaffDto.id, updateStaffDto);
  }

  @MessagePattern('removeStaff')
  async remove(@Payload() id: number): Promise<IStaffServiceResponse> {
    return await this.staffService.remove(id);
  }
}
