import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateStaffDto } from './dto/create-staff.dto';
import { DeleteStaffDto } from './dto/delete-staff.dto';
import { FetchStaffDto } from './dto/fetch-staff.dto';
import { LoginStaffDto } from './dto/login-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { IStaffServiceCreateStaffResponse } from './interfaces/staff-service-create-staff-response.interface';
import { IStaffServiceFetchStaffResponse } from './interfaces/staff-service-fetch-staff-response.interface';
import { IStaffServiceLoginPosResponse } from './interfaces/staff-service-login-pos-response.interface';
import { IStaffServiceResponse } from './interfaces/staff-service-response.interface';
import { StaffService } from './staff.service';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @MessagePattern('createStaff')
  async create(
    @Payload() createStaffDto: CreateStaffDto,
  ): Promise<IStaffServiceCreateStaffResponse> {
    return await this.staffService.create(createStaffDto);
  }

  @MessagePattern('fetchStaff')
  async findAll(
    @Payload() fetchStaffDto: FetchStaffDto,
  ): Promise<IStaffServiceFetchStaffResponse> {
    return await this.staffService.findAll(fetchStaffDto);
  }

  @MessagePattern('getAuthenticatedStaff')
  getAuthenticatedStaff(
    @Payload() loginStaffDto: LoginStaffDto,
  ): Promise<IStaffServiceLoginPosResponse> {
    const { username, password, restaurantId } = loginStaffDto;
    return this.staffService.getAuthenticatedStaff(
      username,
      password,
      restaurantId,
    );
  }

  @MessagePattern('findOneStaff')
  async findOne(@Payload() id: number): Promise<IStaffServiceResponse> {
    return await this.staffService.findOne(id);
  }

  @MessagePattern('updateStaff')
  async update(
    @Payload() updateStaffDto: UpdateStaffDto,
  ): Promise<IStaffServiceResponse> {
    return await this.staffService.update(updateStaffDto);
  }

  @MessagePattern('deleteStaff')
  async delete(
    @Payload() deleteStaffDto: DeleteStaffDto,
  ): Promise<IStaffServiceResponse> {
    return await this.staffService.delete(deleteStaffDto);
  }
}
