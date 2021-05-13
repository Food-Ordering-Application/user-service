import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validateHashedPassword } from '../shared/helper';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { AdminDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
  ) {}

  async getAuthenticatedAdmin(username: string, password: string) {
    const admin = await this.adminsRepository.findOne({
      username,
    });
    if (!admin) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Admin's username does not exist",
        user: null,
      };
    }
    const isMatch = await validateHashedPassword(password, admin.password);
    if (!isMatch)
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: "Admin's password does not correct",
        user: null,
      };
    return {
      status: HttpStatus.OK,
      message: 'Admin information is verified',
      user: AdminDto.EntityToDTO(admin),
    };
  }
}
