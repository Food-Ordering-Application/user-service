import { IDriver } from './driver.interface';

export interface IAccountTransaction {
  id: string;
  amount: number;
  accountBalance: number;
  operationType: string;
  createdAt: Date;
  driver: IDriver;
}
