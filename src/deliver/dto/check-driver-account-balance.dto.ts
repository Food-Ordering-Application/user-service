import { IOrder } from '../interfaces';

export class CheckDriverAccountBalanceDto {
  order: IOrder;
  driverId: string;
}
