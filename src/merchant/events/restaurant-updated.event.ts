export class RestaurantUpdatedEventPayload {
  restaurantId: string;
  merchantId: string;
  data: {
    name: string;
    phone: string;
    coverImageUrl: string;
    verifiedImageUrl: string;
    videoUrl: string;
    address: string;
    isActive: boolean;
  };
}
