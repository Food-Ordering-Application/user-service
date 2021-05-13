import { Entity } from 'typeorm';
import { Staff } from '../entities/staff.entity';
@Entity()
export class StaffDto {
  id: string;
  merchantId: string;
  restaurantId: string;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  IDNumber: string;
  dateOfBirth: Date;
  static EntityToDTO(staff: Staff): StaffDto {
    const {
      id,
      merchantId,
      username,
      restaurantId,
      firstName,
      lastName,
      phone,
      IDNumber,
      dateOfBirth,
    } = staff;
    return {
      id,
      merchantId,
      restaurantId,
      username,
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      phone,
      IDNumber,
      dateOfBirth,
    };
  }
}
