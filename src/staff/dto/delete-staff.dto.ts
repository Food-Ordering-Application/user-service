import { PartialType } from '@nestjs/mapped-types';
import { StaffDataDto } from './staff-data.dto';

export class DeleteStaffDto {
  staffId: string;
  merchantId: string;
  restaurantId: string;
}