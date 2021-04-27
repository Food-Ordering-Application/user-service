import { PartialType } from '@nestjs/mapped-types';
import { StaffDataDto } from './staff-data.dto';

export class UpdateStaffDto {
  staffId: string;
  merchantId: string;
  restaurantId: string;
  data: UpdatedStaffDataDto;
}

export class UpdatedStaffDataDto {
  firstName: string;
  lastName: string;
  phone: string;
  IDNumber: string;
  dateOfBirth: Date;
}