import { ICustomer } from './customer.interface';

// }
export interface ICustomerResponse {
  status: number;
  message: string;
  user: ICustomer | null;
}
