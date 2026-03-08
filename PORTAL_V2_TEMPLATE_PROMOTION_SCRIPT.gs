// TSI intake backend version marker: v3 (legacy file name retained intentionally).
var PORTAL_V2_TEMPLATE_ALLOWED_ROUTES = {
  government: true,
  education: true,
  'private-sector': true,
  'small-business': true,
  professional: true,
  student: true,
  investment: true,
  press: true,
  employment: true,
  internship: true
};

var PORTAL_V2_TEMPLATE_ALLOWED_TYPES = {
  auto_reply: true,
  admin_notify: true
};

var PORTAL_V2_TEMPLATE_ROUTE_ALIASES = {
  sgov: 'government',
  sedu: 'education',
  spvt: 'private-sector',
  ssml: 'small-business',
  spro: 'professional',
  sstu: 'student',
  pinv: 'investment',
  pprs: 'press',
  pemp: 'employment',
  pint: 'internship'
};

var PORTAL_V2_TEMPLATE_ALLOWED_TOKENS = {
  name: true,
  rout: true,
  route: true,
  route_name: true,
  submission_id: true,
  received_utc: true,
  client_tz: true,
  client_utc_offset_minutes: true,
  received_local: true,
  received_texas: true,
  email: true,
  org: true,
  role: true,
  loc_city: true,
  loc_state: true,
  loc_country: true,
  focus: true,
  message: true,
  source: true,
  page_path: true,
  referrer: true,
  submitted_fields_block: true,
  pinv_stage: true,
  pinv_check_range: true,
  pinv_geography: true,
  pinv_focus: true,
  pinv_timeline: true,
  pinv_investor_type: true,
  pinv_investor_type_other: true,
  pprs_outlet: true,
  pprs_role: true,
  pprs_deadline: true,
  pprs_topic: true,
  pprs_format: true,
  pemp_role_interest: true,
  pemp_timeline: true,
  pemp_location_pref: true,
  pint_school: true,
  pint_program: true,
  pint_grad_date: true,
  pint_track: true,
  pint_mode: true,
  pint_hours_per_week: true,
  pint_start_date: true,
  pint_portfolio_url: true,
  attachment_name: true,
  attachment_type: true,
  attachment_size: true,
  attachment_url: true,
  attachment_status: true
};

var PORTAL_V2_TEMPLATE_BASELINE_DEFAULT = {
  schema_version: 1,
  version: 'v1',
  promoted_at_utc: '',
  promoted_by: '',
  templates: {
    government: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for sharing your perspective with the Texas Skills Initiative. This message confirms receipt of your submission.\n\nYour input helps inform ongoing research and planning related to regional workforce development, education pathways, and industrial growth.\n\nOur team will review your submission individually and with the attention you deserve. If we require clarification or would like to follow up regarding your submission, a member of our team may contact you.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    education: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for sharing your perspective with the Texas Skills Initiative. This message confirms receipt of your submission.\n\nYour input helps inform ongoing research and planning related to regional workforce development, education pathways, and industrial growth.\n\nOur team will review your submission individually and with the attention you deserve. If we require clarification or would like to follow up regarding your submission, a member of our team may contact you.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    'private-sector': {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    'small-business': {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    professional: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    student: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    investment: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    press: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    employment: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    },
    internship: {
      auto_reply: {
        enabled: true,
        subject: 'TSI Submission Received',
        body: 'Howdy,\n\nThank you for contacting the Texas Skills Initiative. This message confirms receipt of your submission.\n\nOur team will review the information provided and follow up if clarification is needed.\n\nTSI Howdy Team\nhttps://texasskillsinitiative.org\n\n----Submission Details----\nForm Submitted: {{route_name}}\nSubmission ID: {{submission_id}}\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\n{{submitted_fields_block}}\n'
      },
      admin_notify: {
        enabled: true,
        subject: '[TSI][{{rout}}][{{submission_id}}] {{name}}',
        body: 'Form Submitted: {{route_name}}\nRoute Code: {{rout}}\nRoute Key: {{route}}\nSubmission ID: {{submission_id}}\n\nName: {{name}}\nEmail: {{email}}\nOrganization: {{org}}\nRole: {{role}}\nCity: {{loc_city}}\nState/Region: {{loc_state}}\nCountry: {{loc_country}}\n\nReceived: {{received_local}} (Local) | {{received_texas}} (Texas) | {{received_utc}} (UTC)\nPage Path: {{page_path}}\nReferrer: {{referrer}}\n\n{{submitted_fields_block}}\n'
      }
    }
  }
};

function portalV2PromoteTemplatesFromSheet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var sid = String(PORTAL_V2_CONFIG.TEMPLATE_SHEET_ID || '').trim();
    var sheetName = String(PORTAL_V2_CONFIG.TEMPLATE_SHEET_NAME || 'templates').trim() || 'templates';
    if (!sid) throw new Error('Missing template sheet ID in PORTAL_V2_CONFIG.TEMPLATE_SHEET_ID');

    var ss = SpreadsheetApp.openById(sid);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('Missing sheet tab: ' + sheetName);

    var values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) throw new Error('Template sheet has no data rows');

    var map = portalV2TemplateHeaderMap_(values[0]);
    var requiredHeaders = ['template_type', 'enabled', 'subject_template', 'body_template'];
    for (var i = 0; i < requiredHeaders.length; i++) {
      if (map[requiredHeaders[i]] === undefined) {
        throw new Error('Missing required header: ' + requiredHeaders[i]);
      }
    }
    if (map.route === undefined && map.rout === undefined) {
      throw new Error('Missing required header: route or rout');
    }

    var nextTemplates = portalV2TemplateClone_(PORTAL_V2_TEMPLATE_BASELINE_DEFAULT.templates);
    var rowCount = 0;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var routeCell = map.route !== undefined ? portalV2TemplateCell_(row, map.route) : portalV2TemplateCell_(row, map.rout);
      if (!routeCell && map.rout !== undefined) routeCell = portalV2TemplateCell_(row, map.rout);
      var route = portalV2TemplateNormalizeRoute_(routeCell);
      var type = portalV2TemplateCell_(row, map.template_type).toLowerCase();
      if (!route && !type) continue;
      if (!PORTAL_V2_TEMPLATE_ALLOWED_ROUTES[route]) throw new Error('Invalid route on row ' + (r + 1) + ': ' + route);
      if (!PORTAL_V2_TEMPLATE_ALLOWED_TYPES[type]) throw new Error('Invalid template_type on row ' + (r + 1) + ': ' + type);

      var enabled = portalV2TemplateToBool_(portalV2TemplateCell_(row, map.enabled));
      var subject = portalV2TemplateCell_(row, map.subject_template);
      var body = portalV2TemplateCell_(row, map.body_template);
      if (!subject) throw new Error('Missing subject_template on row ' + (r + 1));
      if (!body) throw new Error('Missing body_template on row ' + (r + 1));

      portalV2TemplateValidateTokens_(subject, r + 1);
      portalV2TemplateValidateTokens_(body, r + 1);

      nextTemplates[route][type] = {
        enabled: enabled,
        subject: subject,
        body: body
      };
      rowCount++;
    }

    if (!rowCount) throw new Error('No valid template rows found');

    var current = portalV2TemplateBaselineFromProps_();
    var currentDigest = portalV2TemplateDigest_(JSON.stringify(current.templates || {}));
    var nextDigest = portalV2TemplateDigest_(JSON.stringify(nextTemplates));
    if (currentDigest === nextDigest) {
      return {
        ok: true,
        changed: false,
        version: String(current.version || 'v1'),
        rows_processed: rowCount
      };
    }

    var nextVersion = portalV2TemplateNextVersion_(String(current.version || 'v1'));
    var nextBaseline = {
      schema_version: 1,
      version: nextVersion,
      promoted_at_utc: new Date().toISOString(),
      promoted_by: portalV2TemplatePromotedBy_(),
      templates: nextTemplates
    };

    props.setProperty('PORTAL_V2_TEMPLATE_BASELINE_JSON', JSON.stringify(nextBaseline));
    props.setProperty('PORTAL_V2_TEMPLATE_BASELINE_VERSION', nextVersion);
    props.setProperty('PORTAL_V2_TEMPLATE_LAST_PROMOTION_HASH', nextDigest);

    return {
      ok: true,
      changed: true,
      version: nextVersion,
      rows_processed: rowCount
    };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function portalV2TemplateNormalizeRoute_(value) {
  var raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (PORTAL_V2_TEMPLATE_ALLOWED_ROUTES[raw]) return raw;
  if (PORTAL_V2_TEMPLATE_ROUTE_ALIASES[raw]) return PORTAL_V2_TEMPLATE_ROUTE_ALIASES[raw];
  return raw;
}

function portalV2TemplateBaselineFromProps_() {
  var raw = PropertiesService.getScriptProperties().getProperty('PORTAL_V2_TEMPLATE_BASELINE_JSON');
  if (!raw) return portalV2TemplateClone_(PORTAL_V2_TEMPLATE_BASELINE_DEFAULT);
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return portalV2TemplateClone_(PORTAL_V2_TEMPLATE_BASELINE_DEFAULT);
    if (!parsed.templates || typeof parsed.templates !== 'object') parsed.templates = portalV2TemplateClone_(PORTAL_V2_TEMPLATE_BASELINE_DEFAULT.templates);
    if (!parsed.version) parsed.version = 'v1';
    return parsed;
  } catch (err) {
    return portalV2TemplateClone_(PORTAL_V2_TEMPLATE_BASELINE_DEFAULT);
  }
}

function portalV2TemplateExportBaselineCodeSnippet() {
  var baseline = portalV2TemplateBaselineFromProps_();
  return [
    '// Generated by portalV2PromoteTemplatesFromSheet()',
    'var PORTAL_V2_TEMPLATE_BASELINE_DEFAULT = ' + JSON.stringify(baseline, null, 2) + ';'
  ].join('\n');
}

function portalV2TemplateHeaderMap_(headerRow) {
  var map = {};
  for (var i = 0; i < headerRow.length; i++) {
    var key = String(headerRow[i] || '').trim().toLowerCase();
    if (!key) continue;
    map[key] = i;
  }
  return map;
}

function portalV2TemplateCell_(row, idx) {
  if (idx === undefined || idx === null) return '';
  return String(row[idx] || '').trim();
}

function portalV2TemplateToBool_(raw) {
  var v = String(raw || '').trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'y') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'n') return false;
  throw new Error('Invalid enabled value: ' + raw);
}

function portalV2TemplateValidateTokens_(text, rowNumber) {
  var regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  var match;
  while ((match = regex.exec(String(text || ''))) !== null) {
    var token = String(match[1] || '').trim();
    if (!PORTAL_V2_TEMPLATE_ALLOWED_TOKENS[token]) {
      throw new Error('Unknown token on row ' + rowNumber + ': ' + token);
    }
  }
}

function portalV2TemplateNextVersion_(currentVersion) {
  var m = String(currentVersion || '').match(/^v(\d+)$/i);
  if (!m) return 'v1';
  var n = Number(m[1] || '0');
  if (!isFinite(n) || n < 0) n = 0;
  return 'v' + String(n + 1);
}

function portalV2TemplateDigest_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text || ''), Utilities.Charset.UTF_8);
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    var v = (bytes[i] + 256) % 256;
    var h = v.toString(16);
    if (h.length < 2) h = '0' + h;
    out.push(h);
  }
  return out.join('');
}

function portalV2TemplateClone_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function portalV2TemplatePromotedBy_() {
  // Avoid requiring userinfo.email scope; return a best-effort actor label.
  try {
    var email = Session.getActiveUser().getEmail();
    if (email) return String(email);
  } catch (ignore) {}
  return 'manual_operator';
}

