import { Merchant } from '../entities/merchant.entity';
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
    };
  }
}
