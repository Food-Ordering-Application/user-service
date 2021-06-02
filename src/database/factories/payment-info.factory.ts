import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { PaymentInfo, PayPalPayment } from '../../merchant/entities';

interface Context {
  paypalPayment: PayPalPayment;
}

define(PaymentInfo, (faker: typeof Faker, context: Context) => {
  const id = faker.random.uuid();
  const paymentInfo = new PaymentInfo();
  paymentInfo.id = id;
  paymentInfo.paypal = context.paypalPayment;
  return paymentInfo;
});
