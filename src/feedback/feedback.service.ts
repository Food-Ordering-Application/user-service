import { RestaurantFeedbackDto } from './dto/restaurant-feedback.dto';
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ORDER_SERVICE, RESTAURANT_SERVICE } from 'src/constants';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  GetFeedbackOfOrdersDto,
  RatingDriverDto,
  RatingRestaurantDto,
} from './dto';
import { DriverFeedback } from './entities/driver-feedback.entity';
import { FeedbackReason } from './entities/feedback-reason.entity';
import { RestaurantFeedback } from './entities/restaurant-feedback.entity';
import { FeedbackType } from './enums';
import {
  IRatingRestaurantResponse,
  IOrderServiceGetRateInfosResponse,
  IGetFeedbackOfOrders,
  IRatingDriverResponse,
} from './interfaces';
import { DeliverService } from 'src/deliver/deliver.service';

const PG_UNIQUE_CONSTRAINT_VIOLATION = '23505';
const PG_FOREIGN_KEY_CONSTRAINT_VIOLATION = '23503';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(ORDER_SERVICE)
    private orderServiceClient: ClientProxy,

    @Inject(RESTAURANT_SERVICE)
    private restaurantServiceClient: ClientProxy,

    @InjectRepository(FeedbackReason)
    private feedbackReasonRepository: Repository<FeedbackReason>,

    @InjectRepository(DriverFeedback)
    private driverFeedbackRepository: Repository<DriverFeedback>,

    @InjectRepository(RestaurantFeedback)
    private restaurantFeedbackRepository: Repository<RestaurantFeedback>,

    private driverService: DeliverService,
  ) {}

  private readonly logger = new Logger('FeedbackService');

  async ratingRestaurant(
    RatingRestaurantDto: RatingRestaurantDto,
  ): Promise<IRatingRestaurantResponse> {
    try {
      const {
        customerId,
        rate,
        reasonIds = [],
        orderId,
        message,
      } = RatingRestaurantDto;
      const hasReasons = reasonIds.length > 0;

      if (hasReasons) {
        // check reasonIds
        const validIdCount = await this.feedbackReasonRepository.count({
          where: {
            id: In(reasonIds),
            type: FeedbackType.Restaurant,
            rate,
          },
        });

        if (validIdCount < reasonIds.length) {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'One of reason ids is not valid. Please check again',
          };
        }
      }

      // get restaurantId, deliveryTime of order by OrderId
      const response: IOrderServiceGetRateInfosResponse =
        await this.orderServiceClient
          .send('getOrderRatingInfos', { orderId, customerId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  new RequestTimeoutException(
                    'Timeout. Maybe server has problem!',
                  ),
                );
              }
              return throwError({ message: err });
            }),
          )
          .toPromise();

      const { data, message: serviceResponse, status } = response;
      if (status != HttpStatus.OK) {
        throw new Error(serviceResponse);
      }
      const { restaurantId, deliveredAt } = data;

      const EXPIRED_TIME = 60 * 1000 * 60 * 24 * 3;
      const expiredRateRequest =
        Date.now() - EXPIRED_TIME > new Date(deliveredAt).getTime();

      if (expiredRateRequest) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `You can only rate an order within ${
            EXPIRED_TIME / (60 * 1000 * 60)
          } hours`,
        };
      }

      const reasonEntities = reasonIds.map((id) =>
        this.feedbackReasonRepository.create({ id: id }),
      );

      const newFeedback = this.restaurantFeedbackRepository.create({
        customerId,
        restaurantId,
        orderId,
        rate,
        message,
        reasons: reasonEntities,
      });

      await this.restaurantFeedbackRepository.save(newFeedback);
      this.updateRestaurantRating(restaurantId);
      return {
        status: HttpStatus.CREATED,
        message: 'Rate restaurant successfully',
      };
    } catch (err) {
      if (err && err.code === PG_UNIQUE_CONSTRAINT_VIOLATION) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'You already rate this order',
        };
      }
      if (err && err.code === PG_FOREIGN_KEY_CONSTRAINT_VIOLATION) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Customer does not exist',
        };
      }
      console.log({ err });
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
      };
    }
  }

  async updateRestaurantRating(restaurantId: string) {
    let queryBuilder: SelectQueryBuilder<RestaurantFeedback> =
      this.restaurantFeedbackRepository.createQueryBuilder('res_feedback');

    const columnsName = { avgRating: 'avgRating', rateCount: 'rateCount' };

    queryBuilder = queryBuilder
      .where('res_feedback.restaurantId = :restaurantId', {
        restaurantId: restaurantId,
      })
      .select(`AVG(res_feedback."rate") as "${columnsName.avgRating}"`)
      .addSelect(`COUNT(id) as "${columnsName.rateCount}"`);

    try {
      const result = await queryBuilder.getRawOne();
      console.log({ result });
      if (!result[columnsName.avgRating]) {
        this.logger.error(`Update restaurant ${restaurantId} rating failed!`);
        return;
      }
      this.restaurantServiceClient.emit('updateRestaurantRating', {
        restaurantId,
        avgRating:
          Math.round(parseInt(result[columnsName.avgRating]) * 100) / 100,
        rateCount: parseInt(result[columnsName.rateCount]),
      });
    } catch (e) {
      this.logger.error(
        `Update restaurant ${restaurantId} rating failed! ${e.message}`,
      );
    }
  }

  async getFeedbackOfOrder(
    getFeedbackOfOrderDto: GetFeedbackOfOrdersDto,
  ): Promise<IGetFeedbackOfOrders> {
    const { orderIds } = getFeedbackOfOrderDto;
    const restaurantFeedbacks = await this.restaurantFeedbackRepository.find({
      where: {
        orderId: In(orderIds),
      },
    });
    const feedbacks = orderIds.map((orderId) => {
      const restaurantFeedback = restaurantFeedbacks.find(
        ({ orderId: rateOrderId }) => rateOrderId == orderId,
      );
      return RestaurantFeedbackDto.EntityToDto(restaurantFeedback);
    });

    return {
      status: HttpStatus.OK,
      message: 'Get restaurant feedback of orders successfully',
      data: {
        feedbacks,
      },
    };
  }

  async ratingDriver(
    RatingDriverDto: RatingDriverDto,
  ): Promise<IRatingDriverResponse> {
    try {
      const {
        customerId,
        rate,
        reasonIds = [],
        orderId,
        message,
      } = RatingDriverDto;
      const hasReasons = reasonIds.length > 0;

      if (hasReasons) {
        // check reasonIds
        const validIdCount = await this.feedbackReasonRepository.count({
          where: {
            id: In(reasonIds),
            type: FeedbackType.Driver,
            rate,
          },
        });

        if (validIdCount < reasonIds.length) {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'One of reason ids is not valid. Please check again',
          };
        }
      }

      // get driverId, deliveryTime of order by OrderId
      const response: IOrderServiceGetRateInfosResponse =
        await this.orderServiceClient
          .send('getOrderRatingInfos', { orderId, customerId })
          .pipe(
            timeout(5000),
            catchError((err) => {
              if (err instanceof TimeoutError) {
                return throwError(
                  new RequestTimeoutException(
                    'Timeout. Maybe server has problem!',
                  ),
                );
              }
              return throwError({ message: err });
            }),
          )
          .toPromise();

      const { data, message: serviceResponse, status } = response;
      if (status != HttpStatus.OK) {
        throw new Error(serviceResponse);
      }
      const { driverId, deliveredAt } = data;

      const EXPIRED_TIME = 60 * 1000 * 60 * 24 * 3;
      const expiredRateRequest =
        Date.now() - EXPIRED_TIME > new Date(deliveredAt).getTime();

      if (expiredRateRequest) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `You can only rate an order within ${
            EXPIRED_TIME / (60 * 1000 * 60)
          } hours`,
        };
      }

      const reasonEntities = reasonIds.map((id) =>
        this.feedbackReasonRepository.create({ id: id }),
      );

      const newFeedback = this.driverFeedbackRepository.create({
        customerId,
        driverId,
        orderId,
        rate,
        message,
        reasons: reasonEntities,
      });

      await this.driverFeedbackRepository.save(newFeedback);
      this.updateDriverRating(driverId);
      return {
        status: HttpStatus.CREATED,
        message: 'Rate driver successfully',
      };
    } catch (err) {
      if (err && err.code === PG_UNIQUE_CONSTRAINT_VIOLATION) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'You already rate this order',
        };
      }
      if (err && err.code === PG_FOREIGN_KEY_CONSTRAINT_VIOLATION) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Customer does not exist',
        };
      }
      console.log({ err });
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
      };
    }
  }

  async updateDriverRating(driverId: string) {
    let queryBuilder: SelectQueryBuilder<DriverFeedback> =
      this.driverFeedbackRepository.createQueryBuilder('driver_feedback');

    const columnsName = { avgRating: 'avgRating', rateCount: 'rateCount' };

    queryBuilder = queryBuilder
      .where('driver_feedback.driverId = :driverId', {
        driverId: driverId,
      })
      .select(`AVG(driver_feedback."rate") as "${columnsName.avgRating}"`)
      .addSelect(`COUNT(id) as "${columnsName.rateCount}"`);

    try {
      const result = await queryBuilder.getRawOne();
      console.log({ result });
      if (!result[columnsName.avgRating]) {
        this.logger.error(`Update driver ${driverId} rating failed!`);
        return;
      }
      const rate = {
        avgRating:
          Math.round(parseInt(result[columnsName.avgRating]) * 100) / 100,
        rateCount: parseInt(result[columnsName.rateCount]),
      };

      const didUpdate = await this.driverService.updateDriverRating(driverId, {
        rating: rate.avgRating,
      });
      if (!didUpdate) {
        this.logger.error(`Update driver ${driverId} rating failed!`);
      }
    } catch (e) {
      this.logger.error(
        `Update driver ${driverId} rating failed! ${e.message}`,
      );
    }
  }
}
