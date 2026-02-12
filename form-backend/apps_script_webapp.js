/*
  Google Apps Script Web App endpoint
  - Accepts JSON POST
  - Basic validation and spam controls (honeypot, rate limit)
  - Appends to configured Google Sheet
  - Returns JSON responses matching the spec
*/

function doOptions(e) {
  // preflight handling: Apps Script may not get OPTIONS requests in all contexts,
  // but define for completeness — return a permissive response body.
  return jsonResponse({ ok: true });
}

function doGet(e) {
  // Simple health check
  return jsonResponse({ ok: true });
}

function doPost(e) {
  try {
    var contents = '';
    if (e.postData && e.postData.contents) {
      contents = e.postData.contents;
    } else if (e.parameter && Object.keys(e.parameter).length) {
      // fallback for form-encoded payloads
      contents = JSON.stringify(e.parameter);
    }

    if (!contents) return jsonResponse({ ok: false, error: 'invalid_input' });

    var payload;
    try {
      payload = JSON.parse(contents);
    } catch (err) {
      if (e.parameter && Object.keys(e.parameter).length) {
        payload = e.parameter;
      } else {
        return jsonResponse({ ok: false, error: 'invalid_input' });
      }
    }

    // Honeypot check
    if (payload[CONFIG.HONEYPOT_KEY]) {
      // Log honeypot submissions to a separate sheet for tracking/analysis,
      // then silently return OK to avoid feeding bots.
      try {
        var hpValue = escapeCellValue(payload[CONFIG.HONEYPOT_KEY]);
        var hpSheet = CONFIG.HONEYPOT_SHEET_NAME || (CONFIG.SHEET_NAME + '_honeypot');
        var hpHeader = ['timestamp_utc','timestamp_local','handler_tier','submission_id','hp_field','hp_value','payload','source','page_path','referrer'];
        var hpRow = [nowUtcIso(), escapeCellValue(payload.timestamp_local || ''), escapeCellValue(payload.handler_tier || 'unknown'), escapeCellValue(payload.submission_id || payload.form_id || Utilities.getUuid()), CONFIG.HONEYPOT_KEY, hpValue, escapeCellValue(JSON.stringify(payload)), CONFIG.SOURCE, escapeCellValue(payload.page_path || '/'), escapeCellValue(payload.referrer || 'direct')];
        appendToNamedSheet(hpSheet, hpHeader, hpRow);
      } catch (e) {
        console.error('honeypot write failed: ' + e);
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
        // silent drop to avoid revealing rate policy
        return jsonResponse({ ok: true });
      }
    }
    // record this submission timestamp
    try {
      props.setProperty(propKey, '' + nowMs);
    } catch (pe) {
      console.error('PropertiesService.setProperty failed: ' + pe);
    }

    // Enforce size limits
    var messageRaw = escapeCellValue(payload.message || '', CONFIG.MESSAGE_MAX_LENGTH);
    var locCityRaw = escapeCellValue(payload.loc_city || '');
    var locStateRaw = escapeCellValue(payload.loc_state || '');
    var locCountryRaw = escapeCellValue(payload.loc_country || '');

    function normalizeField(value, isVisible) {
      var trimmed = String(value || '').trim();
      if (trimmed) return escapeCellValue(trimmed, CONFIG.MESSAGE_MAX_LENGTH);
      return isVisible ? 'blank_user' : 'blank_concierge';
    }

    var isTierOne = handlerTier === '1';
    var isTierTwo = handlerTier === '2';

    var rawName = String(payload.name || '').trim();
    if (!rawName) {
      return jsonResponse({ ok: false, error: 'invalid_input' });
    }
    var nameValue = escapeCellValue(rawName);
    var roleValue = normalizeField(payload.role || '', isTierOne);
    var focusValue = normalizeField(payload.focus || '', isTierTwo);
    var orgValue = normalizeField(payload.org || '', isTierOne);
    var locCityValue = normalizeField(locCityRaw, true);
    var locStateValue = normalizeField(locStateRaw, true);
    var locCountryValue = normalizeField(locCountryRaw, true);
    var messageValue = normalizeField(messageRaw, true);

    var submissionId = escapeCellValue(payload.submission_id || payload.form_id || '');
    if (!submissionId) {
      submissionId = Utilities.getUuid();
    }

    var pagePathValue = escapeCellValue(payload.page_path || '/');
    var referrerValue = escapeCellValue(payload.referrer || 'direct');

    var row = [
      nowUtcIso(),
      escapeCellValue(payload.timestamp_local || ''),
      handlerTier,
      conciergeTrack,
      nameValue,
      email,
      roleValue,
      focusValue,
      orgValue,
      locCityValue,
      locStateValue,
      locCountryValue,
      messageValue,
      CONFIG.SOURCE,
      pagePathValue,
      referrerValue,
      submissionId
    ];

    // Append row with lock for atomicity
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendRowToSheet(row);
    } finally {
      try { lock.releaseLock(); } catch (rl) { /* ignore */ }
    }

    // Optional admin notification (minimal, no sensitive content)
    if (CONFIG.ADMIN_EMAIL) {
      var trackAcronymMap = {
        'Regional & Government Authority': 'GOV',
        'Educational Leadership & Instruction': 'EDU',
        'Private Sector & Industry Leadership': 'PSI',
        'Small Business & Local Commerce': 'SBL',
        'Professional & Technical Perspective': 'PTI',
        'Student & Community Perspective': 'SCP'
      };
      var trackAcronym = trackAcronymMap[conciergeTrack] || 'NA';
      var subj = 'TSIForm: ' + handlerTier + ' - ' + trackAcronym + ' - ' + email;
      var body = [
        'timestamp_utc: ' + nowUtcIso(),
        'timestamp_local: ' + escapeCellValue(payload.timestamp_local || ''),
        'handler_tier: ' + handlerTier,
        'concierge_track: ' + conciergeTrack,
        'name: ' + nameValue,
        'email: ' + email,
        'role: ' + roleValue,
        'focus: ' + focusValue,
        'org: ' + orgValue,
        'loc_city: ' + locCityValue,
        'loc_state: ' + locStateValue,
        'loc_country: ' + locCountryValue,
        'message: ' + messageValue,
        'source: ' + CONFIG.SOURCE,
        'page_path: ' + pagePathValue,
        'referrer: ' + referrerValue
      ].join('\n');
      notifyAdmin(subj, body);
    }

    return jsonResponse({ ok: true });

  } catch (err) {
    console.error('doPost error: ' + err);
    return jsonResponse({ ok: false, error: 'server_error' });
  }
}
