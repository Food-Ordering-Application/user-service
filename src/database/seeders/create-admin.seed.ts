import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { Admin } from '../../admin/entities/admin.entity';

export default class CreateAdmin implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await factory(Admin)().createMany(5);
  }
}
