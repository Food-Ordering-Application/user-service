import { PayPalOnboardStatus } from '../enums/paypal-onboard-status';

export interface IGetPayPalOnboardStatusResponse {
  status: number;
  message: string;
  data: {
    isOnboard: boolean;
    message: PayPalOnboardStatus;
  };
}
