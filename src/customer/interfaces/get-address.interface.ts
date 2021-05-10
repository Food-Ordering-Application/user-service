import { IAddressData } from './index';

export interface IGetAddressResponse {
  status: number;
  message: string;
  data: IAddressData | null;
  // errors: { [key: string]: any };
}
