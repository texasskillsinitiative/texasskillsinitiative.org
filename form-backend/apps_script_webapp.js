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
        var hpHeader = ['timestamp_utc','handler_tier','submission_id','hp_field','hp_value','payload','source','page_path','referrer'];
        var hpRow = [nowUtcIso(), escapeCellValue(payload.handler_tier || 'unknown'), escapeCellValue(payload.submission_id || payload.form_id || Utilities.getUuid()), CONFIG.HONEYPOT_KEY, hpValue, escapeCellValue(JSON.stringify(payload)), CONFIG.SOURCE, escapeCellValue(payload.page_path || ''), escapeCellValue(payload.referrer || '')];
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
    if (!handlerTier || (handlerTier !== 'Tier 1' && handlerTier !== 'Tier 2')) {
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
    var message = escapeCellValue(payload.message || '', CONFIG.MESSAGE_MAX_LENGTH);
    var locationCityRaw = payload.location_city || '';
    var locationCountryRaw = payload.location_country || '';
    if ((!locationCityRaw && !locationCountryRaw) && payload.location) {
      var parts = String(payload.location).split(',').map(function(p) { return p.trim(); }).filter(function(p) { return p; });
      if (parts.length > 1) {
        locationCountryRaw = parts.pop();
        locationCityRaw = parts.join(', ');
      } else if (parts.length === 1) {
        locationCityRaw = parts[0];
      }
    }
    var locationCity = escapeCellValue(locationCityRaw);
    var locationCountry = escapeCellValue(locationCountryRaw);

    var submissionId = escapeCellValue(payload.submission_id || payload.form_id || '');
    if (!submissionId) {
      submissionId = Utilities.getUuid();
    }

    var row = [
      nowUtcIso(),
      handlerTier,
      escapeCellValue(payload.name || ''),
      email,
      escapeCellValue(payload.org || ''),
      locationCity,
      locationCountry,
      message,
      CONFIG.SOURCE,
      escapeCellValue(payload.page_path || ''),
      escapeCellValue(payload.referrer || ''),
      escapeCellValue(payload.concierge_track || ''),
      escapeCellValue(payload.role || ''),
      escapeCellValue(payload.focus || ''),
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
      var subj = 'TSI form submission: ' + handlerTier;
      var body = 'Received a submission (Tier: ' + handlerTier + ')\n' +
        'Email: ' + email + '\n' +
        'Name: ' + escapeCellValue(payload.name || '') + '\n' +
        'Received: ' + nowUtcIso();
      notifyAdmin(subj, body);
    }

    return jsonResponse({ ok: true });

  } catch (err) {
    console.error('doPost error: ' + err);
    return jsonResponse({ ok: false, error: 'server_error' });
  }
}
