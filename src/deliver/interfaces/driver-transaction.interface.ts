import { IDriver } from './driver.interface';
import { IPayinTransaction } from './payin-transaction.interface';
import { IWithdrawTransaction } from './withdraw-transaction.interface';

export interface IDriverTransaction {
  id: string;
  type: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  driver: IDriver;
  withdrawTransaction: IWithdrawTransaction;
  payinTransaction: IPayinTransaction;
}
