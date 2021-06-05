export class GetListDriverTransactionHistoryDto {
  query: string;
  page: number;
  size: number;
  transactionStatus?: string;
  from?: string;
  to?: string;
  driverId: string;
  callerId: string;
}
