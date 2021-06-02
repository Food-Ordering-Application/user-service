'use strict';

/**
 *
 * PayPal Node JS SDK dependency
 */
import * as payoutsNodeJssdk from '@paypal/payouts-sdk';
/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
export function client() {
  return new payoutsNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 *
 */
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
  const clientSecret =
    process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

  // if (process.env.NODE_ENV === 'production') {
  //   return new payoutsNodeJssdk.core.LiveEnvironment(
  //     'PAYPAL-CLIENT-ID',
  //     'PAYPAL-CLIENT-SECRET',
  //   );
  // }
  return new payoutsNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}
