import { IOrder } from './order.interface';
import { IPayment } from './payment.interface';

export interface IInvoice {
  id: string;
  status: string;
  paypalInvoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  createdAt: Date;
  updatedAt: Date;
  order: IOrder;
  payment: IPayment;
}
