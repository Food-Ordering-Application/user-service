import { AccountTransaction } from '../entities';
import { IAccountTransaction } from './account-transaction.interface';

export interface IAccountTransactionsReponse {
  status: number;
  message: string;
  accountTransactions?: IAccountTransaction[] | AccountTransaction[];
}
