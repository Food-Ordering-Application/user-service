import { Driver } from '../../deliver/entities';
import { IDriver } from '../../deliver/interfaces';

export interface IDriversResponse {
  status: number;
  message: string;
  drivers?: IDriver[] | Driver[] | null;
  total?: number;
}
