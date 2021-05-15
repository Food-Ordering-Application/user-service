import { Admin } from '../entities/admin.entity';

export class AdminDto {
  id: string;
  username: string;
  name: string;
  static EntityToDTO(admin: Admin): AdminDto {
    const { id, username, name } = admin;
    return {
      id,
      username,
      name,
    };
  }
}
