import { Merchant } from '../entities/merchant.entity';

export class MerchantDto {
  id: string;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  IDNumber: string;
  static EntityToDTO(merchant: Merchant): MerchantDto {
    const { id, username, email, phone, fullName, IDNumber } = merchant;
    return {
      id,
      username,
      email,
      phone,
      fullName,
      IDNumber,
    };
  }
}
