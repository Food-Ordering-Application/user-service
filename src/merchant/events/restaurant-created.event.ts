export class RestaurantCreatedEventPayload {
  restaurantId: string;
  merchantId: string;
  data: {
    name: string;
    phone: string;
    areaId: number;
    cityId: number;
    address: string;
    coverImageUrl: string;
    isActive: boolean;
    isVerified: boolean;
    isBanned: boolean;
  };
}
