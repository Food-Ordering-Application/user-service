import { RestaurantFeedback } from './entities/restaurant-feedback.entity';
import { DriverFeedback } from './entities/driver-feedback.entity';
import { FeedbackReason } from './entities/feedback-reason.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RESTAURANT_SERVICE } from 'src/constants';
import { Repository } from 'typeorm';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(RESTAURANT_SERVICE)
    private restaurantService: ClientProxy,

    @InjectRepository(FeedbackReason)
    private feedbackReasonRepository: Repository<FeedbackReason>,

    @InjectRepository(DriverFeedback)
    private driverFeedbackRepository: Repository<DriverFeedback>,

    @InjectRepository(RestaurantFeedback)
    private restaurantFeedbackRepository: Repository<RestaurantFeedback>,
  ) {}
}
