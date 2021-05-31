import { IPayment } from './payment.interface';

export interface IPaypalPayment {
  id: string;
  captureId: string;
  paypalOrderId: string;
  createdAt: Date;
  updatedAt: Date;
  payment: IPayment;
}
