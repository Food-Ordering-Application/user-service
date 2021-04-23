import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { Admin } from '../../admin/entities/admin.entity';

define(Admin, (faker: typeof Faker) => {
  const id = faker.random.uuid();
  const name = faker.name.findName();
  const username = faker.internet.userName();
  const password = 'admin123';

  const admin = new Admin();
  admin.id = id;
  admin.name = name;
  admin.username = username;
  admin.password = password;
  return admin;
});
