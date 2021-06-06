import { AccountWallet } from '../entities';
import { IAccountWallet } from './account-wallet.interface';

export interface IAccountWalletResponse {
  status: number;
  message: string;
  accountWallet?: IAccountWallet | null | AccountWallet;
}
