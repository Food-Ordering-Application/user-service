import { IDriverTransaction } from './driver-transaction.interface';

export interface IPayinTransaction {
  id: string;
  status: string;
  captureId: string;
  paypalOrderId: string;
  createdAt: Date;
  updatedAt: Date;
  driverTransaction: IDriverTransaction;
}
