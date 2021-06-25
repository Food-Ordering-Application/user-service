import { FeedbackReason } from '../../feedback/entities';
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface JSONModel {
  id: number;
  type: number;
  content: string;
  display_order: number;
  rate: number;
}
const converter = (data: JSONModel): Partial<FeedbackReason> => {
  const { id, type, content, display_order, rate } = data;
  return {
    id,
    type,
    content,
    displayOrder: display_order,
    rate,
  };
};

export class seedFeedbackReasons1624623766916 implements MigrationInterface {
  name = 'seedFeedbackReasons1624623766916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connect();
    const seedJsonFileName = 'now_feedback_reasons.json';
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
            this.createNewFeedbackReason(queryRunner, item),
          ),
        )),
      ];
      position += batchSize;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`truncate table "feedback_reason"`);
  }

  async createNewFeedbackReason(
    queryRunner: QueryRunner,
    payload: Partial<FeedbackReason>,
  ) {
    const feedbackReason = queryRunner.manager.create(FeedbackReason, payload);
    return queryRunner.manager.save(FeedbackReason, feedbackReason);
  }
}
