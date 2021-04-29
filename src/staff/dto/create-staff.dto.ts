import { StaffDataDto } from './staff-data.dto';

export class CreateStaffDto {
  merchantId: string;
  restaurantId: string;
  data: StaffDataDto;
}
