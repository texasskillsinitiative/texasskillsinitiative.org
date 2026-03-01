function portalV2ReadProp_(key, fallbackValue) {
  try {
    var value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value === '') return fallbackValue;
    return value;
  } catch (e) {
    return fallbackValue;
  }
}

var PORTAL_V2_CONFIG = {
  SPREADSHEET_ID: portalV2ReadProp_('PORTAL_V2_SPREADSHEET_ID', ''),

  INVESTMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INVESTMENT_SHEET_NAME', 'portal_investment_intake'),
  PRESS_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_PRESS_SHEET_NAME', 'portal_press_intake'),
  EMPLOYMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_SHEET_NAME', 'portal_employment_intake'),
  INTERNSHIP_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_SHEET_NAME', 'portal_internship_intake'),

  RATE_LIMIT_SECONDS: Number(portalV2ReadProp_('PORTAL_V2_RATE_LIMIT_SECONDS', '45')),
  MESSAGE_MAX_LENGTH: Number(portalV2ReadProp_('PORTAL_V2_MESSAGE_MAX_LENGTH', '1400')),
  FILE_UPLOAD_MAX_BYTES: Number(portalV2ReadProp_('PORTAL_V2_FILE_UPLOAD_MAX_BYTES', '8388608')),

  INVESTMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INVESTMENT_UPLOAD_FOLDER_ID', ''),
  PRESS_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_PRESS_UPLOAD_FOLDER_ID', ''),
  EMPLOYMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_UPLOAD_FOLDER_ID', ''),
  INTERNSHIP_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_UPLOAD_FOLDER_ID', ''),

  HONEYPOT_KEY: portalV2ReadProp_('PORTAL_V2_HONEYPOT_KEY', 'website'),
  HONEYPOT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_HONEYPOT_SHEET_NAME', 'portal_v2_honeypot'),
  SOURCE: portalV2ReadProp_('PORTAL_V2_SOURCE', 'tsi-portal-v2'),
  ADMIN_EMAIL: portalV2ReadProp_('PORTAL_V2_ADMIN_EMAIL', '')
};

var PORTAL_V2_COLUMNS = [
  'timestamp_utc', 'timestamp_local', 'submission_type', 'concierge_track', 'handler_tier',
  'name', 'email', 'org', 'role', 'loc_city', 'loc_country',
  'investment_stage', 'investment_check_range', 'investment_geography', 'investment_focus', 'investment_timeline',
  'press_outlet', 'press_role', 'press_deadline', 'press_topic', 'press_format',
  'employment_role_interest', 'employment_timeline', 'employment_location_pref',
  'intern_school', 'intern_program', 'intern_grad_date', 'intern_track', 'intern_mode',
  'intern_hours_per_week', 'intern_start_date', 'intern_portfolio_url',
  'message', 'attachment_name', 'attachment_type', 'attachment_size', 'attachment_url', 'attachment_status',
  'source', 'page_path', 'referrer', 'submission_id'
];
