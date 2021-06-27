import { MerchantDto } from './merchant.dto';
import { RestaurantProfile } from '../entities/restaurant-profile.entity';

export class RestaurantProfileDto {
  restaurantId: string;
  posAppKey: string;
  name: string;
  phone: string;
  area: string;
  city: string;
  cityId: number;
  areaId: number;
  image: string;
  address: string;
  contractId: number;
  isActive: boolean;
  isVerified: boolean;
  hasDevice: boolean;
  merchant: MerchantDto;
  static EntityToDTO(restaurant: RestaurantProfile): RestaurantProfileDto {
    const {
      restaurantId,
      posAppKey,
      name,
      phone,
      image,
      area,
      areaId,
      city,
      cityId,
      address,
      contractId,
      isActive,
      isVerified,
      deviceId,
      merchant,
    } = restaurant;
    return {
      restaurantId,
      posAppKey,
      name,
      phone,
      image,
      area,
      areaId,
      city,
      cityId,
      address,
      contractId,
      isActive,
      isVerified,
      hasDevice: deviceId == null ? false : true,
      merchant: MerchantDto.EntityToDTO(merchant),
    };
  }
}
