import { define, factory } from 'typeorm-seeding';
import Faker from 'faker';
import { CustomerAddress } from '../../customer/entities/customer-address.entity';
import { Customer } from '../../customer/entities/customer.entity';

define(CustomerAddress, (faker: typeof Faker) => {
  faker.locale = 'vi';
  const id = faker.random.uuid();
  const address = faker.address.streetAddress(true);
  const city = faker.address.city();
  const area = faker.address.city();
  const latitude = faker.address.latitude();
  const longtitude = faker.address.longitude();

  const geom = {
    type: 'Point',
    coordinates: [parseFloat(longtitude), parseFloat(latitude)],
  };

  const customerAddress = new CustomerAddress();
  customerAddress.id = id;
  customerAddress.address = address;
  customerAddress.area = area;
  customerAddress.city = city;
  customerAddress.geom = geom;
  customerAddress.customer = factory(Customer)() as any;
  return customerAddress;
});
