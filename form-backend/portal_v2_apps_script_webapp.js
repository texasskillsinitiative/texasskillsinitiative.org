var PORTAL_V2_TYPES = {
  INVESTMENT: 'investment',
  PRESS: 'press',
  EMPLOYMENT: 'employment',
  INTERNSHIP: 'internship'
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

    var type = portalV2NormalizeType_(payload.submission_type || payload.concierge_track);
    if (!type) return portalV2Json_({ ok: false, error: 'invalid_submission_type' });

    if (payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]) {
      portalV2WriteHoneypot_(type, payload);
      return portalV2Json_({ ok: true });
    }

    var email = portalV2Esc_(payload.email || '').trim();
    if (!portalV2EmailOk_(email)) return portalV2Json_({ ok: false, error: 'invalid_input' });

    portalV2RateLimit_(email);

    var name = String(payload.name || '').trim();
    var city = String(payload.loc_city || '').trim();
    var country = String(payload.loc_country || '').trim();
    var message = String(payload.message || '').trim();
    if (!name || !city || !country || !message) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var submissionId = portalV2Esc_(payload.submission_id || '') || Utilities.getUuid();
    var attachment = portalV2Attachment_(payload, type, submissionId);
    if (attachment.error) return portalV2Json_({ ok: false, error: attachment.error });

    var row = [
      portalV2Now_(),
      portalV2Esc_(payload.timestamp_local || ''),
      type,
      portalV2Esc_(payload.concierge_track || (type + '_portal')),
      portalV2Esc_(payload.handler_tier || ''),
      portalV2Esc_(name),
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

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      portalV2Append_(type, row);
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }

    if (PORTAL_V2_CONFIG.ADMIN_EMAIL) {
      MailApp.sendEmail(PORTAL_V2_CONFIG.ADMIN_EMAIL, 'Portal V2 intake: ' + type + ' - ' + email,
        'submission_id: ' + submissionId + '\nattachment_status: ' + (attachment.status || 'none'));
    }

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

function portalV2NormalizeType_(value) {
  var raw = String(value || '').toLowerCase().trim();
  if (raw === PORTAL_V2_TYPES.INVESTMENT || raw.indexOf('investment') !== -1) return PORTAL_V2_TYPES.INVESTMENT;
  if (raw === PORTAL_V2_TYPES.PRESS || raw.indexOf('press') !== -1) return PORTAL_V2_TYPES.PRESS;
  if (raw === PORTAL_V2_TYPES.EMPLOYMENT || raw.indexOf('employment') !== -1) return PORTAL_V2_TYPES.EMPLOYMENT;
  if (raw === PORTAL_V2_TYPES.INTERNSHIP || raw.indexOf('intern') !== -1) return PORTAL_V2_TYPES.INTERNSHIP;
  return '';
}

function portalV2WriteHoneypot_(type, payload) {
  try {
    var header = ['timestamp_utc', 'timestamp_local', 'submission_type', 'submission_id', 'hp_field', 'hp_value', 'payload', 'source', 'page_path', 'referrer'];
    var row = [
      portalV2Now_(),
      portalV2Esc_(payload.timestamp_local || ''),
      type,
      portalV2Esc_(payload.submission_id || Utilities.getUuid()),
      PORTAL_V2_CONFIG.HONEYPOT_KEY,
      portalV2Esc_(payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]),
      portalV2Esc_(JSON.stringify(payload)),
      PORTAL_V2_CONFIG.SOURCE,
      portalV2Esc_(payload.page_path || '/'),
      portalV2Esc_(payload.referrer || 'direct')
    ];
    portalV2AppendNamed_(type, PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME, header, row);
  } catch (e2) {
    console.error('portal v2 honeypot write failed: ' + e2);
  }
}

function portalV2RateLimit_(email) {
  var key = 'portal_v2_rl_' + String(email || '').toLowerCase();
  var props = PropertiesService.getScriptProperties();
  var last = props.getProperty(key);
  var now = Date.now();
  if (last) {
    var prev = parseInt(last, 10) || 0;
    if ((now - prev) < (PORTAL_V2_CONFIG.RATE_LIMIT_SECONDS * 1000)) throw new Error('rate_limit');
  }
  props.setProperty(key, '' + now);
}

function portalV2Attachment_(payload, type, submissionId) {
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
  var blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', type + '_' + submissionId + '_' + safeName);

  var folderId = portalV2UploadFolderByType_(type);
  var file;
  try {
    file = folderId ? DriveApp.getFolderById(folderId).createFile(blob) : DriveApp.createFile(blob);
  } catch (driveErr) {
    console.error('portal v2 upload failed: ' + driveErr);
    return { error: 'file_upload_error' };
  }

  return { status: 'saved', name: file.getName(), type: mime, size: String(size), url: file.getUrl() };
}

function portalV2Append_(type, row) {
  var target = portalV2SheetTarget_(type);
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var sheet = ss.getSheetByName(target.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(target.sheetName);
    sheet.appendRow(PORTAL_V2_COLUMNS);
  }
  sheet.appendRow(row);
}

function portalV2AppendNamed_(type, name, header, row) {
  var target = portalV2SheetTarget_(type);
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (header && header.length) sheet.appendRow(header);
  }
  sheet.appendRow(row);
}

function portalV2SheetTarget_(type) {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_SPREADSHEET_ID');
  if (type === PORTAL_V2_TYPES.INVESTMENT) return { spreadsheetId: sid, sheetName: PORTAL_V2_CONFIG.INVESTMENT_SHEET_NAME };
  if (type === PORTAL_V2_TYPES.PRESS) return { spreadsheetId: sid, sheetName: PORTAL_V2_CONFIG.PRESS_SHEET_NAME };
  if (type === PORTAL_V2_TYPES.EMPLOYMENT) return { spreadsheetId: sid, sheetName: PORTAL_V2_CONFIG.EMPLOYMENT_SHEET_NAME };
  return { spreadsheetId: sid, sheetName: PORTAL_V2_CONFIG.INTERNSHIP_SHEET_NAME };
}

function portalV2UploadFolderByType_(type) {
  if (type === PORTAL_V2_TYPES.INVESTMENT) return String(PORTAL_V2_CONFIG.INVESTMENT_UPLOAD_FOLDER_ID || '').trim();
  if (type === PORTAL_V2_TYPES.PRESS) return String(PORTAL_V2_CONFIG.PRESS_UPLOAD_FOLDER_ID || '').trim();
  if (type === PORTAL_V2_TYPES.EMPLOYMENT) return String(PORTAL_V2_CONFIG.EMPLOYMENT_UPLOAD_FOLDER_ID || '').trim();
  return String(PORTAL_V2_CONFIG.INTERNSHIP_UPLOAD_FOLDER_ID || '').trim();
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
