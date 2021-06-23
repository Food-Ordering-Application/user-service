import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  PaymentInfo,
  PayPalPayment,
  RestaurantProfile,
} from '../../merchant/entities';
import { RestaurantCreatedEventPayload } from '../../merchant/events/restaurant-created.event';

const MERCHANT_ID = '5baf057d-0314-4a63-b08e-2cecb8a55bd2';
interface JSONModel {
  id: string;
  name: string;
  phone: string;
  coverImageUrl: string;
  cityId: number;
  areaId: number;
  isBanned: boolean;
  isActive: boolean;
  isVerified: boolean;
  address: string;
}
const converter = (a: JSONModel): RestaurantCreatedEventPayload => {
  const merchantId = '5baf057d-0314-4a63-b08e-2cecb8a55bd2';
  const {
    id,
    name,
    phone,
    coverImageUrl,
    cityId,
    areaId,
    isActive,
    isBanned,
    isVerified,
    address,
  } = a;
  return {
    merchantId,
    restaurantId: id,
    data: {
      name,
      phone,
      coverImageUrl,
      cityId,
      areaId,
      isActive,
      isBanned,
      isVerified,
      address,
    },
  };
};

export class fix1723764755527 implements MigrationInterface {
  name = 'fix1723764755527'; // tmp name, need to delete after run migration

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connect();
    const seedJsonFileName = 'fix_restaurant.json';
    const _path = `./${seedJsonFileName}`;
    const absolutePath = path.resolve(__dirname, _path);
    const response: JSONModel[] = JSON.parse(
      fs.readFileSync(absolutePath, 'utf8'),
    );
    const test = response.map(converter);

    let position = 0;
    const batchSize = 10;
    let results = [];
    while (position < test.length) {
      const itemsForBatch = test.slice(position, position + batchSize);
      results = [
        ...results,
        ...(await Promise.all(
          itemsForBatch.map((item) =>
            this.createNewRestaurantProfile(queryRunner, item),
          ),
        )),
      ];
      position += batchSize;
    }

    // await queryRunner.release();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    return;
  }
  createNewPayment(queryRunner: QueryRunner) {
    return queryRunner.manager.create(PaymentInfo, {
      paypal: queryRunner.manager.create(PayPalPayment),
    });
  }

  async createNewRestaurantProfile(
    queryRunner: QueryRunner,
    payload: RestaurantCreatedEventPayload,
  ) {
    const { restaurantId, merchantId, data } = payload;
    const {
      name,
      phone,
      areaId,
      cityId,
      coverImageUrl,
      address,
      isActive,
      isBanned,
      isVerified,
    } = data;
    const restaurantProfile = queryRunner.manager.create(RestaurantProfile, {
      restaurantId,
      merchantId,
      name,
      phone,
      areaId,
      cityId,
      image: coverImageUrl,
      address,
      isActive,
      isBanned,
      isVerified,
    });

    restaurantProfile.paymentInfo = this.createNewPayment(queryRunner);
    return queryRunner.manager.save(RestaurantProfile, restaurantProfile);
  }
}
