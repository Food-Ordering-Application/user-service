export class OrderHasBeenCompletedEventDto {
  paymentMethod: string;
  orderSubTotal: number;
  orderGrandTotal: number;
  driverId: string;
  orderId: string;
  deliveryId: string;
  shippingFee: number;
  deliveryDistance: number;
  restaurantId: string;
}
