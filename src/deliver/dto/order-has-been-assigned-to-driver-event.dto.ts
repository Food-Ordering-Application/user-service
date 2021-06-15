import { IOrder } from '../interfaces';

export class OrderHasBeenAssignedToDriverEventDto {
  driverId: string;
  paymentMethod: string;
  shippingFee: number;
  orderSubtotal: number;
}
