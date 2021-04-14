import { PartialType } from '@nestjs/mapped-types';
import { SendPhoneNumberOTPVerifyDto } from './send-otp-verify-customer.dto';

export class VerifyCustomerPhoneNumberDto extends PartialType(
  SendPhoneNumberOTPVerifyDto,
) {
  otp: string;
}
