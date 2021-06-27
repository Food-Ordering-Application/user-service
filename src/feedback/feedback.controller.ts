import { MessagePattern, Payload } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import {
  GetFeedbackOfOrdersDto,
  RatingDriverDto,
  RatingRestaurantDto,
} from './dto';

@Controller()
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @MessagePattern('ratingRestaurant')
  ratingRestaurant(
    @Payload()
    RatingRestaurantDto: RatingRestaurantDto,
  ) {
    return this.feedbackService.ratingRestaurant(RatingRestaurantDto);
  }

  @MessagePattern('ratingDriver')
  ratingDriver(
    @Payload()
    ratingDriverDto: RatingDriverDto,
  ) {
    return this.feedbackService.ratingDriver(ratingDriverDto);
  }

  @MessagePattern('getFeedbackOfOrders')
  getFeedbackOfOrder(@Payload() getFeedbackOfOrderDto: GetFeedbackOfOrdersDto) {
    return this.feedbackService.getFeedbackOfOrder(getFeedbackOfOrderDto);
  }
}
