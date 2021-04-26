import { Entity } from "typeorm";
import { Staff } from "../entities/staff.entity";
@Entity()
export class StaffDto {
  id: string;
  merchantId: string;;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  IDNumber: string;
  dateOfBirth: Date;
  static EntityToDTO(staff: Staff): StaffDto {
    const { id, merchantId, username, firstName, lastName, phone, IDNumber, dateOfBirth } = staff;
    return {
      id,
      merchantId,
      username,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      phone,
      IDNumber,
      dateOfBirth
    };
  }
}
