import { IStaffServiceFetchStaffResponse } from './interfaces/staff-service-fetch-staff-response.interface';
import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { FetchStaffDto } from './dto/fetch-staff.dto';
import { IStaffServiceCreateStaffResponse } from './interfaces/staff-service-create-staff-response.interface';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @MessagePattern('createStaff')
  async create(@Payload() createStaffDto: CreateStaffDto): Promise<IStaffServiceCreateStaffResponse> {
    return await this.staffService.create(createStaffDto);
  }

  @MessagePattern('fetchStaff')
  async findAll(@Payload() fetchStaffDto: FetchStaffDto): Promise<IStaffServiceFetchStaffResponse> {
    return await this.staffService.findAll(fetchStaffDto);
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
