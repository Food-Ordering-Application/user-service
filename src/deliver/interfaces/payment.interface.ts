import { IInvoice } from './invoice.interface';
import { IPaypalPayment } from './paypal-payment.interface';

export interface IPayment {
  id: string;
  method: string;
  status: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  invoice: IInvoice;
  paypalPayment: IPaypalPayment;
}
