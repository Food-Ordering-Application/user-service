export interface IDepositMoneyIntoMainAccountWalletResponse {
  status: number;
  message: string;
  paypalOrderId?: string | null;
}
