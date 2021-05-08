import { ICustomerAddress } from './customer-address.interface';

export interface ICustomerAddressesResponse {
  status: number;
  message: string;
  addresses: ICustomerAddress[] | null;
  // errors: { [key: string]: any };
}
