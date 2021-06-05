import { DriverTransaction } from '../entities';
import { IDriverTransaction } from './driver-transaction.interface';

export interface IDriverTransactionsResponse {
  status: number;
  message: string;
  driverTransactions?: IDriverTransaction[] | null | DriverTransaction[];
}
