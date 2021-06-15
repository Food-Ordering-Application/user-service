import { IDayStatisticData } from './day-statistic-data.interface';

export interface IDriverDailyStatisticResponse {
  status: number;
  message: string;
  statistic?: IDayStatisticData;
}
