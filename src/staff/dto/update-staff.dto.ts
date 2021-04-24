import { StaffDataDto } from './staff-data.dto';
import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(StaffDataDto) {
  id: number;
}
