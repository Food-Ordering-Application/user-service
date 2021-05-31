export interface IDelivery {
  id: string;
  customerId: string;
  driverId: string;
  customerAddress: string;
  customerGeom: { type: string; coordinates: number[] };
  restaurantAddress: string;
  restaurantGeom: { type: string; coordinates: number[] };
  distance: number;
  shippingFee: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date;
}
