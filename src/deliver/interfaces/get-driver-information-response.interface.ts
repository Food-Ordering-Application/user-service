import { Driver } from '../entities';
import { IGetDriverInformationData } from './get-driver-information-data.interface';

export interface IGetDriverInformationResponse {
  status: number;
  message: string;
  driverInfo: IGetDriverInformationData | Driver | null;
}
