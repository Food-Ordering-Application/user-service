import { PaymentDto } from './../dto';
export interface IMerchantServiceFetchPaymentOfRestaurantResponse {
  status: number;
  message: string;
  data: {
    payment: PaymentDto;
  };
}
