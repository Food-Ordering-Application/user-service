import { IDate } from './date.interface';

export interface IDayStatisticData {
  date: IDate;
  income: number;
  commission: number;
  numOrderFinished: number;
}
