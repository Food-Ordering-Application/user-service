export class RestaurantProfileUpdatedEventPayload {
  restaurantId: string;
  data: {
    isVerified?: boolean,
    isActive?: boolean,
    isBanned?: boolean
  }
}