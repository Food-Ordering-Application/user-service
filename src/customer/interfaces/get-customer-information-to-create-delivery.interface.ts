export interface IGetInformationForDeliveryResponse {
  status: number;
  message: string;
  data: {
    name: string;
    phoneNumber: string;
    address: string;
    geom: { type: string; coordinates: number[] };
  };
}
