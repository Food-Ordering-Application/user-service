import { IDelivery } from './delivery.interface';
import { IOrderItem } from './index';
import { IInvoice } from './invoice.interface';
export interface IOrder {
  id: string;
  cashierId?: string;
  restaurantId?: string;
  subTotal?: number;
  grandTotal?: number;
  itemDiscount?: number;
  promoId?: string;
  discount?: number;
  status?: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
  orderItems: IOrderItem[];
  delivery: IDelivery;
  invoice: IInvoice;
}
