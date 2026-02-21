/*
  Google Apps Script Web App endpoint
  - Accepts JSON POST
  - Basic validation and spam controls (honeypot, rate limit)
  - Routes submissions by type (stakeholder/investor/employment)
  - Optional file upload support (base64 payload -> Drive file)
  - Returns JSON responses matching the spec
*/

var SUBMISSION_TYPES = {
  STAKEHOLDER: 'stakeholder',
  INVESTOR: 'investor',
  EMPLOYMENT: 'employment'
};

var ALLOWED_ATTACHMENT_EXTENSIONS = {
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

function doOptions(e) {
  return jsonResponse({ ok: true });
}

function doGet(e) {
  return jsonResponse({ ok: true });
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    if (!payload) return jsonResponse({ ok: false, error: 'invalid_input' });

    var submissionType = normalizeSubmissionType_(payload.submission_type || payload.concierge_track);

    // Honeypot check
    if (payload[CONFIG.HONEYPOT_KEY]) {
      try {
        var hpValue = escapeCellValue(payload[CONFIG.HONEYPOT_KEY]);
        var hpSheet = CONFIG.HONEYPOT_SHEET_NAME || (CONFIG.SHEET_NAME + '_honeypot');
        var hpHeader = ['timestamp_utc', 'timestamp_local', 'submission_type', 'handler_tier', 'submission_id', 'hp_field', 'hp_value', 'payload', 'source', 'page_path', 'referrer'];
        var hpRow = [
          nowUtcIso(),
          escapeCellValue(payload.timestamp_local || ''),
          submissionType,
          escapeCellValue(payload.handler_tier || 'unknown'),
          escapeCellValue(payload.submission_id || payload.form_id || Utilities.getUuid()),
          CONFIG.HONEYPOT_KEY,
          hpValue,
          escapeCellValue(JSON.stringify(payload)),
          CONFIG.SOURCE,
          escapeCellValue(payload.page_path || '/'),
          escapeCellValue(payload.referrer || 'direct')
        ];
        appendToNamedSheetForSubmissionType(submissionType, hpSheet, hpHeader, hpRow);
      } catch (e2) {
        console.error('honeypot write failed: ' + e2);
      }
      return jsonResponse({ ok: true });
    }

    var email = escapeCellValue(payload.email || '').trim();
    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }

    var handlerTier = escapeCellValue(payload.handler_tier || '').trim();
    if (!handlerTier || (handlerTier !== '1' && handlerTier !== '2')) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }

    var conciergeTrack = escapeCellValue(payload.concierge_track || '').trim();
    if (!conciergeTrack) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }

    // Rate limiting via Script Properties. Keyed by normalized email.
    var normEmail = email.toLowerCase();
    var propKey = 'rl_' + normEmail;
    var props = PropertiesService.getScriptProperties();
    var lastVal = props.getProperty(propKey);
    var nowMs = Date.now();
    if (lastVal) {
      var lastMs = parseInt(lastVal, 10) || 0;
      if ((nowMs - lastMs) < (CONFIG.RATE_LIMIT_SECONDS * 1000)) {
        return jsonResponse({ ok: true });
      }
    }
    try {
      props.setProperty(propKey, '' + nowMs);
    } catch (pe) {
      console.error('PropertiesService.setProperty failed: ' + pe);
    }

    var messageRaw = String(payload.message || '').trim();
    var locCityRaw = escapeCellValue(payload.loc_city || '');
    var locStateRaw = escapeCellValue(payload.loc_state || '');
    var locCountryRaw = String(payload.loc_country || '').trim();
    if (!locCountryRaw || !messageRaw) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }

    var rawName = String(payload.name || '').trim();
    if (!rawName) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }

    var submissionId = escapeCellValue(payload.submission_id || payload.form_id || '');
    if (!submissionId) {
      submissionId = Utilities.getUuid();
    }

    var attachment = processAttachmentPayload_(payload, submissionType, submissionId);
    if (attachment.error) {
      return jsonResponse({ ok: false, error: attachment.error });
    }

    function normalizeField(value, isVisible) {
      var trimmed = String(value || '').trim();
      if (trimmed) return escapeCellValue(trimmed, CONFIG.MESSAGE_MAX_LENGTH);
      return isVisible ? 'blank_user' : 'blank_concierge';
    }

    var isTierOne = handlerTier === '1';
    var isTierTwo = handlerTier === '2';
    var isInvestor = submissionType === SUBMISSION_TYPES.INVESTOR;
    var isEmployment = submissionType === SUBMISSION_TYPES.EMPLOYMENT;

    var row = [
      nowUtcIso(),
      escapeCellValue(payload.timestamp_local || ''),
      submissionType,
      handlerTier,
      conciergeTrack,
      escapeCellValue(rawName),
      email,
      normalizeField(payload.role || '', isTierOne),
      normalizeField(payload.focus || '', isTierTwo),
      normalizeField(payload.org || '', isTierOne),
      normalizeField(payload.investor_stage || '', isInvestor),
      normalizeField(payload.investor_check_range || '', isInvestor),
      normalizeField(payload.investor_thesis || '', isInvestor),
      normalizeField(payload.employment_role_interest || '', isEmployment),
      normalizeField(payload.employment_timeline || '', isEmployment),
      normalizeField(payload.employment_location_pref || '', isEmployment),
      normalizeField(locCityRaw, true),
      normalizeField(locStateRaw, true),
      escapeCellValue(locCountryRaw),
      escapeCellValue(messageRaw, CONFIG.MESSAGE_MAX_LENGTH),
      escapeCellValue(attachment.name || ''),
      escapeCellValue(attachment.type || ''),
      escapeCellValue(attachment.size || ''),
      escapeCellValue(attachment.url || ''),
      escapeCellValue(attachment.status || 'none'),
      CONFIG.SOURCE,
      escapeCellValue(payload.page_path || '/'),
      escapeCellValue(payload.referrer || 'direct'),
      submissionId
    ];

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendRowForSubmissionType(submissionType, row);
    } finally {
      try { lock.releaseLock(); } catch (rl) { /* ignore */ }
    }

    if (CONFIG.ADMIN_EMAIL) {
      var trackAcronymMap = {
        'government': 'GOV',
        'education': 'EDU',
        'private-sector': 'PSI',
        'small-business': 'SBL',
        'professional': 'PTI',
        'student': 'SCP',
        'investor': 'INV',
        'employment': 'EMP'
      };
      var trackAcronym = trackAcronymMap[conciergeTrack] || 'NA';
      var subj = 'TSIForm: ' + submissionType + ' - ' + handlerTier + ' - ' + trackAcronym + ' - ' + email;
      var body = [
        'timestamp_utc: ' + nowUtcIso(),
        'timestamp_local: ' + escapeCellValue(payload.timestamp_local || ''),
        'submission_type: ' + submissionType,
        'handler_tier: ' + handlerTier,
        'concierge_track: ' + conciergeTrack,
        'name: ' + escapeCellValue(rawName),
        'email: ' + email,
        'attachment_status: ' + (attachment.status || 'none'),
        'attachment_name: ' + (attachment.name || ''),
        'source: ' + CONFIG.SOURCE,
        'page_path: ' + escapeCellValue(payload.page_path || '/'),
        'referrer: ' + escapeCellValue(payload.referrer || 'direct')
      ].join('\n');
      notifyAdmin(subj, body);
    }

    return jsonResponse({ ok: true });

  } catch (err) {
    console.error('doPost error: ' + err);
    return jsonResponse({ ok: false, error: 'server_error' });
  }
}

function parsePayload_(e) {
  var contents = '';
  if (e.postData && e.postData.contents) {
    contents = e.postData.contents;
  } else if (e.parameter && Object.keys(e.parameter).length) {
    contents = JSON.stringify(e.parameter);
  }
  if (!contents) return null;
  try {
    return JSON.parse(contents);
  } catch (err) {
    if (e.parameter && Object.keys(e.parameter).length) {
      return e.parameter;
    }
  }
  return null;
}

function normalizeSubmissionType_(value) {
  var raw = String(value || '').toLowerCase().trim();
  if (raw === SUBMISSION_TYPES.INVESTOR || raw.indexOf('investor') !== -1) {
    return SUBMISSION_TYPES.INVESTOR;
  }
  if (raw === SUBMISSION_TYPES.EMPLOYMENT || raw.indexOf('employment') !== -1) {
    return SUBMISSION_TYPES.EMPLOYMENT;
  }
  return SUBMISSION_TYPES.STAKEHOLDER;
}

function processAttachmentPayload_(payload, submissionType, submissionId) {
  var attachmentData = String(payload.attachment_data || '').trim();
  var attachmentNameRaw = String(payload.attachment_name || '').trim();
  var attachmentTypeRaw = String(payload.attachment_type || '').trim();
  var attachmentSizeRaw = Number(payload.attachment_size || 0);
  if (!attachmentData) {
    return { status: 'none', name: '', type: '', size: '', url: '' };
  }

  var normalizedBase64 = attachmentData.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!normalizedBase64) {
    return { error: 'invalid_attachment' };
  }

  var safeName = sanitizeFileName_(attachmentNameRaw || 'attachment.bin');
  var extension = getFileExtension_(safeName);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS[extension]) {
    return { error: 'invalid_attachment_type' };
  }

  var bytes;
  try {
    bytes = Utilities.base64Decode(normalizedBase64);
  } catch (e) {
    console.error('base64 decode failed: ' + e);
    return { error: 'invalid_attachment' };
  }
  var sizeBytes = bytes && bytes.length ? bytes.length : 0;
  if (!sizeBytes) {
    return { error: 'invalid_attachment' };
  }
  if (sizeBytes > CONFIG.FILE_UPLOAD_MAX_BYTES) {
    return { error: 'file_too_large' };
  }
  if (attachmentSizeRaw && Number.isFinite(attachmentSizeRaw) && Math.abs(attachmentSizeRaw - sizeBytes) > 12) {
    // soft mismatch check, keep decoded size as source of truth
    attachmentSizeRaw = sizeBytes;
  }

  var safeType = attachmentTypeRaw || inferMimeFromExtension_(extension);
  var prefixedName = submissionType + '_' + submissionId + '_' + safeName;
  var blob = Utilities.newBlob(bytes, safeType || 'application/octet-stream', prefixedName);
  var file;
  try {
    if (CONFIG.UPLOAD_DRIVE_FOLDER_ID) {
      var folder = DriveApp.getFolderById(CONFIG.UPLOAD_DRIVE_FOLDER_ID);
      file = folder.createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }
  } catch (driveErr) {
    console.error('Drive upload failed: ' + driveErr);
    return { error: 'file_upload_error' };
  }

  return {
    status: 'saved',
    name: file.getName(),
    type: safeType,
    size: String(sizeBytes),
    url: file.getUrl()
  };
}

function sanitizeFileName_(name) {
  var safe = String(name || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
  if (!safe) return 'attachment.bin';
  if (safe.length > 120) safe = safe.slice(0, 120);
  return safe;
}

function getFileExtension_(name) {
  var safe = String(name || '');
  var idx = safe.lastIndexOf('.');
  if (idx < 0) return '';
  return safe.slice(idx + 1).toLowerCase();
}

function inferMimeFromExtension_(extension) {
  var ext = String(extension || '').toLowerCase();
  var mimeByExt = {
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
  return mimeByExt[ext] || 'application/octet-stream';
}
