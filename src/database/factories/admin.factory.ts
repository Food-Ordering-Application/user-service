import { define, factory } from 'typeorm-seeding';
import Faker from 'faker';
import { Admin } from '../../admin/entities/admin.entity';

define(Admin, (faker: typeof Faker) => {
  const id = faker.random.uuid();
  const name = faker.name.findName();
  const username = faker.internet.userName();
  const password =
    '$2y$12$R6ti8gZzlaogAvG5zthWs.3wOvBDNPSrYyfCM8gtOEuz/sjF7vjg6';

  const admin = new Admin();
  admin.id = id;
  admin.name = name;
  admin.username = username;
  admin.password = password;
  return admin;
});
