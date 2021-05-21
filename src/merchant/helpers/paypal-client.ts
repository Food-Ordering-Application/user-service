import { HttpService } from '@nestjs/common';
import { IPayPalOnboardStatusResponse } from '../interfaces';

let currentToken = null;
let currentExpiredDate: Date = null;

const getNewPaypalToken = async (
  clientId: string,
  clientSecret: string,
  httpService: HttpService,
): Promise<{ access_token: string; expires_in: number }> => {
  const GET_PAYPAL_TOKEN_URL =
    'https://api-m.sandbox.paypal.com/v1/oauth2/token';

  const GET_PAYPAL_TOKEN_HEADERS = {
    Accept: 'application/json',
    'Accept-Language': 'en_US',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const GET_PAYPAL_TOKEN_AUTH = {
    username: clientId,
    password: clientSecret,
  };

  const GET_PAYPAL_TOKEN_PARAMS = {
    grant_type: 'client_credentials',
  };

  const queryConfig = {
    headers: GET_PAYPAL_TOKEN_HEADERS,
    auth: GET_PAYPAL_TOKEN_AUTH,
    params: GET_PAYPAL_TOKEN_PARAMS,
  };

  try {
    const response = (await httpService
      .post(GET_PAYPAL_TOKEN_URL, {}, queryConfig)
      .toPromise()) as any;
    const {
      data: { access_token, expires_in },
    } = response;
    return { access_token, expires_in };
  } catch (e) {
    console.log(e.message);
    return null;
  }
};

const getPaypalToken = async (httpService: HttpService): Promise<string> => {
  if (currentToken == null || currentExpiredDate < new Date()) {
    const clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
    const clientSecret =
      process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

    const requestNewToken = await getNewPaypalToken(
      clientId,
      clientSecret,
      httpService,
    );

    if (!requestNewToken) {
      return null;
    }

    const { access_token, expires_in } = requestNewToken;

    currentToken = access_token;
    currentExpiredDate = new Date(new Date().getTime() + expires_in - 1 * 1000);
    console.log('get new PayPal token');
  }
  return currentToken;
};

const getCreatePartnerReferralPayload = (
  trackingId: string,
  returnUrl: string,
) => ({
  tracking_id: trackingId,
  partner_config_override: {
    return_url: returnUrl,
    show_add_credit_card: true,
  },
  operations: [
    {
      operation: 'API_INTEGRATION',
      api_integration_preference: {
        rest_api_integration: {
          integration_method: 'PAYPAL',
          integration_type: 'THIRD_PARTY',
          third_party_details: {
            features: ['PAYMENT', 'REFUND'],
          },
        },
      },
    },
  ],
  products: ['EXPRESS_CHECKOUT'],
  legal_consents: [
    {
      type: 'SHARE_DATA_CONSENT',
      granted: true,
    },
  ],
});

const generateSignUpLink = async (
  trackingId: string,
  returnUrl: string,
  httpService: HttpService,
): Promise<string> => {
  const token = await getPaypalToken(httpService);
  if (!token) {
    throw new Error('Cannot get PayPal token');
  }
  const GENERATE_SIGN_UP_URL =
    'https://api-m.sandbox.paypal.com/v2/customer/partner-referrals';
  const queryConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const payload = getCreatePartnerReferralPayload(trackingId, returnUrl);
  try {
    const { data } = (await httpService
      .post(GENERATE_SIGN_UP_URL, payload, queryConfig)
      .toPromise()) as any;

    const { links } = data as {
      links: {
        href: string;
        rel: string;
      }[];
    };

    const { href } = links.find(({ rel }) => rel === 'action_url');

    if (!href) {
      throw new Error('Error when generate sign up link');
    }

    return href;
  } catch (e) {
    throw new Error('Error when generate sign up link - ' + e.message);
  }
};

const getMerchantIdInPayPal = async (
  partnerId: string,
  trackingId: string,
  httpService: HttpService,
): Promise<string> => {
  const token = await getPaypalToken(httpService);
  if (!token) {
    throw new Error('Cannot get PayPal token');
  }
  const GET_MERCHANT_IN_URL = `https://api.sandbox.paypal.com/v1/customer/partners/${partnerId}/merchant-integrations?tracking_id=${trackingId}`;
  const queryConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const result = (await httpService
      .get(GET_MERCHANT_IN_URL, queryConfig)
      .toPromise()) as any;
    const { data } = result;
    const { merchant_id } = data as {
      merchant_id: string;
    };

    if (!merchant_id) {
      throw new Error('Error when get merchant id');
    }

    return merchant_id;
  } catch (e) {
    throw new Error('Error when get MerchantIdInPayPal - ' + e.message);
  }
};

const getOnboardStatus = async (
  partnerId: string,
  merchantIdInPayPal: string,
  httpService: HttpService,
): Promise<IPayPalOnboardStatusResponse> => {
  const token = await getPaypalToken(httpService);
  if (!token) {
    throw new Error('Cannot get PayPal token');
  }
  const GET_ONBOARD_STATUS_URL = `https://api.sandbox.paypal.com/v1/customer/partners/${partnerId}/merchant-integrations/${merchantIdInPayPal}`;
  const queryConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const { data } = (await httpService
      .get(GET_ONBOARD_STATUS_URL, queryConfig)
      .toPromise()) as any;

    return data as IPayPalOnboardStatusResponse;
  } catch (e) {
    throw new Error('Error when get onboard status - ' + e.message);
  }
};

export const PayPalClient = {
  generateSignUpLink,
  getMerchantIdInPayPal,
  getOnboardStatus,
  PartnerId: process.env.PAYPAL_PARTNER_ID,
};
