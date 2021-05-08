import { ICustomer } from './customer.interface';

export interface ICustomerAddress {
  id: string;
  customer?: ICustomer;
  address: string;
  city: string;
  area: string;
  geom: { type: string; coordinates: number[] };
}
