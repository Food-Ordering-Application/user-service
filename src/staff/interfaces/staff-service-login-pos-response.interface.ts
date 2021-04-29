export interface IStaffServiceLoginPosResponse {
  status: number;
  message: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    firstName: string;
    lastName: string;
    restaurantId: string;
  };
}
