import { IDriver } from './driver.interface';

export interface IDriverResponse {
  status: number;
  message: string;
  user: IDriver | null;
}
