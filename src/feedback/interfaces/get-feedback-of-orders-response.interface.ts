import { RestaurantFeedbackDto } from '../dto';
export class IGetFeedbackOfOrders {
  status: number;
  message: string;
  data: {
    feedbacks: RestaurantFeedbackDto[];
  };
}
