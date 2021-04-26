import { StaffDto } from './../dto/staff.dto';

export interface IStaffServiceFetchStaffResponse {
  status: number;
  message: string;
  data: {
    results: StaffDto[],
    total: number,
    size: number,
  };
}
