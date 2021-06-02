import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { PayPalPayment } from '../../merchant/entities';

interface Context {
  merchantIdInPaypal: string;
  email: string;
}

define(PayPalPayment, (faker: typeof Faker, context: Context) => {
  const id = faker.random.uuid();
  const paypalPayment = new PayPalPayment();
  paypalPayment.id = id;
  paypalPayment.merchantIdInPayPal = context.merchantIdInPaypal;
  paypalPayment.email = context.email;
  return paypalPayment;
});
