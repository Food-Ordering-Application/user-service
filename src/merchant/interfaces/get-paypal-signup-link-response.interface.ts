export interface IGetPayPalSignUpLinkResponse {
  status: number;
  message: string;
  data: {
    action_url: string;
  };
}
