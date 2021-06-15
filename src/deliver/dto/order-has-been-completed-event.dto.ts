export class OrderHasBeenCompletedEventDto {
  paymentMethod: string;
  orderGrandTotal: number;
  driverId: string;
  orderId: string;
  deliveryId: string;
  shippingFee: number;
  deliveryDistance: number;
}
