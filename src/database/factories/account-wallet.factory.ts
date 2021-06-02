import { define } from 'typeorm-seeding';
import Faker from 'faker';
import { AccountWallet, Driver } from '../../deliver/entities';

interface Context {
  driver: Driver;
}

define(AccountWallet, (faker: typeof Faker, context: Context) => {
  const id = faker.random.uuid();
  const accountWallet = new AccountWallet();
  accountWallet.id = id;
  accountWallet.driver = context.driver;
  accountWallet.depositBalance = 2000000;
  accountWallet.mainBalance = 500000;
  return accountWallet;
});
