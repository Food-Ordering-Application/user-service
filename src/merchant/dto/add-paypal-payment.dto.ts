export class AddPaypalPaymentDto {
  merchantId: string;
  restaurantId: string;
  data: {
    merchantIdInPayPal: string;
  };
}
