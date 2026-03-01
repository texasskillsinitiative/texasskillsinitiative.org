var PORTAL_V2_TYPES = {
  STAKEHOLDER: 'stakeholder',
  INVESTOR: 'investor',
  LEGACY_EMPLOYMENT: 'employment',
  INVESTMENT: 'investment',
  PRESS: 'press',
  PORTAL_EMPLOYMENT: 'employment',
  INTERNSHIP: 'internship'
};

var PORTAL_V2_ROUTES = {
  LEGACY_STAKEHOLDER: 'legacy_stakeholder',
  LEGACY_INVESTOR: 'legacy_investor',
  LEGACY_EMPLOYMENT: 'legacy_employment',
  PORTAL_INVESTMENT: 'portal_investment',
  PORTAL_PRESS: 'portal_press',
  PORTAL_EMPLOYMENT: 'portal_employment',
  PORTAL_INTERNSHIP: 'portal_internship'
};

var PORTAL_V2_ALLOWED_EXTENSIONS = {
  'pdf': true,
  'doc': true,
  'docx': true,
  'ppt': true,
  'pptx': true,
  'txt': true,
  'png': true,
  'jpg': true,
  'jpeg': true
};

function doOptions(e) { return portalV2Json_({ ok: true }); }
function doGet(e) { return portalV2Json_({ ok: true }); }

function doPost(e) {
  try {
    var payload = portalV2Parse_(e);
    if (!payload) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var route = portalV2ResolveRoute_(payload);
    if (!route) return portalV2Json_({ ok: false, error: 'invalid_submission_type' });
    var isLegacy = portalV2IsLegacyRoute_(route);

    if (payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]) {
      portalV2WriteHoneypot_(route, payload);
      return portalV2Json_({ ok: true });
    }

    var email = portalV2Esc_(payload.email || '').trim();
    if (!portalV2EmailOk_(email)) return portalV2Json_({ ok: false, error: 'invalid_input' });

    portalV2RateLimit_(email);

    var name = String(payload.name || '').trim();
    var country = String(payload.loc_country || '').trim();
    var message = String(payload.message || '').trim();
    if (!name || !country || !message) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var city = String(payload.loc_city || '').trim();
    if (!isLegacy && !city) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var handlerTier = portalV2Esc_(payload.handler_tier || '').trim();
    var conciergeTrack = portalV2Esc_(payload.concierge_track || '').trim();
    if (isLegacy) {
      if (!handlerTier || (handlerTier !== '1' && handlerTier !== '2')) return portalV2Json_({ ok: false, error: 'invalid_input' });
      if (!conciergeTrack) return portalV2Json_({ ok: false, error: 'invalid_input' });
    } else if (!conciergeTrack) {
      conciergeTrack = portalV2RouteTrackDefault_(route);
    }

    var submissionId = portalV2Esc_(payload.submission_id || '') || Utilities.getUuid();
    var attachment = portalV2Attachment_(payload, route, submissionId);
    if (attachment.error) return portalV2Json_({ ok: false, error: attachment.error });

    var row = isLegacy
      ? portalV2LegacyRow_(payload, route, handlerTier, conciergeTrack, email, country, message, attachment, submissionId)
      : portalV2PortalRow_(payload, route, conciergeTrack, email, city, country, message, attachment, submissionId);

    var appendMeta;
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendMeta = portalV2Append_(route, row);
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }

    portalV2SignalNewData_(route, appendMeta, submissionId);

    if (PORTAL_V2_CONFIG.ADMIN_EMAIL) {
      MailApp.sendEmail(PORTAL_V2_CONFIG.ADMIN_EMAIL, 'TSI intake (v2): ' + route + ' - ' + email,
        'submission_id: ' + submissionId + '\nattachment_status: ' + (attachment.status || 'none'));
    }

    portalV2TryAutoReply_(route, payload, email, submissionId);

    return portalV2Json_({ ok: true });
  } catch (err) {
    if (String(err && err.message || '') === 'rate_limit') return portalV2Json_({ ok: true });
    console.error('portal v2 doPost error: ' + err);
    return portalV2Json_({ ok: false, error: 'server_error' });
  }
}

function portalV2Parse_(e) {
  var body = '';
  if (e && e.postData && e.postData.contents) body = e.postData.contents;
  else if (e && e.parameter && Object.keys(e.parameter).length) body = JSON.stringify(e.parameter);
  if (!body) return null;
  try { return JSON.parse(body); } catch (err) {
    if (e && e.parameter && Object.keys(e.parameter).length) return e.parameter;
  }
  return null;
}

function portalV2ResolveRoute_(payload) {
  var rawSubmission = String(payload && payload.submission_type || '').toLowerCase().trim();
  var rawTrack = String(payload && payload.concierge_track || '').toLowerCase().trim();
  var routeHint = rawSubmission || rawTrack;
  var looksPortalTrack = rawTrack.indexOf('_portal') !== -1;
  var looksPortalPath = String(payload && payload.page_path || '').toLowerCase().indexOf('/portal-') !== -1;

  if (routeHint === PORTAL_V2_TYPES.INVESTMENT || routeHint.indexOf('investment') !== -1) return PORTAL_V2_ROUTES.PORTAL_INVESTMENT;
  if (routeHint === PORTAL_V2_TYPES.PRESS || routeHint.indexOf('press') !== -1) return PORTAL_V2_ROUTES.PORTAL_PRESS;
  if (routeHint === PORTAL_V2_TYPES.INTERNSHIP || routeHint.indexOf('intern') !== -1) return PORTAL_V2_ROUTES.PORTAL_INTERNSHIP;

  if (routeHint === PORTAL_V2_TYPES.INVESTOR || routeHint.indexOf('investor') !== -1) return PORTAL_V2_ROUTES.LEGACY_INVESTOR;

  if (routeHint === PORTAL_V2_TYPES.PORTAL_EMPLOYMENT || routeHint.indexOf('employment') !== -1) {
    if (looksPortalTrack || looksPortalPath) return PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT;
    return PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT;
  }

  if (routeHint === PORTAL_V2_TYPES.STAKEHOLDER || routeHint.indexOf('stakeholder') !== -1) return PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER;
  if (rawTrack) return PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER;
  return '';
}

function portalV2RouteSubmissionType_(route) {
  if (route === PORTAL_V2_ROUTES.LEGACY_INVESTOR) return PORTAL_V2_TYPES.INVESTOR;
  if (route === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT) return PORTAL_V2_TYPES.LEGACY_EMPLOYMENT;
  if (route === PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER) return PORTAL_V2_TYPES.STAKEHOLDER;
  if (route === PORTAL_V2_ROUTES.PORTAL_INVESTMENT) return PORTAL_V2_TYPES.INVESTMENT;
  if (route === PORTAL_V2_ROUTES.PORTAL_PRESS) return PORTAL_V2_TYPES.PRESS;
  if (route === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return PORTAL_V2_TYPES.PORTAL_EMPLOYMENT;
  if (route === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP) return PORTAL_V2_TYPES.INTERNSHIP;
  return '';
}

function portalV2IsLegacyRoute_(route) {
  return route === PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER
    || route === PORTAL_V2_ROUTES.LEGACY_INVESTOR
    || route === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT;
}

function portalV2RouteTrackDefault_(route) {
  if (route === PORTAL_V2_ROUTES.PORTAL_INVESTMENT) return 'investment_portal';
  if (route === PORTAL_V2_ROUTES.PORTAL_PRESS) return 'press_portal';
  if (route === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return 'employment_portal';
  if (route === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP) return 'internship_portal';
  return '';
}

function portalV2LegacyRow_(payload, route, handlerTier, conciergeTrack, email, country, message, attachment, submissionId) {
  function legacyNormalize(value, visible) {
    var trimmed = String(value || '').trim();
    if (trimmed) return portalV2Esc_(trimmed, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH);
    return visible ? 'blank_user' : 'blank_concierge';
  }

  var submissionType = portalV2RouteSubmissionType_(route);
  var isTierOne = handlerTier === '1';
  var isTierTwo = handlerTier === '2';
  var isInvestor = submissionType === PORTAL_V2_TYPES.INVESTOR;
  var isEmployment = submissionType === PORTAL_V2_TYPES.LEGACY_EMPLOYMENT;

  return [
    portalV2Now_(),
    portalV2Esc_(payload.timestamp_local || ''),
    submissionType,
    handlerTier,
    conciergeTrack,
    portalV2Esc_(String(payload.name || '').trim()),
    email,
    legacyNormalize(payload.role || '', isTierOne),
    legacyNormalize(payload.focus || '', isTierTwo),
    legacyNormalize(payload.org || '', isTierOne),
    legacyNormalize(payload.investor_stage || '', isInvestor),
    legacyNormalize(payload.investor_check_range || '', isInvestor),
    legacyNormalize(payload.investor_thesis || '', isInvestor),
    legacyNormalize(payload.employment_role_interest || '', isEmployment),
    legacyNormalize(payload.employment_timeline || '', isEmployment),
    legacyNormalize(payload.employment_location_pref || '', isEmployment),
    legacyNormalize(payload.loc_city || '', true),
    legacyNormalize(payload.loc_state || '', true),
    portalV2Esc_(country),
    portalV2Esc_(message, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2Esc_(attachment.name || ''),
    portalV2Esc_(attachment.type || ''),
    portalV2Esc_(attachment.size || ''),
    portalV2Esc_(attachment.url || ''),
    portalV2Esc_(attachment.status || 'none'),
    PORTAL_V2_CONFIG.SOURCE,
    portalV2Esc_(payload.page_path || '/'),
    portalV2Esc_(payload.referrer || 'direct'),
    portalV2Esc_(submissionId)
  ];
}

function portalV2PortalRow_(payload, route, conciergeTrack, email, city, country, message, attachment, submissionId) {
  return [
    portalV2Now_(),
    portalV2Esc_(payload.timestamp_local || ''),
    portalV2RouteSubmissionType_(route),
    conciergeTrack,
    portalV2Esc_(payload.handler_tier || ''),
    portalV2Esc_(String(payload.name || '').trim()),
    portalV2Esc_(email),
    portalV2Field_(payload.org || ''),
    portalV2Field_(payload.role || ''),
    portalV2Esc_(city),
    portalV2Esc_(country),

    portalV2Field_(payload.investment_stage || ''),
    portalV2Field_(payload.investment_check_range || ''),
    portalV2Field_(payload.investment_geography || ''),
    portalV2Field_(payload.investment_focus || '', PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2Field_(payload.investment_timeline || ''),

    portalV2Field_(payload.press_outlet || ''),
    portalV2Field_(payload.press_role || ''),
    portalV2Field_(payload.press_deadline || ''),
    portalV2Field_(payload.press_topic || ''),
    portalV2Field_(payload.press_format || ''),

    portalV2Field_(payload.employment_role_interest || ''),
    portalV2Field_(payload.employment_timeline || ''),
    portalV2Field_(payload.employment_location_pref || ''),

    portalV2Field_(payload.intern_school || ''),
    portalV2Field_(payload.intern_program || ''),
    portalV2Field_(payload.intern_grad_date || ''),
    portalV2Field_(payload.intern_track || ''),
    portalV2Field_(payload.intern_mode || ''),
    portalV2Field_(payload.intern_hours_per_week || ''),
    portalV2Field_(payload.intern_start_date || ''),
    portalV2Field_(payload.intern_portfolio_url || ''),

    portalV2Esc_(message, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2Esc_(attachment.name || ''),
    portalV2Esc_(attachment.type || ''),
    portalV2Esc_(attachment.size || ''),
    portalV2Esc_(attachment.url || ''),
    portalV2Esc_(attachment.status || 'none'),
    PORTAL_V2_CONFIG.SOURCE,
    portalV2Esc_(payload.page_path || '/'),
    portalV2Esc_(payload.referrer || 'direct'),
    portalV2Esc_(submissionId)
  ];
}

function portalV2WriteHoneypot_(route, payload) {
  try {
    var header = ['timestamp_utc', 'timestamp_local', 'submission_type', 'submission_id', 'hp_field', 'hp_value', 'payload', 'source', 'page_path', 'referrer'];
    var row = [
      portalV2Now_(),
      portalV2Esc_(payload.timestamp_local || ''),
      portalV2RouteSubmissionType_(route),
      portalV2Esc_(payload.submission_id || Utilities.getUuid()),
      PORTAL_V2_CONFIG.HONEYPOT_KEY,
      portalV2Esc_(payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]),
      portalV2Esc_(JSON.stringify(payload)),
      PORTAL_V2_CONFIG.SOURCE,
      portalV2Esc_(payload.page_path || '/'),
      portalV2Esc_(payload.referrer || 'direct')
    ];
    portalV2AppendNamed_(route, PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME, header, row);
  } catch (e2) {
    console.error('portal v2 honeypot write failed: ' + e2);
  }
}

function portalV2RateLimit_(email) {
  var key = 'portal_v2_rl_' + String(email || '').toLowerCase();
  var ttl = Number(PORTAL_V2_CONFIG.RATE_LIMIT_SECONDS || 45);
  if (!Number.isFinite(ttl) || ttl < 1) ttl = 45;

  // Use cache to avoid unbounded growth in Script Properties.
  var cache = CacheService.getScriptCache();
  var existing = cache.get(key);
  if (existing) throw new Error('rate_limit');
  cache.put(key, '1', ttl);
}

function portalV2Attachment_(payload, route, submissionId) {
  var b64 = String(payload.attachment_data || '').trim();
  var nameRaw = String(payload.attachment_name || '').trim();
  var typeRaw = String(payload.attachment_type || '').trim();
  if (!b64) return { status: 'none', name: '', type: '', size: '', url: '' };

  var normalized = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!normalized) return { error: 'invalid_attachment' };

  var safeName = portalV2SafeFileName_(nameRaw || 'attachment.bin');
  var ext = portalV2Ext_(safeName);
  if (!PORTAL_V2_ALLOWED_EXTENSIONS[ext]) return { error: 'invalid_attachment_type' };

  var bytes;
  try { bytes = Utilities.base64Decode(normalized); } catch (err) { return { error: 'invalid_attachment' }; }
  var size = bytes && bytes.length ? bytes.length : 0;
  if (!size) return { error: 'invalid_attachment' };
  if (size > PORTAL_V2_CONFIG.FILE_UPLOAD_MAX_BYTES) return { error: 'file_too_large' };

  var mime = typeRaw || portalV2Mime_(ext);
  var blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', route + '_' + submissionId + '_' + safeName);

  var folderId = portalV2UploadFolderByRoute_(route);
  var file;
  try {
    file = folderId ? DriveApp.getFolderById(folderId).createFile(blob) : DriveApp.createFile(blob);
  } catch (driveErr) {
    console.error('portal v2 upload failed: ' + driveErr);
    return { error: 'file_upload_error' };
  }

  return { status: 'saved', name: file.getName(), type: mime, size: String(size), url: file.getUrl() };
}

function portalV2Append_(route, row) {
  var target = portalV2SheetTarget_(route);
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var sheet = ss.getSheetByName(target.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(target.sheetName);
    sheet.appendRow(portalV2ColumnsForRoute_(route));
  }
  sheet.appendRow(row);
  return {
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName,
    rowIndex: sheet.getLastRow()
  };
}

function portalV2AppendNamed_(route, name, header, row) {
  var target = portalV2SheetTarget_(route);
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (header && header.length) sheet.appendRow(header);
  }
  sheet.appendRow(row);
}

function portalV2ColumnsForRoute_(route) {
  return portalV2IsLegacyRoute_(route) ? PORTAL_V2_LEGACY_COLUMNS : PORTAL_V2_COLUMNS;
}

function portalV2SheetTarget_(route) {
  var portalSid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!portalSid) throw new Error('Missing PORTAL_V2_SPREADSHEET_ID');

  var legacySid = String(PORTAL_V2_CONFIG.LEGACY_SPREADSHEET_ID || portalSid).trim();
  var legacyInvestorSid = String(PORTAL_V2_CONFIG.LEGACY_INVESTOR_SPREADSHEET_ID || legacySid).trim();
  var legacyEmploymentSid = String(PORTAL_V2_CONFIG.LEGACY_EMPLOYMENT_SPREADSHEET_ID || legacySid).trim();

  if (route === PORTAL_V2_ROUTES.PORTAL_INVESTMENT) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.INVESTMENT_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.PORTAL_PRESS) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.PRESS_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.EMPLOYMENT_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.INTERNSHIP_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.LEGACY_INVESTOR) return { spreadsheetId: legacyInvestorSid, sheetName: PORTAL_V2_CONFIG.LEGACY_INVESTOR_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT) return { spreadsheetId: legacyEmploymentSid, sheetName: PORTAL_V2_CONFIG.LEGACY_EMPLOYMENT_SHEET_NAME };
  return { spreadsheetId: legacySid, sheetName: PORTAL_V2_CONFIG.LEGACY_STAKEHOLDER_SHEET_NAME };
}

function portalV2UploadFolderByRoute_(route) {
  if (route === PORTAL_V2_ROUTES.PORTAL_INVESTMENT) return String(PORTAL_V2_CONFIG.INVESTMENT_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.PORTAL_PRESS) return String(PORTAL_V2_CONFIG.PRESS_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return String(PORTAL_V2_CONFIG.EMPLOYMENT_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP) return String(PORTAL_V2_CONFIG.INTERNSHIP_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER) return String(PORTAL_V2_CONFIG.LEGACY_STAKEHOLDER_UPLOAD_FOLDER_ID || PORTAL_V2_CONFIG.LEGACY_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.LEGACY_INVESTOR) return String(PORTAL_V2_CONFIG.LEGACY_INVESTOR_UPLOAD_FOLDER_ID || PORTAL_V2_CONFIG.LEGACY_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT) return String(PORTAL_V2_CONFIG.LEGACY_EMPLOYMENT_UPLOAD_FOLDER_ID || PORTAL_V2_CONFIG.LEGACY_UPLOAD_FOLDER_ID || '').trim();
  return String(PORTAL_V2_CONFIG.LEGACY_UPLOAD_FOLDER_ID || '').trim();
}

function portalV2TryAutoReply_(route, payload, email, submissionId) {
  try {
    if (!PORTAL_V2_CONFIG.AUTO_REPLY_ENABLED) return;
    if (!portalV2AutoReplyEnabledForRoute_(route)) return;
    if (!portalV2EmailOk_(email)) return;

    var name = String(payload && payload.name || '').trim() || 'there';
    var subject = String(PORTAL_V2_CONFIG.AUTO_REPLY_SUBJECT_PREFIX || 'TSI Intake Confirmation') + ': ' + route;
    var body = [
      'Hello ' + name + ',',
      '',
      'We received your submission and our team will review it.',
      '',
      'Route: ' + route,
      'Submission ID: ' + String(submissionId || ''),
      'Received (UTC): ' + portalV2Now_(),
      '',
      String(PORTAL_V2_CONFIG.AUTO_REPLY_SIGNATURE || 'TSI Intake Team')
    ].join('\n');

    MailApp.sendEmail(email, subject, body);
  } catch (err) {
    console.error('portal v2 auto-reply failed: ' + err);
  }
}

function portalV2AutoReplyEnabledForRoute_(route) {
  if (route === PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER) return !!PORTAL_V2_CONFIG.AUTO_REPLY_LEGACY_STAKEHOLDER_ENABLED;
  if (route === PORTAL_V2_ROUTES.LEGACY_INVESTOR) return !!PORTAL_V2_CONFIG.AUTO_REPLY_LEGACY_INVESTOR_ENABLED;
  if (route === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT) return !!PORTAL_V2_CONFIG.AUTO_REPLY_LEGACY_EMPLOYMENT_ENABLED;
  if (route === PORTAL_V2_ROUTES.PORTAL_INVESTMENT) return !!PORTAL_V2_CONFIG.AUTO_REPLY_PORTAL_INVESTMENT_ENABLED;
  if (route === PORTAL_V2_ROUTES.PORTAL_PRESS) return !!PORTAL_V2_CONFIG.AUTO_REPLY_PORTAL_PRESS_ENABLED;
  if (route === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return !!PORTAL_V2_CONFIG.AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED;
  if (route === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP) return !!PORTAL_V2_CONFIG.AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED;
  return false;
}

function portalV2SignalNewData_(route, appendMeta, submissionId) {
  try {
    if (!appendMeta || !appendMeta.spreadsheetId || !appendMeta.sheetName) return;

    var ss = SpreadsheetApp.openById(appendMeta.spreadsheetId);
    var sheet = ss.getSheetByName(appendMeta.sheetName);
    if (sheet) portalV2ApplyNewTabSignal_(sheet);

    if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) return;

    var now = portalV2Now_();
    var props = PropertiesService.getScriptProperties();
    var unreadKey = portalV2RoutePropKey_('unread', route);
    var lastUtcKey = portalV2RoutePropKey_('last_submission_utc', route);
    var lastIdKey = portalV2RoutePropKey_('last_submission_id', route);
    var lastRowKey = portalV2RoutePropKey_('last_row', route);

    var priorUnread = Number(props.getProperty(unreadKey) || '0');
    if (!Number.isFinite(priorUnread) || priorUnread < 0) priorUnread = 0;
    props.setProperty(unreadKey, String(priorUnread + 1));
    props.setProperty(lastUtcKey, String(now));
    props.setProperty(lastIdKey, String(submissionId || ''));
    props.setProperty(lastRowKey, String(appendMeta.rowIndex || 0));

    portalV2RefreshDashboard_();
  } catch (err) {
    console.error('portal v2 dashboard signal failed: ' + err);
  }
}

function portalV2RefreshDashboard_() {
  if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) return;
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) return;

  var ss = SpreadsheetApp.openById(sid);
  var sheet = ss.getSheetByName(PORTAL_V2_CONFIG.DASHBOARD_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PORTAL_V2_CONFIG.DASHBOARD_SHEET_NAME);
  }

  if (!portalV2HeaderMatches_(sheet, PORTAL_V2_DASHBOARD_COLUMNS)) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, PORTAL_V2_DASHBOARD_COLUMNS.length).setValues([PORTAL_V2_DASHBOARD_COLUMNS]);
  } else {
    var rows = sheet.getLastRow();
    if (rows > 1) {
      sheet.getRange(2, 1, rows - 1, PORTAL_V2_DASHBOARD_COLUMNS.length).clearContent();
    }
  }

  var props = PropertiesService.getScriptProperties();
  var routes = portalV2RouteTypes_();
  var values = [];
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];
    var target = portalV2SheetTarget_(route);
    var unread = Number(props.getProperty(portalV2RoutePropKey_('unread', route)) || '0');
    if (!Number.isFinite(unread) || unread < 0) unread = 0;
    var status = unread > 0 ? 'NEW' : 'REVIEWED';
    values.push([
      route,
      target.sheetName,
      unread,
      status,
      String(props.getProperty(portalV2RoutePropKey_('last_submission_utc', route)) || ''),
      String(props.getProperty(portalV2RoutePropKey_('last_submission_id', route)) || ''),
      String(props.getProperty(portalV2RoutePropKey_('last_reviewed_utc', route)) || ''),
      String(props.getProperty(portalV2RoutePropKey_('last_row', route)) || '')
    ]);
  }

  if (values.length) {
    sheet.getRange(2, 1, values.length, PORTAL_V2_DASHBOARD_COLUMNS.length).setValues(values);
  }
}

function portalV2MarkRouteReviewed(route) {
  var normalized = portalV2NormalizeReviewRoute_(route);
  if (!normalized) throw new Error('invalid_route');

  var target = portalV2SheetTarget_(normalized);

  if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) {
    var noDashSs = SpreadsheetApp.openById(target.spreadsheetId);
    var noDashSheet = noDashSs.getSheetByName(target.sheetName);
    if (noDashSheet) portalV2ApplyReviewedTabSignal_(noDashSheet);
    return { ok: true, route: normalized, dashboard_enabled: false };
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(portalV2RoutePropKey_('unread', normalized), '0');
  props.setProperty(portalV2RoutePropKey_('last_reviewed_utc', normalized), portalV2Now_());

  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var routeSheet = ss.getSheetByName(target.sheetName);
  if (routeSheet) portalV2ApplyReviewedTabSignal_(routeSheet);

  portalV2RefreshDashboard_();
  return { ok: true, route: normalized };
}

function portalV2MarkAllReviewed() {
  var routes = portalV2RouteTypes_();
  for (var i = 0; i < routes.length; i++) {
    portalV2MarkRouteReviewed(routes[i]);
  }
  return { ok: true, routes: routes.length };
}

// Public wrappers for manual runs from Apps Script UI dropdown.
function portalV2RefreshDashboard() {
  portalV2RefreshDashboard_();
  return { ok: true };
}

function portalV2InitializeSheets() {
  var routes = portalV2RouteTypes_();
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];
    var target = portalV2SheetTarget_(route);
    var ss = SpreadsheetApp.openById(target.spreadsheetId);
    var sheet = ss.getSheetByName(target.sheetName);
    if (!sheet) sheet = ss.insertSheet(target.sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, portalV2ColumnsForRoute_(route).length).setValues([portalV2ColumnsForRoute_(route)]);
    }
  }

  var honeyRoute = PORTAL_V2_ROUTES.PORTAL_INVESTMENT;
  var honeyTarget = portalV2SheetTarget_(honeyRoute);
  var honeySs = SpreadsheetApp.openById(honeyTarget.spreadsheetId);
  var honey = honeySs.getSheetByName(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
  if (!honey) honey = honeySs.insertSheet(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
  if (honey.getLastRow() === 0) {
    honey.getRange(1, 1, 1, 10).setValues([[
      'timestamp_utc', 'timestamp_local', 'submission_type', 'submission_id', 'hp_field',
      'hp_value', 'payload', 'source', 'page_path', 'referrer'
    ]]);
  }

  portalV2RefreshDashboard_();
  return { ok: true, initialized_routes: routes.length };
}

function portalV2ClearGeneratedState() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var keys = Object.keys(all || {});
  var prefixes = [
    'portal_v2_unread_',
    'portal_v2_last_submission_utc_',
    'portal_v2_last_submission_id_',
    'portal_v2_last_row_',
    'portal_v2_last_reviewed_utc_',
    'portal_v2_rl_'
  ];

  var deleted = 0;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    for (var j = 0; j < prefixes.length; j++) {
      if (key.indexOf(prefixes[j]) === 0) {
        props.deleteProperty(key);
        deleted++;
        break;
      }
    }
  }
  return { ok: true, deleted_keys: deleted };
}

function portalV2ApplyNewTabSignal_(sheet) {
  if (!sheet) return;
  var color = String(PORTAL_V2_CONFIG.TAB_COLOR_NEW || '').trim();
  if (!color) return;
  try { sheet.setTabColor(color); } catch (e) { /* ignore */ }
}

function portalV2ApplyReviewedTabSignal_(sheet) {
  if (!sheet) return;
  var color = String(PORTAL_V2_CONFIG.TAB_COLOR_REVIEWED || '').trim();
  try {
    if (color) sheet.setTabColor(color);
    else sheet.setTabColor(null);
  } catch (e) { /* ignore */ }
}

function portalV2RouteTypes_() {
  return [
    PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER,
    PORTAL_V2_ROUTES.LEGACY_INVESTOR,
    PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT,
    PORTAL_V2_ROUTES.PORTAL_INVESTMENT,
    PORTAL_V2_ROUTES.PORTAL_PRESS,
    PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT,
    PORTAL_V2_ROUTES.PORTAL_INTERNSHIP
  ];
}

function portalV2NormalizeReviewRoute_(value) {
  var raw = String(value || '').toLowerCase().trim();
  if (!raw) return '';
  if (raw === PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER || raw === PORTAL_V2_TYPES.STAKEHOLDER) return PORTAL_V2_ROUTES.LEGACY_STAKEHOLDER;
  if (raw === PORTAL_V2_ROUTES.LEGACY_INVESTOR || raw === PORTAL_V2_TYPES.INVESTOR) return PORTAL_V2_ROUTES.LEGACY_INVESTOR;
  if (raw === PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT) return PORTAL_V2_ROUTES.LEGACY_EMPLOYMENT;
  if (raw === PORTAL_V2_ROUTES.PORTAL_INVESTMENT || raw === PORTAL_V2_TYPES.INVESTMENT) return PORTAL_V2_ROUTES.PORTAL_INVESTMENT;
  if (raw === PORTAL_V2_ROUTES.PORTAL_PRESS || raw === PORTAL_V2_TYPES.PRESS) return PORTAL_V2_ROUTES.PORTAL_PRESS;
  if (raw === PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT) return PORTAL_V2_ROUTES.PORTAL_EMPLOYMENT;
  if (raw === PORTAL_V2_ROUTES.PORTAL_INTERNSHIP || raw === PORTAL_V2_TYPES.INTERNSHIP) return PORTAL_V2_ROUTES.PORTAL_INTERNSHIP;
  return '';
}

function portalV2RoutePropKey_(key, route) {
  return 'portal_v2_' + String(key || '') + '_' + String(route || '').toLowerCase();
}

function portalV2HeaderMatches_(sheet, expectedHeader) {
  if (!sheet || !expectedHeader || !expectedHeader.length) return false;
  if (sheet.getLastColumn() < expectedHeader.length) return false;
  var header = sheet.getRange(1, 1, 1, expectedHeader.length).getValues()[0];
  for (var i = 0; i < expectedHeader.length; i++) {
    if (String(header[i] || '') !== String(expectedHeader[i] || '')) return false;
  }
  return true;
}

function portalV2Field_(value, maxLen) {
  var v = String(value || '').trim();
  return v ? portalV2Esc_(v, maxLen || PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH) : '';
}

function portalV2EmailOk_(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || '').trim());
}

function portalV2Now_() { return new Date().toISOString(); }

function portalV2Json_(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  if (out.setHeader) {
    out.setHeader('Access-Control-Allow-Origin', '*');
    out.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return out;
}

function portalV2Esc_(v, maxLen) {
  if (v === undefined || v === null) return '';
  v = String(v);
  if (maxLen && v.length > maxLen) v = v.slice(0, maxLen);
  if (/^[=@+\-]/.test(v)) return "'" + v;
  return v;
}

function portalV2SafeFileName_(name) {
  var safe = String(name || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
  if (!safe) return 'attachment.bin';
  if (safe.length > 120) safe = safe.slice(0, 120);
  return safe;
}

function portalV2Ext_(name) {
  var idx = String(name || '').lastIndexOf('.');
  if (idx < 0) return '';
  return String(name).slice(idx + 1).toLowerCase();
}

function portalV2Mime_(ext) {
  var table = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  return table[String(ext || '').toLowerCase()] || 'application/octet-stream';
}
