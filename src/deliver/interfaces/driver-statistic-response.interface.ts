import { IDayStatisticData } from './day-statistic-data.interface';

export interface IDriverStatisticResponse {
  status: number;
  message: string;
  statistic?: IDayStatisticData[];
}
