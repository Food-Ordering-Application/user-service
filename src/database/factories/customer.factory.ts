import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { Customer } from '../../customer/entities/customer.entity';

define(Customer, (faker: typeof Faker) => {
  faker.locale = 'vi';
  const id = faker.random.uuid();
  const password =
    '$2b$12$NxX9mMH8gU7nXqMMNP01SOUYq610ggc9S8XM0cvbM6GUHRykHhX0G';
  const phoneNumber = faker.phone.phoneNumber('0#########');
  const avatar = faker.image.avatar();
  const gender = 'Male';
  const email = faker.internet.email();
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  const customer = new Customer();
  customer.id = id;
  customer.name = `${firstName} ${lastName}`;
  customer.password = password;
  customer.email = email;
  customer.phoneNumber = phoneNumber;
  customer.avatar = avatar;
  customer.gender = gender;
  customer.isPhoneNumberVerified = true;
  return customer;
});
