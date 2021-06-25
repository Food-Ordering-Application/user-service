export class IOrderServiceGetRateInfosResponse {
  status: number;
  message: string;
  data: { restaurantId: string; driverId: string; deliveredAt: string };
}
