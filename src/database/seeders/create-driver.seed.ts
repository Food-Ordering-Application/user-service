import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import {
  AccountWallet,
  Driver,
  DriverPaymentInfo,
} from '../../deliver/entities';
import { PaymentInfo, PayPalPayment } from '../../merchant/entities';

export default class CreateDriver implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const drivers = await factory(Driver)({}).createMany(3);
    const driver1 = await factory(Driver)({
      phoneNumber: '0123456789',
    }).create();
    const driver2 = await factory(Driver)({
      phoneNumber: '0987654321',
    }).create();
    const driver3 = await factory(Driver)({
      phoneNumber: '0555555555',
    }).create();
    const driver4 = await factory(Driver)({
      phoneNumber: '0768777352',
    }).create();
    const allDrivers = [...drivers, driver1, driver2, driver3, driver4];
    for (const driver of allDrivers) {
      //TODO: Tạo accountWallet cho driver
      await factory(AccountWallet)({ driver: driver }).create();
      //TODO: Tạo DriverPaymentInfo, PaypalPayment cho driver
      const paypalPayment = await factory(PayPalPayment)({
        merchantIdInPaypal: 'SPD7RF7BHCG4J',
        email: 'sb-uvrfb6253503@personal.example.com',
      }).create();
      const paymentInfo = await factory(PaymentInfo)({
        paypalPayment: paypalPayment,
      }).create();
      const driverPaymentInfo = await factory(DriverPaymentInfo)({
        paymentInfo: paymentInfo,
        driver: driver,
      }).create();
    }
  }
}
