import { PaymentInfo } from '../entities';
export class PaymentDto {
  paypal: {
    isOnboard: boolean;
  };
  static EntityToDto(payment: PaymentInfo): PaymentDto {
    const { paypal } = payment;
    const { isOnboard } = paypal;
    return {
      paypal: {
        isOnboard,
      },
    };
  }
}
