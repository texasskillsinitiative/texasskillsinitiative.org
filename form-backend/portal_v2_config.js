function portalV2ReadProp_(key, fallbackValue) {
  try {
    var value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value === '') return fallbackValue;
    return value;
  } catch (e) {
    return fallbackValue;
  }
}

function portalV2ReadPropRaw_(key) {
  try {
    return PropertiesService.getScriptProperties().getProperty(key);
  } catch (e) {
    return null;
  }
}

var PORTAL_V2_RATE_LIMIT_GLOBAL_WINDOW_SECONDS_DEFAULT = 10;
var PORTAL_V2_RATE_LIMIT_TRACK_WINDOW_SECONDS_DEFAULT = 10;

var PORTAL_V2_CONFIG = {
  SPREADSHEET_ID: portalV2ReadProp_('PORTAL_V2_DATABASE_ID', ''),

  INVESTMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INVESTMENT_SHEET_NAME', 'portal_investment_intake'),
  PRESS_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_PRESS_SHEET_NAME', 'portal_press_intake'),
  EMPLOYMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_SHEET_NAME', 'portal_employment_intake'),
  INTERNSHIP_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_SHEET_NAME', 'portal_internship_intake'),
  STAKEHOLDER_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_STAKEHOLDER_SHEET_NAME', 'responses'),

  RATE_LIMIT_SECONDS: Number(portalV2ReadProp_('PORTAL_V2_RATE_LIMIT_SECONDS', '30')),
  RATE_LIMIT_GLOBAL_MAX: Number(portalV2ReadProp_('PORTAL_V2_RATE_LIMIT_GLOBAL_MAX', '6')),
  RATE_LIMIT_GLOBAL_WINDOW_SECONDS: PORTAL_V2_RATE_LIMIT_GLOBAL_WINDOW_SECONDS_DEFAULT,
  RATE_LIMIT_TRACK_MAX: Number(portalV2ReadProp_('PORTAL_V2_RATE_LIMIT_TRACK_MAX', '3')),
  RATE_LIMIT_TRACK_WINDOW_SECONDS: PORTAL_V2_RATE_LIMIT_TRACK_WINDOW_SECONDS_DEFAULT,
  DEDUPE_SECONDS: Number(portalV2ReadProp_('PORTAL_V2_DEDUPE_SECONDS', '3600')),
  BURST_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_BURST_SHEET_NAME', 'portal_v2_burst_state'),
  MESSAGE_MAX_LENGTH: Number(portalV2ReadProp_('PORTAL_V2_MESSAGE_MAX_LENGTH', '1400')),
  FILE_UPLOAD_MAX_BYTES: Number(portalV2ReadProp_('PORTAL_V2_FILE_UPLOAD_MAX_BYTES', '8388608')),

  INVESTMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INVESTMENT_UPLOAD_FOLDER_ID', ''),
  PRESS_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_PRESS_UPLOAD_FOLDER_ID', ''),
  EMPLOYMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_UPLOAD_FOLDER_ID', ''),
  INTERNSHIP_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_UPLOAD_FOLDER_ID', ''),
  PORTAL_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_PORTAL_UPLOAD_FOLDER_ID', ''),
  STAKEHOLDER_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_STAKEHOLDER_UPLOAD_FOLDER_ID', ''),

  HONEYPOT_KEY: portalV2ReadProp_('PORTAL_V2_HONEYPOT_KEY', 'website'),
  HONEYPOT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_HONEYPOT_SHEET_NAME', 'portal_v2_honeypot'),
  INTERNAL_USERNAME_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INTERNAL_USERNAME_SHEET_NAME', 'portal_v2_internal_username'),
  SOURCE: portalV2ReadProp_('PORTAL_V2_SOURCE', 'tsi-portal-v2'),
  ADMIN_NOTIFY_EMAIL: portalV2ReadProp_('PORTAL_V2_ADMIN_NOTIFY_EMAIL', portalV2ReadProp_('PORTAL_V2_ADMIN_EMAIL', '')),
  ZEPTO_TOKEN: portalV2ReadProp_('PORTAL_V2_ZEPTO_TOKEN', ''),
  ZEPTO_AGENT_ALIAS: portalV2ReadProp_('PORTAL_V2_ZEPTO_AGENT_ALIAS', ''),
  ZEPTO_API_BASE: portalV2ReadProp_('PORTAL_V2_ZEPTO_API_BASE', 'https://api.zeptomail.com'),
  ZEPTO_FROM_DEFAULT: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_DEFAULT', 'hello@texasskillsinitiative.org'),
  ZEPTO_FROM_STAKEHOLDER: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_STAKEHOLDER', ''),
  ZEPTO_FROM_INVESTMENT: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_INVESTMENT', ''),
  ZEPTO_FROM_PRESS: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_PRESS', ''),
  ZEPTO_FROM_EMPLOYMENT: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_EMPLOYMENT', ''),
  ZEPTO_FROM_INTERNSHIP: portalV2ReadProp_('PORTAL_V2_ZEPTO_FROM_INTERNSHIP', ''),
  ZEPTO_REPLY_TO_DEFAULT: portalV2ReadProp_('PORTAL_V2_ZEPTO_REPLY_TO_DEFAULT', ''),
  MAIL_LOG_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_MAIL_LOG_SHEET_NAME', 'portal_v2_mail_log'),
  MAIL_FALLBACK_ENABLED: String(portalV2ReadProp_('PORTAL_V2_MAIL_FALLBACK_ENABLED', 'true')).toLowerCase() === 'true',

  AUTO_REPLY_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_STAKEHOLDER_ENABLED: String(
    portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_STAKEHOLDER_ENABLED', 'false')
  ).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_INVESTMENT_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_INVESTMENT_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_PRESS_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_PRESS_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_SUBJECT_PREFIX: portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_SUBJECT_PREFIX', 'TSI Intake Confirmation'),
  AUTO_REPLY_SIGNATURE: portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_SIGNATURE', 'TSI Intake Team')
};

var PORTAL_V2_COLUMNS = [
  'timestamp_utc', 'timestamp_local', 'submission_type', 'concierge_track', 'handler_tier',
  'name', 'email', 'org', 'role', 'loc_city', 'loc_state', 'loc_country',
  'focus',
  'investment_stage', 'investment_check_range', 'investment_geography', 'investment_focus', 'investment_timeline',
  'press_outlet', 'press_role', 'press_deadline', 'press_topic', 'press_format',
  'employment_role_interest', 'employment_timeline', 'employment_location_pref',
  'intern_school', 'intern_program', 'intern_grad_date', 'intern_track', 'intern_mode',
  'intern_hours_per_week', 'intern_start_date', 'intern_portfolio_url',
  'message', 'attachment_name', 'attachment_type', 'attachment_size', 'attachment_url', 'attachment_status',
  'source', 'page_path', 'referrer', 'submission_id'
];
