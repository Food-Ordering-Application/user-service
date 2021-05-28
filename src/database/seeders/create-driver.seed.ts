import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { Driver } from '../../deliver/entities';

export default class CreateDriver implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await factory(Driver)({}).createMany(10);
    await factory(Driver)({ phoneNumber: '0123456789' }).createMany(1);
    await factory(Driver)({ phoneNumber: '0987654321' }).createMany(1);
    await factory(Driver)({ phoneNumber: '0555555555' }).createMany(1);
    await factory(Driver)({ phoneNumber: '0768777352' }).createMany(1);
  }
}
