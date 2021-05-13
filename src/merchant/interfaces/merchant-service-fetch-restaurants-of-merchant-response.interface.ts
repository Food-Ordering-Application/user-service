import { RestaurantProfileDto } from './../dto/restaurant-profile.dto';
export interface IMerchantServiceFetchRestaurantsOfMerchantResponse {
  status: number;
  message: string;
  data: {
    results: RestaurantProfileDto[];
    total: number;
    size: number;
  };
}
