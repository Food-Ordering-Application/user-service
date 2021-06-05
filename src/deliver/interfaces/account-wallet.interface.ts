import { IDriver } from './driver.interface';

export interface IAccountWallet {
  id: string;
  mainBalance: number;
  depositBalance: number;
  driver: IDriver;
}
