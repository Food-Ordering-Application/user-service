import { define, factory } from 'typeorm-seeding';
import Faker from 'faker';
import { CustomerAddress } from '../../customer/entities/customer-address.entity';
import { Customer } from '../../customer/entities/customer.entity';

define(CustomerAddress, (faker: typeof Faker) => {
  const id = faker.random.uuid();
  const address = faker.address.streetAddress(true);
  const latitude = faker.address.latitude();
  const longtitude = faker.address.longitude();

  const customerAddress = new CustomerAddress();
  customerAddress.id = id;
  customerAddress.address = address;
  customerAddress.latitude = latitude;
  customerAddress.longtitude = longtitude;
  customerAddress.customer = factory(Customer)() as any;
  return customerAddress;
});
