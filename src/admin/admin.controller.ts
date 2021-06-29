import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
import { GetListDriverDto } from './dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { IDriversResponse } from './interfaces';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern('getAuthenticatedAdmin')
  getAuthenticatedAdmin(@Payload() loginAdminDto: LoginAdminDto) {
    const { username, password } = loginAdminDto;
    return this.adminService.getAuthenticatedAdmin(username, password);
  }

  //! Lấy danh sách tài xế
  @MessagePattern('getListDriver')
  async getListDriver(
    @Payload()
    getListDriverDto: GetListDriverDto,
  ): Promise<IDriversResponse> {
    return this.adminService.getListDriver(getListDriverDto);
  }
}
