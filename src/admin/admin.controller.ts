import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @MessagePattern('getAuthenticatedAdmin')
  getAuthenticatedAdmin(@Payload() loginAdminDto: LoginAdminDto) {
    const { username, password } = loginAdminDto;
    return this.adminService.getAuthenticatedAdmin(username, password);
  }

}
