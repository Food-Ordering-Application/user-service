export class RestaurantCreatedEventPayload {
  restaurantId: string;
  merchantId: string;
  data: {
    name: string;
    phone: string;
    area: string;
    city: string;
    address: string;
    coverImageUrl: string;
    isActive: boolean;
    isVerified: boolean;
    isBanned: boolean;
  };
}
