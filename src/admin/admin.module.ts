import { Admin } from './entities/admin.entity';
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../deliver/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Driver])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
