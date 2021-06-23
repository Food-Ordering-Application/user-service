import { ICustomerAddress } from './customer-address.interface';

export interface ICustomerAddressResponse {
  status: number;
  message: string;
  address?: ICustomerAddress | null;
  // errors: { [key: string]: any };
}
