export class GetListDriverTransactionHistoryDto {
  query: string;
  page: number;
  size: number;
  from?: string;
  to?: string;
  driverId: string;
  callerId: string;
}
