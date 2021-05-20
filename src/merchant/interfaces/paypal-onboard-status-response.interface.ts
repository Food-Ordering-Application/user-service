export interface IPayPalOnboardStatusResponse {
  merchant_id: string;
  products: [
    {
      name: string;
      status: string;
    },
  ];
  payments_receivable: true;
  primary_email_confirmed: true;
  oauth_integrations: [
    {
      integration_type: string;
      integration_method: string;
      oauth_third_party: [
        {
          partner_client_id: string;
          merchant_client_id: string;
          scopes: string[];
        },
      ];
    },
  ];
}
