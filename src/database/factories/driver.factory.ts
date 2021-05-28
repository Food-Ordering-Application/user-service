import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { Driver } from '../../deliver/entities';

interface Context {
  phoneNumber?: string;
}

define(Driver, (faker: typeof Faker, context: Context) => {
  const id = faker.random.uuid();
  console.log(context);
  let phoneNumber;
  if (context) {
    phoneNumber = context.phoneNumber;
  }
  let driverPhonenumber = faker.phone.phoneNumber('0#########');
  if (phoneNumber) {
    driverPhonenumber = phoneNumber;
  }
  const password = 'Hiendeptrai1234';
  const email = 'thachdau16t@gmail.com';
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  const driver = new Driver();
  driver.id = id;
  driver.name = `${firstName} ${lastName}`;
  driver.phoneNumber = driverPhonenumber;
  driver.password = password;
  driver.email = email;
  driver.city = faker.address.city();
  driver.isVerified = true;
  driver.isBanned = false;
  return driver;
});
