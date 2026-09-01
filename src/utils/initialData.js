export const INITIAL_DATA = {
  restaurant_info: {
    name: 'My Hotel & Restaurant',
    currency: '৳',
    initial_capital_investment: 0,
    created_at: new Date().toISOString().split('T')[0],
    google_drive_connected: false,
    google_account_email: '',
    google_client_id: '',
    google_api_key: '',
    last_synced_at: null,
  },
  
  owners: [],

  staff: [],

  fixed_assets: [],

  monthly_bills: [],

  daily_records: []
};
