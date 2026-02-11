// restore v1
var CONFIG = {
  SPREADSHEET_ID: '144lfq00UnykVWIqkWtJAQu8AJH89nW-z5-I0GG7-jA8', // e.g. '1a2b3c...'
  SHEET_NAME: 'responses',
  HONEYPOT_KEY: 'website',
  HONEYPOT_SHEET_NAME: 'honeypot',
  RATE_LIMIT_SECONDS: 60, // block repeated submissions from same email within this many seconds
  MESSAGE_MAX_LENGTH: 1000,
  SOURCE: 'tsi-site',
  ADMIN_EMAIL: 'texasskillsinitiative@gmail.com', // optional: admin notification address, leave empty to disable
  AUTO_REPLY_FROM_EMAIL: 'hello@texasskillsinitiative.org'
};

// Column schema used when appending rows. Keep stable and ordered.
var SHEET_COLUMNS = [
  'timestamp_utc',
  'timestamp_local',
  'handler_tier',
  'concierge_track',
  'name',
  'email',
  'role',
  'focus',
  'org',
  'loc_city',
  'loc_state',
  'loc_country',
  'message',
  'source',
  'page_path',
  'referrer',
  'submission_id'
];
