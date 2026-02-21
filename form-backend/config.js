function readScriptProperty_(key, fallbackValue) {
  try {
    var value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value === '') return fallbackValue;
    return value;
  } catch (e) {
    return fallbackValue;
  }
}

var CONFIG = {
  // Required in production. Configure in Apps Script > Project Settings > Script properties.
  SPREADSHEET_ID: readScriptProperty_('SPREADSHEET_ID', ''),
  INVESTOR_SPREADSHEET_ID: readScriptProperty_('INVESTOR_SPREADSHEET_ID', ''),
  EMPLOYMENT_SPREADSHEET_ID: readScriptProperty_('EMPLOYMENT_SPREADSHEET_ID', ''),

  // Optional overrides via Script Properties.
  SHEET_NAME: readScriptProperty_('SHEET_NAME', 'responses'),
  INVESTOR_SHEET_NAME: readScriptProperty_('INVESTOR_SHEET_NAME', 'investor_responses'),
  EMPLOYMENT_SHEET_NAME: readScriptProperty_('EMPLOYMENT_SHEET_NAME', 'employment_responses'),
  HONEYPOT_KEY: readScriptProperty_('HONEYPOT_KEY', 'website'),
  HONEYPOT_SHEET_NAME: readScriptProperty_('HONEYPOT_SHEET_NAME', 'honeypot'),
  RATE_LIMIT_SECONDS: Number(readScriptProperty_('RATE_LIMIT_SECONDS', '60')),
  MESSAGE_MAX_LENGTH: Number(readScriptProperty_('MESSAGE_MAX_LENGTH', '1000')),
  FILE_UPLOAD_MAX_BYTES: Number(readScriptProperty_('FILE_UPLOAD_MAX_BYTES', '8388608')),
  UPLOAD_DRIVE_FOLDER_ID: readScriptProperty_('UPLOAD_DRIVE_FOLDER_ID', ''),
  SOURCE: readScriptProperty_('SOURCE', 'tsi-site'),
  ADMIN_EMAIL: readScriptProperty_('ADMIN_EMAIL', ''),
  AUTO_REPLY_FROM_EMAIL: readScriptProperty_('AUTO_REPLY_FROM_EMAIL', '')
};

// Column schema used when appending rows. Keep stable and ordered.
var SHEET_COLUMNS = [
  'timestamp_utc',
  'timestamp_local',
  'submission_type',
  'handler_tier',
  'concierge_track',
  'name',
  'email',
  'role',
  'focus',
  'org',
  'investor_stage',
  'investor_check_range',
  'investor_thesis',
  'employment_role_interest',
  'employment_timeline',
  'employment_location_pref',
  'loc_city',
  'loc_state',
  'loc_country',
  'message',
  'attachment_name',
  'attachment_type',
  'attachment_size',
  'attachment_url',
  'attachment_status',
  'source',
  'page_path',
  'referrer',
  'submission_id'
];
