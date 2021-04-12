import { Customer } from '../../customer/entities/customer.entity';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

export default class CreateCustomers implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await factory(Customer)().createMany(50);
  }
}
