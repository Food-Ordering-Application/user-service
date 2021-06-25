import { MessagePattern, Payload } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { RatingRestaurantDto } from './dto';

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
}
