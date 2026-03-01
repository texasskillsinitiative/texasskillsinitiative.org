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
  LEGACY_SPREADSHEET_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_SPREADSHEET_ID', ''),
  LEGACY_INVESTOR_SPREADSHEET_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_INVESTOR_SPREADSHEET_ID', ''),
  LEGACY_EMPLOYMENT_SPREADSHEET_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_EMPLOYMENT_SPREADSHEET_ID', ''),

  INVESTMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INVESTMENT_SHEET_NAME', 'portal_investment_intake'),
  PRESS_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_PRESS_SHEET_NAME', 'portal_press_intake'),
  EMPLOYMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_SHEET_NAME', 'portal_employment_intake'),
  INTERNSHIP_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_SHEET_NAME', 'portal_internship_intake'),
  LEGACY_STAKEHOLDER_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_LEGACY_STAKEHOLDER_SHEET_NAME', 'responses'),
  LEGACY_INVESTOR_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_LEGACY_INVESTOR_SHEET_NAME', 'investor_responses'),
  LEGACY_EMPLOYMENT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_LEGACY_EMPLOYMENT_SHEET_NAME', 'employment_responses'),

  RATE_LIMIT_SECONDS: Number(portalV2ReadProp_('PORTAL_V2_RATE_LIMIT_SECONDS', '45')),
  MESSAGE_MAX_LENGTH: Number(portalV2ReadProp_('PORTAL_V2_MESSAGE_MAX_LENGTH', '1400')),
  FILE_UPLOAD_MAX_BYTES: Number(portalV2ReadProp_('PORTAL_V2_FILE_UPLOAD_MAX_BYTES', '8388608')),

  INVESTMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INVESTMENT_UPLOAD_FOLDER_ID', ''),
  PRESS_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_PRESS_UPLOAD_FOLDER_ID', ''),
  EMPLOYMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_EMPLOYMENT_UPLOAD_FOLDER_ID', ''),
  INTERNSHIP_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_INTERNSHIP_UPLOAD_FOLDER_ID', ''),
  LEGACY_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_UPLOAD_FOLDER_ID', ''),
  LEGACY_STAKEHOLDER_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_STAKEHOLDER_UPLOAD_FOLDER_ID', ''),
  LEGACY_INVESTOR_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_INVESTOR_UPLOAD_FOLDER_ID', ''),
  LEGACY_EMPLOYMENT_UPLOAD_FOLDER_ID: portalV2ReadProp_('PORTAL_V2_LEGACY_EMPLOYMENT_UPLOAD_FOLDER_ID', ''),

  HONEYPOT_KEY: portalV2ReadProp_('PORTAL_V2_HONEYPOT_KEY', 'website'),
  HONEYPOT_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_HONEYPOT_SHEET_NAME', 'portal_v2_honeypot'),
  DASHBOARD_SHEET_NAME: portalV2ReadProp_('PORTAL_V2_DASHBOARD_SHEET_NAME', 'portal_v2_dashboard'),
  TAB_COLOR_NEW: portalV2ReadProp_('PORTAL_V2_TAB_COLOR_NEW', '#b71c1c'),
  TAB_COLOR_REVIEWED: portalV2ReadProp_('PORTAL_V2_TAB_COLOR_REVIEWED', ''),
  DASHBOARD_ENABLED: String(portalV2ReadProp_('PORTAL_V2_DASHBOARD_ENABLED', 'true')).toLowerCase() !== 'false',
  SOURCE: portalV2ReadProp_('PORTAL_V2_SOURCE', 'tsi-portal-v2'),
  ADMIN_EMAIL: portalV2ReadProp_('PORTAL_V2_ADMIN_EMAIL', ''),

  AUTO_REPLY_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_LEGACY_STAKEHOLDER_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_LEGACY_STAKEHOLDER_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_LEGACY_INVESTOR_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_LEGACY_INVESTOR_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_LEGACY_EMPLOYMENT_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_LEGACY_EMPLOYMENT_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_INVESTMENT_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_INVESTMENT_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_PRESS_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_PRESS_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED: String(portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED', 'false')).toLowerCase() === 'true',
  AUTO_REPLY_SUBJECT_PREFIX: portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_SUBJECT_PREFIX', 'TSI Intake Confirmation'),
  AUTO_REPLY_SIGNATURE: portalV2ReadProp_('PORTAL_V2_AUTO_REPLY_SIGNATURE', 'TSI Intake Team')
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

var PORTAL_V2_LEGACY_COLUMNS = [
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

var PORTAL_V2_DASHBOARD_COLUMNS = [
  'route',
  'sheet_name',
  'unreviewed_count',
  'status',
  'last_submission_utc',
  'last_submission_id',
  'last_reviewed_utc',
  'current_last_row'
];
