import { StaffDto } from './../dto/staff.dto';
export interface IStaffServiceCreateStaffResponse {
  status: number;
  message: string;
  data: {
    staff: StaffDto;
  }
}
