import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern('createAdmin')
  create(@Payload() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @MessagePattern('findAllAdmin')
  findAll() {
    return this.adminService.findAll();
  }

  @MessagePattern('findOneAdmin')
  findOne(@Payload() id: number) {
    return this.adminService.findOne(id);
  }

  @MessagePattern('updateAdmin')
  update(@Payload() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(updateAdminDto.id, updateAdminDto);
  }

  @MessagePattern('removeAdmin')
  remove(@Payload() id: number) {
    return this.adminService.remove(id);
  }
}
