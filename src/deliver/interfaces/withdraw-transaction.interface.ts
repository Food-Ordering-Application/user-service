import { IDriverTransaction } from './driver-transaction.interface';

export interface IWithdrawTransaction {
  id: string;
  status: string;
  senderBatchId: string;
  senderItemId: string;
  createdAt: Date;
  updatedAt: Date;
  driverTransaction: IDriverTransaction;
}
