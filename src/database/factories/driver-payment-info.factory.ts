import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { Driver, DriverPaymentInfo } from '../../deliver/entities';
import { PaymentInfo } from '../../merchant/entities';

interface Context {
  driver: Driver;
  paymentInfo: PaymentInfo;
}

define(DriverPaymentInfo, (faker: typeof Faker, context: Context) => {
  const id = faker.random.uuid();
  const driverPaymentInfo = new DriverPaymentInfo();
  driverPaymentInfo.id = id;
  driverPaymentInfo.driver = context.driver;
  driverPaymentInfo.isDefault = true;
  driverPaymentInfo.paymentInfo = context.paymentInfo;
  return driverPaymentInfo;
});
