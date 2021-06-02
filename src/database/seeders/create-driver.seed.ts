import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { AccountWallet, Driver } from '../../deliver/entities';

export default class CreateDriver implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const drivers = await factory(Driver)({}).createMany(10);
    const driver1 = await factory(Driver)({
      phoneNumber: '0123456789',
    }).createMany(1);
    const driver2 = await factory(Driver)({
      phoneNumber: '0987654321',
    }).createMany(1);
    const driver3 = await factory(Driver)({
      phoneNumber: '0555555555',
    }).createMany(1);
    const driver4 = await factory(Driver)({
      phoneNumber: '0768777352',
    }).createMany(1);
    const allDrivers = [...drivers, driver1, driver2, driver3, driver4];
    for (const driver of allDrivers) {
      await factory(AccountWallet)({ driver: driver }).create();
    }
  }
}
