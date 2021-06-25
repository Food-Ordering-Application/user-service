export class RatingRestaurantDto {
  customerId: string;
  orderId: string;
  reasonIds: number[];
  rate: number;
  message: string;
}
