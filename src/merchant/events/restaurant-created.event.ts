export class RestaurantCreatedEventPayload {
  restaurantId: string;
  merchantId: string;
  data: {
    name: string;
    phone: string;
    area: string;
    address: string;
    isActive: boolean;
    isVerified: boolean;
    isBanned: boolean;
  }
}