import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { CustomerAddress } from '../../customer/entities/customer-address.entity';

export default class CreateCustomerAddresses implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await factory(CustomerAddress)().createMany(30);
  }
}
