import { Payment } from '../entities';
export class PaymentDto {
  paypal: {
    isOnboard: boolean;
  };
  static EntityToDto(payment: Payment): PaymentDto {
    const { paypal } = payment;
    const { isOnboard } = paypal;
    return {
      paypal: {
        isOnboard,
      },
    };
  }
}
