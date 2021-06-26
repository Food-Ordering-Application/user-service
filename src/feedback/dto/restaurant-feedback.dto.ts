import { RestaurantFeedback } from '../entities/restaurant-feedback.entity';
export class RestaurantFeedbackDto {
  orderId: string;
  rate: number;
  message: string;
  static EntityToDto(feedback: RestaurantFeedback) {
    if (!feedback) return null;
    const { rate, message, orderId } = feedback;
    return {
      orderId,
      rate,
      message,
    };
  }
}
