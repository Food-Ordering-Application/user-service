import { Customer } from '../entities/customer.entity';

export interface IUserCreateResponse {
  status: number;
  message: string;
  user: Customer | null;
  errors: { [key: string]: any };
}
