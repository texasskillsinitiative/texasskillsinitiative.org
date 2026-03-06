var PORTAL_V2_TYPES = {
  STAKEHOLDER: 'stakeholder',
  INVESTMENT: 'investment',
  PRESS: 'press',
  EMPLOYMENT: 'employment',
  INTERNSHIP: 'internship'
};

var PORTAL_V2_ROUTES = {
  STAKEHOLDER: 'stakeholder',
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

var PORTAL_V2_NOT_VISIBLE = 'field_not_visible';
var PORTAL_V2_NO_RESPONSE = 'user_no_response';

function doOptions(e) { return portalV2Json_({ ok: true }); }
function doGet(e) { return portalV2Json_({ ok: true }); }

function doPost(e) {
  try {
    var payload = portalV2Parse_(e);
    if (!payload) return portalV2Json_({ ok: false, error: 'invalid_input' });

    if (payload && payload.tsi_username) {
      portalV2LogInternalUsername_(payload);
      return portalV2Json_({ ok: true });
    }

    var route = portalV2ResolveRoute_(payload);
    if (!route) return portalV2Json_({ ok: false, error: 'invalid_submission_type' });
    var isStakeholderRoute = route === PORTAL_V2_ROUTES.STAKEHOLDER;
    var submissionId = portalV2Esc_(payload.submission_id || '') || Utilities.getUuid();

    if (payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]) {
      portalV2WriteHoneypot_(route, payload);
      return portalV2Json_({ ok: true });
    }

    if (payload && String(payload._debug_burst || '') === '1') {
      portalV2LogBurstDebug_(route, payload, submissionId);
      return portalV2Json_({ ok: true, debug_burst: true });
    }

    if (!portalV2AbuseGate_(route, payload, submissionId)) {
      return portalV2Json_({ ok: true });
    }

    var email = portalV2Esc_(payload.email || '').trim();
    if (!portalV2EmailOk_(email)) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var name = String(payload.name || '').trim();
    var country = String(payload.loc_country || '').trim();
    var message = String(payload.message || '').trim();
    if (!name || !country || !message) return portalV2Json_({ ok: false, error: 'invalid_input' });

    var city = String(payload.loc_city || '').trim();
    var stateOrRegion = String(payload.loc_state || '').trim();
    if (!isStakeholderRoute && !city) return portalV2Json_({ ok: false, error: 'invalid_input' });
    if (isStakeholderRoute && !city && !stateOrRegion) return portalV2Json_({ ok: false, error: 'invalid_input' });

    if (route === PORTAL_V2_ROUTES.PRESS) {
      var pressDeadline = String(payload.press_deadline || '').trim();
      var pressDeadlineMode = String(payload.press_deadline_mode || '').toLowerCase().trim();
      var hasNoDeadlineFlag = pressDeadlineMode === 'no_deadline';
      if (!pressDeadline && !hasNoDeadlineFlag) return portalV2Json_({ ok: false, error: 'invalid_input' });
    }

    var handlerTier = portalV2Esc_(payload.handler_tier || '').trim();
    var conciergeTrack = portalV2Esc_(payload.concierge_track || '').trim();
    if (isStakeholderRoute) {
      if (!handlerTier || (handlerTier !== '1' && handlerTier !== '2')) return portalV2Json_({ ok: false, error: 'invalid_input' });
      if (!conciergeTrack) return portalV2Json_({ ok: false, error: 'invalid_input' });
    } else if (!conciergeTrack) {
      conciergeTrack = portalV2RouteTrackDefault_(route);
    }

    if (!portalV2RateLimit_(email, route, payload, submissionId)) {
      return portalV2Json_({ ok: true });
    }

    var visibility = portalV2RouteVisibility_(route, handlerTier);
    var attachmentVisible = visibility.attachment || Boolean(payload.attachment_data);
    var attachment = attachmentVisible
      ? portalV2Attachment_(payload, route, submissionId)
      : portalV2NotVisibleAttachment_();
    if (attachment.error) return portalV2Json_({ ok: false, error: attachment.error });

    var row = portalV2PortalRow_(payload, route, conciergeTrack, email, city, country, message, attachment, submissionId, visibility);

    var appendMeta;
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendMeta = portalV2Append_(route, row);
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }

    portalV2NotifyAdmin_(route, email, submissionId, attachment, payload);
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
  if (routeHint === PORTAL_V2_TYPES.INVESTMENT || routeHint.indexOf('investment') !== -1) return PORTAL_V2_ROUTES.INVESTMENT;
  if (routeHint === PORTAL_V2_TYPES.PRESS || routeHint.indexOf('press') !== -1) return PORTAL_V2_ROUTES.PRESS;
  if (routeHint === PORTAL_V2_TYPES.INTERNSHIP || routeHint.indexOf('intern') !== -1) return PORTAL_V2_ROUTES.INTERNSHIP;
  if (routeHint === PORTAL_V2_TYPES.EMPLOYMENT || routeHint.indexOf('employment') !== -1) return PORTAL_V2_ROUTES.EMPLOYMENT;
  if (routeHint === PORTAL_V2_TYPES.STAKEHOLDER || routeHint.indexOf('stakeholder') !== -1) return PORTAL_V2_ROUTES.STAKEHOLDER;
  if (rawTrack) return PORTAL_V2_ROUTES.STAKEHOLDER;
  return '';
}

function portalV2RouteSubmissionType_(route) {
  if (route === PORTAL_V2_ROUTES.STAKEHOLDER) return PORTAL_V2_TYPES.STAKEHOLDER;
  if (route === PORTAL_V2_ROUTES.INVESTMENT) return PORTAL_V2_TYPES.INVESTMENT;
  if (route === PORTAL_V2_ROUTES.PRESS) return PORTAL_V2_TYPES.PRESS;
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT) return PORTAL_V2_TYPES.EMPLOYMENT;
  if (route === PORTAL_V2_ROUTES.INTERNSHIP) return PORTAL_V2_TYPES.INTERNSHIP;
  return '';
}

function portalV2RouteTrackDefault_(route) {
  if (route === PORTAL_V2_ROUTES.INVESTMENT) return 'investment_portal';
  if (route === PORTAL_V2_ROUTES.PRESS) return 'press_portal';
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT) return 'employment_portal';
  if (route === PORTAL_V2_ROUTES.INTERNSHIP) return 'internship_portal';
  return '';
}

function portalV2NotVisibleAttachment_() {
  return {
    status: PORTAL_V2_NOT_VISIBLE,
    name: PORTAL_V2_NOT_VISIBLE,
    type: PORTAL_V2_NOT_VISIBLE,
    size: PORTAL_V2_NOT_VISIBLE,
    url: PORTAL_V2_NOT_VISIBLE
  };
}

function portalV2ValueOrNotVisible_(value, visible, maxLen) {
  if (!visible) return PORTAL_V2_NOT_VISIBLE;
  var next = portalV2Field_(value, maxLen);
  return next ? next : PORTAL_V2_NO_RESPONSE;
}

function portalV2EscOrNotVisible_(value, visible) {
  if (!visible) return PORTAL_V2_NOT_VISIBLE;
  var next = portalV2Esc_(value || '');
  return next ? next : PORTAL_V2_NO_RESPONSE;
}

function portalV2AttachmentField_(value, visible) {
  if (!visible) return PORTAL_V2_NOT_VISIBLE;
  var next = portalV2Esc_(value || '');
  return next ? next : PORTAL_V2_NO_RESPONSE;
}

function portalV2RouteVisibility_(route, handlerTier) {
  var isStakeholder = route === PORTAL_V2_ROUTES.STAKEHOLDER;
  var isInvestment = route === PORTAL_V2_ROUTES.INVESTMENT;
  var isPress = route === PORTAL_V2_ROUTES.PRESS;
  var isEmployment = route === PORTAL_V2_ROUTES.EMPLOYMENT;
  var isInternship = route === PORTAL_V2_ROUTES.INTERNSHIP;
  var tier = String(handlerTier || '').trim();
  var tierOne = tier === '1';
  var tierTwo = tier === '2';

  return {
    org: isStakeholder ? tierOne : isEmployment,
    role: isStakeholder ? tierOne : isInvestment,
    focus: isStakeholder ? tierTwo : false,
    locState: isStakeholder,
    investment: isInvestment,
    press: isPress,
    employment: isEmployment,
    internship: isInternship,
    attachment: !isStakeholder
  };
}

function portalV2PortalRow_(payload, route, conciergeTrack, email, city, country, message, attachment, submissionId, visibility) {
  return [
    portalV2Now_(),
    portalV2Esc_(payload.timestamp_local || ''),
    portalV2RouteSubmissionType_(route),
    conciergeTrack,
    portalV2Esc_(payload.handler_tier || ''),
    portalV2Esc_(String(payload.name || '').trim()),
    portalV2Esc_(email),
    portalV2ValueOrNotVisible_(payload.org || '', visibility.org),
    portalV2ValueOrNotVisible_(payload.role || '', visibility.role),
    portalV2Esc_(city),
    portalV2EscOrNotVisible_(payload.loc_state || '', visibility.locState),
    portalV2Esc_(country),
    portalV2ValueOrNotVisible_(payload.focus || '', visibility.focus),

    portalV2ValueOrNotVisible_(payload.investment_stage || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.investment_check_range || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.investment_geography || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.investment_focus || '', visibility.investment, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2ValueOrNotVisible_(payload.investment_timeline || '', visibility.investment),

    portalV2ValueOrNotVisible_(payload.press_outlet || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.press_role || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.press_deadline || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.press_topic || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.press_format || '', visibility.press),

    portalV2ValueOrNotVisible_(payload.employment_role_interest || '', visibility.employment),
    portalV2ValueOrNotVisible_(payload.employment_timeline || '', visibility.employment),
    portalV2ValueOrNotVisible_(payload.employment_location_pref || '', visibility.employment),

    portalV2ValueOrNotVisible_(payload.intern_school || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_program || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_grad_date || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_track || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_mode || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_hours_per_week || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_start_date || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.intern_portfolio_url || '', visibility.internship),

    portalV2Esc_(message, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2AttachmentField_(attachment.name || '', visibility.attachment),
    portalV2AttachmentField_(attachment.type || '', visibility.attachment),
    portalV2AttachmentField_(attachment.size || '', visibility.attachment),
    portalV2AttachmentField_(attachment.url || '', visibility.attachment),
    portalV2AttachmentField_(attachment.status || '', visibility.attachment),
    PORTAL_V2_CONFIG.SOURCE,
    portalV2Esc_(payload.page_path || '/'),
    portalV2Esc_(payload.referrer || 'direct'),
    portalV2Esc_(submissionId)
  ];
}

function portalV2WriteHoneypot_(route, payload) {
  try {
    var honeyKey = PORTAL_V2_CONFIG.HONEYPOT_KEY;
    var honeyVal = payload ? payload[honeyKey] : '';
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    nextPayload._honeypot_reason = 'honeypot_field_populated';
    nextPayload._honeypot_field = honeyKey;
    nextPayload._honeypot_value = String(honeyVal || '');
    nextPayload._honeypot_summary = "Honeypot field '" + String(honeyKey || '') + "' was populated.";
    portalV2AppendHoneypot_(route, nextPayload, {
      triggerType: 'honeypot',
      reason: 'honeypot_field_populated',
      reasonDetails: '',
      honeypotField: honeyKey,
      honeypotValue: String(honeyVal || '')
    });
  } catch (e2) {
    console.error('portal v2 honeypot write failed: ' + e2);
  }
}

function portalV2LogAbuse_(route, payload, reason, details) {
  try {
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    nextPayload._abuse_reason = String(reason || 'unknown');
    if (details !== undefined) nextPayload._abuse_details = details;
    portalV2AppendHoneypot_(route, nextPayload, {
      triggerType: 'abuse',
      reason: String(reason || 'unknown'),
      reasonDetails: details,
      honeypotField: 'abuse_reason',
      honeypotValue: String(reason || 'unknown')
    });
  } catch (err) {
    console.error('portal v2 abuse log failed: ' + err);
  }
}

function portalV2LogBurstDebug_(route, payload, submissionId) {
  try {
    var snapshot = portalV2BurstSnapshot_(route);
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    nextPayload.submission_id = submissionId || nextPayload.submission_id || Utilities.getUuid();
    nextPayload._debug_burst = '1';
    portalV2AppendHoneypot_(route, nextPayload, {
      triggerType: 'debug_burst',
      reason: 'burst_state',
      reasonDetails: snapshot,
      honeypotField: 'debug_burst',
      honeypotValue: '1'
    });
  } catch (err) {
    console.error('portal v2 debug burst log failed: ' + err);
  }
}

function portalV2BurstSnapshot_(route) {
  var nowMs = new Date().getTime();
  var globalWindow = Number(PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_WINDOW_SECONDS || 10);
  if (!Number.isFinite(globalWindow) || globalWindow <= 0) globalWindow = 10;
  var trackWindow = Number(PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_WINDOW_SECONDS || 10);
  if (!Number.isFinite(trackWindow) || trackWindow <= 0) trackWindow = 10;
  var globalWindowStart = 0;
  var trackWindowStart = 0;
  var state = portalV2BurstRead_(portalV2BurstSheet_());
  var globalStoredStart = state.globalWindowStartMs;
  var globalStoredCount = state.globalCount;
  var globalStoredWindow = state.globalWindow;
  var trackStoredStart = state.trackWindowStartMs;
  var trackStoredWindow = state.trackWindow;
  var routeKey = String(route || 'unknown');
  var trackStoredRoutes = Object.keys(state.trackCounts || {}).length;
  var trackStoredCountForRoute = state.trackCounts ? state.trackCounts[routeKey] : null;

  var globalCurrent = 0;
  if (Number(globalStoredStart) > 0 && Number(globalStoredWindow) === globalWindow) {
    globalWindowStart = Number(globalStoredStart);
    if (Number.isFinite(globalWindowStart) && (nowMs - globalWindowStart) < (globalWindow * 1000)) {
      globalCurrent = Number(globalStoredCount || 0);
      if (!Number.isFinite(globalCurrent) || globalCurrent < 0) globalCurrent = 0;
    }
  }
  var trackCurrent = 0;
  if (Number(trackStoredStart) > 0 && Number(trackStoredWindow) === trackWindow) {
    trackWindowStart = Number(trackStoredStart);
    if (Number.isFinite(trackWindowStart) && (nowMs - trackWindowStart) < (trackWindow * 1000)) {
      trackCurrent = Number(trackStoredCountForRoute || 0);
      if (!Number.isFinite(trackCurrent) || trackCurrent < 0) trackCurrent = 0;
    }
  }

  return {
    global: {
      key: 'PORTAL_V2_BURST_STATE',
      window_start_ms: globalWindowStart,
      max: Number(PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_MAX || 0),
      window_seconds: globalWindow,
      current: globalCurrent,
      stored_window_start_ms: globalStoredStart,
      stored_count: globalStoredCount,
      stored_window: globalStoredWindow
    },
    track: {
      key: 'PORTAL_V2_BURST_STATE',
      window_start_ms: trackWindowStart,
      max: Number(PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_MAX || 0),
      window_seconds: trackWindow,
      route: routeKey,
      current: trackCurrent,
      stored_window_start_ms: trackStoredStart,
      stored_window: trackStoredWindow,
      stored_count_for_route: trackStoredCountForRoute,
      stored_routes: trackStoredRoutes
    }
  };
}

function portalV2AppendHoneypot_(route, payload, meta) {
  var header = portalV2HoneypotHeader_();
  var safePayload = payload || {};
  var submissionId = portalV2Esc_(safePayload.submission_id || Utilities.getUuid());
  var email = String(safePayload.email || '').trim();
  var emailDomain = '';
  var atIndex = email.indexOf('@');
  if (atIndex > -1) emailDomain = email.slice(atIndex + 1);
  var attachmentName = portalV2Esc_(safePayload.attachment_name || '');
  var attachmentType = portalV2Esc_(safePayload.attachment_type || '');
  var attachmentSize = portalV2Esc_(safePayload.attachment_size || '');
  var attachmentPresent = attachmentName || attachmentType || attachmentSize ? 'true' : 'false';
  var payloadJson = JSON.stringify(safePayload);
  var payloadBytes = String(payloadJson.length || 0);
  var row = [
    portalV2Now_(),
    portalV2Esc_(safePayload.timestamp_local || ''),
    portalV2RouteSubmissionType_(route),
    submissionId,
    String(meta && meta.triggerType || ''),
    portalV2Esc_(meta && meta.reason || ''),
    portalV2Esc_(meta && meta.reasonDetails !== undefined ? JSON.stringify(meta.reasonDetails) : ''),
    portalV2Esc_(meta && meta.honeypotField || ''),
    portalV2Esc_(meta && meta.honeypotValue || ''),
    portalV2Esc_(safePayload.concierge_track || ''),
    portalV2Esc_(safePayload.handler_tier || ''),
    portalV2Esc_(safePayload.name || ''),
    portalV2Esc_(email),
    portalV2Esc_(emailDomain),
    portalV2Esc_(safePayload.loc_country || ''),
    portalV2Esc_(safePayload.loc_state || ''),
    portalV2Esc_(safePayload.loc_city || ''),
    portalV2Esc_(safePayload.page_path || '/'),
    portalV2Esc_(safePayload.referrer || 'direct'),
    attachmentPresent,
    attachmentName,
    attachmentType,
    attachmentSize,
    PORTAL_V2_CONFIG.SOURCE,
    payloadBytes,
    portalV2Esc_(payloadJson)
  ];
  portalV2AppendNamed_(route, PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME, header, row);
}

function portalV2HoneypotHeader_() {
  return [
    'timestamp_utc',
    'timestamp_local',
    'submission_type',
    'submission_id',
    'trigger_type',
    'trigger_reason',
    'trigger_details',
    'honeypot_field',
    'honeypot_value',
    'concierge_track',
    'handler_tier',
    'name',
    'email',
    'email_domain',
    'loc_country',
    'loc_state',
    'loc_city',
    'page_path',
    'referrer',
    'attachment_present',
    'attachment_name',
    'attachment_type',
    'attachment_size',
    'source',
    'payload_bytes',
    'payload'
  ];
}

function portalV2AbuseGate_(route, payload, submissionId) {
  var debug = payload && String(payload._debug_burst || '') === '1';
  if (!portalV2DedupeOk_(route, payload, submissionId)) return false;
  if (!portalV2BurstGate_(route, payload)) return false;
  return true;
}

function portalV2DedupeOk_(route, payload, submissionId) {
  var sid = String(submissionId || '').trim();
  if (!sid) return true;
  var ttl = Number(PORTAL_V2_CONFIG.DEDUPE_SECONDS || 3600);
  if (!Number.isFinite(ttl) || ttl < 1) ttl = 3600;
  var cache = CacheService.getScriptCache();
  var key = 'portal_v2_sub_' + sid;
  var existing = cache.get(key);
  if (existing) {
    portalV2LogAbuse_(route, payload, 'duplicate_submission', { submission_id: sid });
    return false;
  }
  cache.put(key, '1', ttl);
  return true;
}

function portalV2BurstGate_(route, payload) {
  var globalMax = Number(PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_MAX || 0);
  var trackMax = Number(PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_MAX || 0);
  var globalWindow = Number(PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_WINDOW_SECONDS || 0);
  var trackWindow = Number(PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_WINDOW_SECONDS || 0);
  if (!Number.isFinite(globalMax) || globalMax < 0) globalMax = 0;
  if (!Number.isFinite(trackMax) || trackMax < 0) trackMax = 0;
  if (!Number.isFinite(globalWindow) || globalWindow <= 0) globalWindow = 10;
  if (!Number.isFinite(trackWindow) || trackWindow <= 0) trackWindow = 10;
  if (globalMax <= 0 && trackMax <= 0) return true;

  var lock = LockService.getScriptLock();
  var hasLock = false;
  try {
    lock.waitLock(2000);
    hasLock = true;
  } catch (err) {
    portalV2LogAbuse_(route, payload, 'rate_limit_lock', { error: 'lock_failed' });
    return false;
  }

  try {
    var sheet = portalV2BurstSheet_();
    var state = portalV2BurstRead_(sheet);

    var nowMs = new Date().getTime();
    var routeKey = String(route || 'unknown');
    var trackCounts = state.trackCounts || {};
    if (typeof trackCounts !== 'object' || trackCounts === null) trackCounts = {};

    var globalStart = Number(state.globalWindowStartMs || 0);
    var globalCount = Number(state.globalCount || 0);
    if (!Number.isFinite(globalCount) || globalCount < 0) globalCount = 0;
    if (!Number.isFinite(globalStart) || globalStart <= 0 || Number(state.globalWindow) !== globalWindow) {
      globalStart = 0;
      globalCount = 0;
    }
    if (!globalStart || (nowMs - globalStart) >= (globalWindow * 1000)) {
      globalStart = nowMs;
      globalCount = 0;
    }

    var trackStart = Number(state.trackWindowStartMs || 0);
    var trackCount = Number(trackCounts[routeKey] || 0);
    if (!Number.isFinite(trackCount) || trackCount < 0) trackCount = 0;
    if (!Number.isFinite(trackStart) || trackStart <= 0 || Number(state.trackWindow) !== trackWindow) {
      trackStart = 0;
      trackCounts = {};
      trackCount = 0;
    }
    if (!trackStart || (nowMs - trackStart) >= (trackWindow * 1000)) {
      trackStart = nowMs;
      trackCounts = {};
      trackCount = 0;
    }

    var blockedReason = '';
    if (globalMax > 0 && globalCount >= globalMax) blockedReason = 'rate_limit_global';
    if (!blockedReason && trackMax > 0 && trackCount >= trackMax) blockedReason = 'rate_limit_track';

    if (!blockedReason) {
      if (globalMax > 0) globalCount += 1;
      if (trackMax > 0) {
        trackCount += 1;
        trackCounts[routeKey] = trackCount;
      }
    } else {
      if (blockedReason === 'rate_limit_global') {
        portalV2LogAbuse_(route, payload, blockedReason, { window_start_ms: globalStart, max: globalMax, window_seconds: globalWindow });
      } else {
        portalV2LogAbuse_(route, payload, blockedReason, { window_start_ms: trackStart, max: trackMax, window_seconds: trackWindow, route: routeKey });
      }
    }

    portalV2BurstWrite_(sheet, {
      globalWindowStartMs: globalStart,
      globalWindow: globalWindow,
      globalCount: globalCount,
      trackWindowStartMs: trackStart,
      trackWindow: trackWindow,
      trackCounts: trackCounts
    });

    return !blockedReason;
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

function portalV2RateLimit_(email, route, payload, submissionId) {
  var key = 'portal_v2_rl_' + String(email || '').toLowerCase();
  var ttl = Number(PORTAL_V2_CONFIG.RATE_LIMIT_SECONDS || 45);
  if (!Number.isFinite(ttl) || ttl < 1) ttl = 45;

  // Use cache to avoid unbounded growth in Script Properties.
  var cache = CacheService.getScriptCache();
  var existing = cache.get(key);
  if (existing) {
    portalV2LogAbuse_(route, payload, 'rate_limit_email', { email: String(email || ''), submission_id: submissionId });
    return false;
  }
  cache.put(key, '1', ttl);
  return true;
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
  } else if (header && header.length) {
    var current = sheet.getRange(1, 1, 1, header.length).getValues()[0];
    var mismatch = false;
    for (var i = 0; i < header.length; i++) {
      if (String(current[i] || '') !== String(header[i] || '')) {
        mismatch = true;
        break;
      }
    }
    if (mismatch) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }
  }
  sheet.appendRow(row);
}

function portalV2BurstSheet_() {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  var ss = SpreadsheetApp.openById(sid);
  var name = String(PORTAL_V2_CONFIG.BURST_SHEET_NAME || 'portal_v2_burst_state').trim() || 'portal_v2_burst_state';
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var header = portalV2BurstHeader_();
  if (!portalV2HeaderMatches_(sheet, header)) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.getRange(2, 1, 1, header.length).setValues([portalV2BurstRowDefaults_()]);
  } else if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, 1, header.length).setValues([portalV2BurstRowDefaults_()]);
  }
  return sheet;
}

function portalV2BurstHeader_() {
  return [
    'updated_utc',
    'global_window_start_ms',
    'global_window_seconds',
    'global_count',
    'track_window_start_ms',
    'track_window_seconds',
    'track_counts_json'
  ];
}

function portalV2BurstRowDefaults_() {
  return [portalV2Now_(), 0, 0, 0, 0, 0, '{}'];
}

function portalV2BurstRead_(sheet) {
  var header = portalV2BurstHeader_();
  var row = sheet.getRange(2, 1, 1, header.length).getValues()[0];
  var trackJson = String(row[6] || '').trim();
  var trackCounts = {};
  if (trackJson) {
    try { trackCounts = JSON.parse(trackJson) || {}; } catch (e) { trackCounts = {}; }
  }
  return {
    globalWindowStartMs: Number(row[1] || 0),
    globalWindow: Number(row[2] || 0),
    globalCount: Number(row[3] || 0),
    trackWindowStartMs: Number(row[4] || 0),
    trackWindow: Number(row[5] || 0),
    trackCounts: trackCounts
  };
}

function portalV2BurstWrite_(sheet, state) {
  var header = portalV2BurstHeader_();
  var trackJson = '{}';
  try { trackJson = JSON.stringify(state.trackCounts || {}); } catch (e) { trackJson = '{}'; }
  sheet.getRange(2, 1, 1, header.length).setValues([[
    portalV2Now_(),
    Number(state.globalWindowStartMs || 0),
    Number(state.globalWindow || 0),
    Number(state.globalCount || 0),
    Number(state.trackWindowStartMs || 0),
    Number(state.trackWindow || 0),
    trackJson
  ]]);
}

function portalV2ColumnsForRoute_(route) {
  return PORTAL_V2_COLUMNS;
}

function portalV2SheetTarget_(route) {
  var portalSid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!portalSid) throw new Error('Missing PORTAL_V2_DATABASE_ID');

  if (route === PORTAL_V2_ROUTES.INVESTMENT) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.INVESTMENT_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.PRESS) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.PRESS_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.EMPLOYMENT_SHEET_NAME };
  if (route === PORTAL_V2_ROUTES.INTERNSHIP) return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.INTERNSHIP_SHEET_NAME };
  return { spreadsheetId: portalSid, sheetName: PORTAL_V2_CONFIG.STAKEHOLDER_SHEET_NAME };
}

function portalV2UploadFolderByRoute_(route) {
  var portalFallback = String(PORTAL_V2_CONFIG.PORTAL_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.INVESTMENT) return String(PORTAL_V2_CONFIG.INVESTMENT_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.PRESS) return String(PORTAL_V2_CONFIG.PRESS_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT) return String(PORTAL_V2_CONFIG.EMPLOYMENT_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.INTERNSHIP) return String(PORTAL_V2_CONFIG.INTERNSHIP_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.STAKEHOLDER) return String(PORTAL_V2_CONFIG.STAKEHOLDER_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  return portalFallback;
}

function portalV2TemplateBaseline_() {
  if (typeof portalV2TemplateBaselineFromProps_ === 'function') {
    return portalV2TemplateBaselineFromProps_();
  }
  return null;
}

function portalV2TemplatePick_(route, type, payload) {
  var baseline = portalV2TemplateBaseline_();
  if (!baseline || !baseline.templates) return null;
  var templateKey = portalV2TemplateKey_(route, payload);
  var routeNode = baseline.templates[templateKey] || baseline.templates[route];
  if (!routeNode) return null;
  var tmpl = routeNode[type];
  if (!tmpl) return null;
  return tmpl;
}

function portalV2TemplateRender_(text, data) {
  var raw = String(text || '');
  return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_, token) {
    var key = String(token || '').trim();
    if (data && Object.prototype.hasOwnProperty.call(data, key)) return String(data[key]);
    return '';
  });
}

function portalV2TemplateData_(route, payload, submissionId, email, receivedUtc) {
  var safePayload = payload || {};
  var formSubmittedTitle = portalV2FormSubmittedTitle_(route, safePayload);
  var submittedFieldsBlock = portalV2SubmittedFieldsBlock_(route, safePayload, formSubmittedTitle);
  return {
    name: String(safePayload.name || '').trim() || 'there',
    route: String(route || ''),
    submission_id: String(submissionId || ''),
    received_utc: String(receivedUtc || ''),
    received_local: portalV2ReceivedLocal_(safePayload, receivedUtc),
    received_texas: portalV2FormatInTimeZone_(receivedUtc, 'America/Chicago'),
    email: String(email || ''),
    concierge_track: String(safePayload.concierge_track || ''),
    handler_tier: String(safePayload.handler_tier || ''),
    form_submitted_title: formSubmittedTitle,
    form_submitted_label: formSubmittedTitle,
    submitted_fields_block: submittedFieldsBlock,
    // Backward-compatible alias for older templates.
    submitted_fields_row: submittedFieldsBlock
  };
}

function portalV2ReceivedLocal_(payload, receivedUtc) {
  var local = String(payload && payload.timestamp_local || '').trim();
  if (local) return local;
  var scriptTz = '';
  try { scriptTz = Session.getScriptTimeZone() || ''; } catch (ignore) {}
  if (!scriptTz) scriptTz = 'Etc/UTC';
  return portalV2FormatInTimeZone_(receivedUtc, scriptTz);
}

function portalV2FormatInTimeZone_(isoOrDate, timeZoneId) {
  var tz = String(timeZoneId || '').trim() || 'Etc/UTC';
  try {
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm:ss z");
  } catch (err) {
    return String(isoOrDate || '');
  }
}

function portalV2FormSubmittedTitle_(route, payload) {
  var safeRoute = String(route || '').trim().toLowerCase();
  var track = String(payload && payload.concierge_track || '').trim().toLowerCase();
  if (safeRoute === PORTAL_V2_ROUTES.STAKEHOLDER) {
    if (track === 'government') return 'REGIONAL & GOVERNMENT AUTHORITY';
    if (track === 'education') return 'EDUCATIONAL LEADERSHIP & INSTRUCTION';
    if (track === 'private-sector') return 'PRIVATE SECTOR & INDUSTRY LEADERSHIP';
    if (track === 'small-business') return 'SMALL BUSINESS & LOCAL COMMERCE';
    if (track === 'professional') return 'PROFESSIONAL & TECHNICAL PERSPECTIVE';
    if (track === 'student') return 'STUDENT & COMMUNITY PERSPECTIVE';
    return 'STAKEHOLDER PERSPECTIVE';
  }
  if (safeRoute === PORTAL_V2_ROUTES.INVESTMENT) return 'INVESTMENT INQUIRY';
  if (safeRoute === PORTAL_V2_ROUTES.PRESS) return 'PRESS INQUIRY';
  if (safeRoute === PORTAL_V2_ROUTES.EMPLOYMENT) return 'EMPLOYMENT INQUIRY';
  if (safeRoute === PORTAL_V2_ROUTES.INTERNSHIP) return 'INTERNSHIP INQUIRY';
  return String(route || '').trim().toUpperCase() || 'TSI SUBMISSION';
}

function portalV2TemplateFieldValue_(value) {
  var next = String(value === undefined || value === null ? '' : value).trim();
  if (!next) return '';
  var low = next.toLowerCase();
  if (low === String(PORTAL_V2_NOT_VISIBLE).toLowerCase()) return '';
  if (low === String(PORTAL_V2_NO_RESPONSE).toLowerCase()) return '';
  // Keep values email-friendly while preserving meaning.
  return next.replace(/\r\n/g, '\n').replace(/\n+/g, ' / ');
}

function portalV2SubmittedFieldsBlock_(route, payload, formSubmittedTitle) {
  var safePayload = payload || {};
  var visibility = portalV2RouteVisibility_(route, safePayload.handler_tier || '');
  var lines = [];
  var add = function (label, value) {
    var next = portalV2TemplateFieldValue_(value);
    if (!next) return;
    lines.push(String(label || '').trim() + ': ' + next);
  };

  add('Perspective Selected', formSubmittedTitle);
  add('Name', safePayload.name);
  add('Email', safePayload.email);
  if (visibility.org) add('Organization', safePayload.org);
  if (visibility.role) add('Role', safePayload.role);
  add('City', safePayload.loc_city);
  if (visibility.locState) add('State/Region', safePayload.loc_state);
  add('Country', safePayload.loc_country);
  if (visibility.focus) add('Focus', safePayload.focus);

  if (visibility.investment) {
    add('Investment Stage', safePayload.investment_stage);
    add('Investment Check Range', safePayload.investment_check_range);
    add('Investment Geography', safePayload.investment_geography);
    add('Investment Focus', safePayload.investment_focus);
    add('Investment Timeline', safePayload.investment_timeline);
  }

  if (visibility.press) {
    add('Press Outlet', safePayload.press_outlet);
    add('Press Role', safePayload.press_role);
    add('Press Deadline', safePayload.press_deadline);
    add('Press Topic', safePayload.press_topic);
    add('Press Format', safePayload.press_format);
  }

  if (visibility.employment) {
    add('Employment Role Interest', safePayload.employment_role_interest);
    add('Employment Timeline', safePayload.employment_timeline);
    add('Employment Location Preference', safePayload.employment_location_pref);
  }

  if (visibility.internship) {
    add('School', safePayload.intern_school);
    add('Program', safePayload.intern_program);
    add('Graduation Date', safePayload.intern_grad_date);
    add('Internship Track', safePayload.intern_track);
    add('Internship Mode', safePayload.intern_mode);
    add('Hours Per Week', safePayload.intern_hours_per_week);
    add('Start Date', safePayload.intern_start_date);
    add('Portfolio URL', safePayload.intern_portfolio_url);
  }

  add('Message', safePayload.message);
  add('Attachment Name', safePayload.attachment_name);
  add('Attachment Type', safePayload.attachment_type);
  add('Attachment Size', safePayload.attachment_size);
  add('Attachment URL', safePayload.attachment_url);
  add('Attachment Status', safePayload.attachment_status);

  if (!lines.length) return 'No additional submitted fields.';
  return lines.join('\n');
}

function portalV2TemplateKey_(route, payload) {
  if (route === PORTAL_V2_ROUTES.STAKEHOLDER) {
    var track = String(payload && payload.concierge_track || '').trim().toLowerCase();
    if (track) return track;
  }
  return String(route || '').trim().toLowerCase();
}

function portalV2TemplateDebug_(route, type) {
  var safeRoute = String(route || '').trim().toLowerCase();
  var safeType = String(type || '').trim().toLowerCase();
  var baseline = portalV2TemplateBaseline_();
  var tmpl = portalV2TemplatePick_(safeRoute, safeType);
  return {
    ok: true,
    route: safeRoute,
    type: safeType,
    has_baseline: !!baseline,
    baseline_version: baseline && baseline.version ? baseline.version : '',
    baseline_promoted_at_utc: baseline && baseline.promoted_at_utc ? baseline.promoted_at_utc : '',
    template_found: !!tmpl,
    template_enabled: tmpl && typeof tmpl.enabled === 'boolean' ? tmpl.enabled : null,
    subject: tmpl && tmpl.subject ? tmpl.subject : '',
    body: tmpl && tmpl.body ? tmpl.body : ''
  };
}

// Wrapper for Apps Script UI (functions with trailing underscore don't appear in dropdown).
function portalV2TemplateDebug(route, type) {
  return portalV2TemplateDebug_(route, type);
}

function portalV2TemplateDebugLog(route, type) {
  var result = portalV2TemplateDebug_(route, type);
  Logger.log(JSON.stringify(result));
  return result;
}

function portalV2TemplateDebugLogEmploymentAdmin() {
  return portalV2TemplateDebugLog('employment', 'admin_notify');
}

function portalV2TryAutoReply_(route, payload, email, submissionId) {
  try {
    if (!PORTAL_V2_CONFIG.AUTO_REPLY_ENABLED) return;
    if (!portalV2AutoReplyEnabledForRoute_(route)) return;
    if (!portalV2EmailOk_(email)) return;

    var receivedUtc = portalV2Now_();
    var data = portalV2TemplateData_(route, payload, submissionId, email, receivedUtc);
    var tmpl = portalV2TemplatePick_(route, 'auto_reply', payload);
    if (tmpl && tmpl.enabled === false) return;

    var subject;
    var body;
    var fallbackReasons = [];
    if (tmpl && tmpl.subject && tmpl.body) {
      subject = portalV2TemplateRender_(tmpl.subject, data);
      body = portalV2TemplateRender_(tmpl.body, data);
    } else {
      fallbackReasons.push('template_fallback:auto_reply_template_missing_or_incomplete');
      subject = String(PORTAL_V2_CONFIG.AUTO_REPLY_SUBJECT_PREFIX || 'TSI Intake Confirmation') + ': ' + route;
      body = [
        'Hello ' + data.name + ',',
        '',
        'We received your submission and our team will review it.',
        '',
        'Route: ' + route,
        'Submission ID: ' + String(submissionId || ''),
        'Received (UTC): ' + receivedUtc,
        '',
        String(PORTAL_V2_CONFIG.AUTO_REPLY_SIGNATURE || 'TSI Intake Team')
      ].join('\n');
    }

    portalV2SendMail_(route, 'auto_reply', email, subject, body, submissionId, fallbackReasons);
  } catch (err) {
    console.error('portal v2 auto-reply failed: ' + err);
  }
}

function portalV2AutoReplyEnabledForRoute_(route) {
  var master = !!PORTAL_V2_CONFIG.AUTO_REPLY_ENABLED;
  if (!master) return false;
  var override = null;
  if (route === PORTAL_V2_ROUTES.STAKEHOLDER) override = portalV2AutoReplyOverride_('PORTAL_V2_AUTO_REPLY_STAKEHOLDER_ENABLED');
  else if (route === PORTAL_V2_ROUTES.INVESTMENT) override = portalV2AutoReplyOverride_('PORTAL_V2_AUTO_REPLY_PORTAL_INVESTMENT_ENABLED');
  else if (route === PORTAL_V2_ROUTES.PRESS) override = portalV2AutoReplyOverride_('PORTAL_V2_AUTO_REPLY_PORTAL_PRESS_ENABLED');
  else if (route === PORTAL_V2_ROUTES.EMPLOYMENT) override = portalV2AutoReplyOverride_('PORTAL_V2_AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED');
  else if (route === PORTAL_V2_ROUTES.INTERNSHIP) override = portalV2AutoReplyOverride_('PORTAL_V2_AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED');
  if (override === null) return true;
  return override;
}

function portalV2AutoReplyOverride_(key) {
  var raw = portalV2ReadPropRaw_(key);
  if (raw === null || raw === '') return null;
  var val = String(raw || '').toLowerCase().trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

function portalV2NotifyAdmin_(route, email, submissionId, attachment, payload) {
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  if (!admin) return;
  var receivedUtc = portalV2Now_();
  var data = portalV2TemplateData_(route, payload, submissionId, email, receivedUtc);
  var tmpl = portalV2TemplatePick_(route, 'admin_notify', payload);
  if (tmpl && tmpl.enabled === false) return;

  var subject;
  var body;
  var fallbackReasons = [];
  if (tmpl && tmpl.subject && tmpl.body) {
    subject = portalV2TemplateRender_(tmpl.subject, data);
    body = portalV2TemplateRender_(tmpl.body, data);
  } else {
    fallbackReasons.push('template_fallback:admin_notify_template_missing_or_incomplete');
    subject = 'TSI intake (v2): ' + route + ' - ' + email;
    body = 'submission_id: ' + submissionId + '\nattachment_status: ' + (attachment && attachment.status || 'none');
  }
  portalV2SendMail_(route, 'admin_notify', admin, subject, body, submissionId, fallbackReasons);
}

function portalV2NormalizeFallbackReasons_(reasons) {
  var input = Array.isArray(reasons) ? reasons : [];
  var out = [];
  var seen = {};
  for (var i = 0; i < input.length; i += 1) {
    var reason = String(input[i] || '').replace(/\s+/g, ' ').trim();
    if (!reason || seen[reason]) continue;
    seen[reason] = true;
    out.push(reason);
  }
  return out;
}

function portalV2AppendFallbackReason_(reasons, reason) {
  var next = portalV2NormalizeFallbackReasons_(reasons);
  var token = String(reason || '').replace(/\s+/g, ' ').trim();
  if (!token) return next;
  for (var i = 0; i < next.length; i += 1) {
    if (next[i] === token) return next;
  }
  next.push(token);
  return next;
}

function portalV2AnnotateFallbackMessage_(subject, body, reasons) {
  var normalized = portalV2NormalizeFallbackReasons_(reasons);
  var rawSubject = String(subject || '').trim();
  var rawBody = String(body || '');
  if (!normalized.length) return { subject: rawSubject, body: rawBody, reasons: [] };

  var taggedSubject = rawSubject;
  if (!/^\[fallback\]\s/i.test(taggedSubject)) taggedSubject = '[Fallback] ' + taggedSubject;

  var note = [
    '',
    '[[FALLBACK_NOTICE]]',
    'Triggers: ' + normalized.join(' | ')
  ].join('\n');
  return { subject: taggedSubject, body: rawBody + note, reasons: normalized };
}

function portalV2IsInternalMailType_(mailType) {
  var kind = String(mailType || '').trim().toLowerCase();
  return kind === 'admin_notify' || kind === 'fallback_notice';
}

function portalV2InternalDomains_() {
  var csv = String(PORTAL_V2_CONFIG.INTERNAL_EMAIL_DOMAINS_CSV || '').trim();
  if (!csv) return ['texasskillsinitiative.org', 'texasskillsinitiative.com'];
  var parts = csv.split(',');
  var out = [];
  for (var i = 0; i < parts.length; i += 1) {
    var d = String(parts[i] || '').trim().toLowerCase();
    if (!d) continue;
    out.push(d);
  }
  if (!out.length) out.push('texasskillsinitiative.org', 'texasskillsinitiative.com');
  return out;
}

function portalV2IsInternalEmailAddress_(email) {
  var value = String(email || '').trim().toLowerCase();
  var at = value.lastIndexOf('@');
  if (at < 0) return false;
  var domain = value.slice(at + 1);
  var domains = portalV2InternalDomains_();
  for (var i = 0; i < domains.length; i += 1) {
    if (domain === domains[i]) return true;
  }
  return false;
}

function portalV2ZeptoFromContext_(route) {
  var r = String(route || '').trim().toLowerCase();
  var routeFrom = '';
  var routeKey = '';
  if (r === PORTAL_V2_ROUTES.STAKEHOLDER) {
    routeFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_STAKEHOLDER || '').trim();
    routeKey = 'PORTAL_V2_ZEPTO_FROM_STAKEHOLDER';
  } else if (r === PORTAL_V2_ROUTES.INVESTMENT) {
    routeFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_INVESTMENT || '').trim();
    routeKey = 'PORTAL_V2_ZEPTO_FROM_INVESTMENT';
  } else if (r === PORTAL_V2_ROUTES.PRESS) {
    routeFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_PRESS || '').trim();
    routeKey = 'PORTAL_V2_ZEPTO_FROM_PRESS';
  } else if (r === PORTAL_V2_ROUTES.EMPLOYMENT) {
    routeFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_EMPLOYMENT || '').trim();
    routeKey = 'PORTAL_V2_ZEPTO_FROM_EMPLOYMENT';
  } else if (r === PORTAL_V2_ROUTES.INTERNSHIP) {
    routeFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_INTERNSHIP || '').trim();
    routeKey = 'PORTAL_V2_ZEPTO_FROM_INTERNSHIP';
  }
  if (routeFrom) return { from: routeFrom, reason: '' };

  var defaultFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_DEFAULT || '').trim();
  if (defaultFrom) {
    var defaultRaw = portalV2ReadPropRaw_('PORTAL_V2_ZEPTO_FROM_DEFAULT');
    var legacyRaw = portalV2ReadPropRaw_('PORTAL_V2_ZEPTO_FROM');
    if (routeKey) return { from: defaultFrom, reason: 'sender_fallback:' + routeKey + ' missing; using default sender' };
    if (!defaultRaw && !legacyRaw) return { from: defaultFrom, reason: 'sender_fallback:default sender property missing; using built-in sender' };
    return { from: defaultFrom, reason: '' };
  }
  return { from: '', reason: 'sender_fallback:no sender configured' };
}

function portalV2SendMail_(route, mailType, toAddress, subject, body, submissionId, fallbackReasons) {
  var to = String(toAddress || '').trim();
  if (!to) return false;
  var reasons = portalV2NormalizeFallbackReasons_(fallbackReasons);
  var fromCtx = portalV2ZeptoFromContext_(route);
  var from = String(fromCtx.from || '').trim();
  if (fromCtx.reason) reasons = portalV2AppendFallbackReason_(reasons, fromCtx.reason);
  var primaryMail = portalV2AnnotateFallbackMessage_(subject, body, reasons);
  var replyTo = String(PORTAL_V2_CONFIG.ZEPTO_REPLY_TO_DEFAULT || '').trim();
  var result = portalV2ZeptoSendEmail_({
    route: route,
    mailType: mailType,
    to: to,
    from: from,
    replyTo: replyTo,
    subject: primaryMail.subject,
    body: primaryMail.body,
    submissionId: submissionId
  });
  if (result && result.ok) return true;

  if (PORTAL_V2_CONFIG.MAIL_FALLBACK_ENABLED) {
    var providerReasons = portalV2AppendFallbackReason_(reasons, 'provider_fallback:zeptomail_send_failed');
    if (result && result.error) {
      var detail = String(result.error || '').replace(/\s+/g, ' ').trim();
      if (detail) providerReasons = portalV2AppendFallbackReason_(providerReasons, 'provider_error:' + detail);
    }
    var fallbackMail = portalV2AnnotateFallbackMessage_(subject, body, providerReasons);
    try {
      MailApp.sendEmail(to, fallbackMail.subject, fallbackMail.body);
      portalV2MailLog_({
        route: route,
        mailType: mailType,
        to: to,
        from: from || '',
        subject: fallbackMail.subject,
        status: 'sent',
        provider: 'mailapp-fallback',
        error: '',
        submissionId: submissionId
      });
      portalV2NotifyFallback_(route, mailType, to, submissionId, result, subject, fallbackMail.reasons);
      return true;
    } catch (err) {
      portalV2MailLog_({
        route: route,
        mailType: mailType,
        to: to,
        from: from || '',
        subject: fallbackMail.subject,
        status: 'error',
        provider: 'mailapp-fallback',
        error: String(err || ''),
        submissionId: submissionId
      });
      return false;
    }
  }
  return false;
}

function portalV2NotifyFallback_(route, mailType, to, submissionId, zeptoResult, originalSubject, reasons) {
  if (!portalV2IsInternalMailType_(mailType)) return;
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  if (!admin) return;
  if (!portalV2IsInternalEmailAddress_(admin)) {
    portalV2MailLog_({
      route: route,
      mailType: 'fallback_notice_blocked',
      to: admin,
      from: '',
      subject: String(originalSubject || 'MailApp fallback used'),
      status: 'blocked',
      provider: 'mailapp-fallback',
      error: 'admin_notify_not_internal',
      submissionId: submissionId
    });
    return;
  }
  var subject = '[Fallback] ' + String(originalSubject || 'MailApp fallback used');
  var errDetail = zeptoResult && zeptoResult.error ? String(zeptoResult.error) : '';
  var normalizedReasons = portalV2NormalizeFallbackReasons_(reasons);
  var body = [
    'route: ' + String(route || ''),
    'mail_type: ' + String(mailType || ''),
    'to: ' + String(to || ''),
    'submission_id: ' + String(submissionId || ''),
    'note: ZeptoMail send failed; fallback used.',
    'check: mail log for Zepto error details; verify token, agent alias, and from address.',
    'zepto_error: ' + errDetail,
    'triggers: ' + (normalizedReasons.length ? normalizedReasons.join(' | ') : 'provider_fallback:zeptomail_send_failed'),
    '',
    '[[FALLBACK_METADATA]]',
    'fallback_type: mailapp-fallback',
    'issue: ' + errDetail
  ].join('\n');
  try {
    MailApp.sendEmail(admin, subject, body);
    portalV2MailLog_({
      route: route,
      mailType: 'fallback_notice',
      to: admin,
      from: '',
      subject: subject,
      status: 'sent',
      provider: 'mailapp-fallback',
      error: '',
      submissionId: submissionId
    });
  } catch (err) {
    portalV2MailLog_({
      route: route,
      mailType: 'fallback_notice',
      to: admin,
      from: '',
      subject: subject,
      status: 'error',
      provider: 'mailapp-fallback',
      error: String(err || ''),
      submissionId: submissionId
    });
  }
}

function portalV2InternalUsernameHeader_() {
  return [
    'timestamp_utc',
    'timestamp_local',
    'tsi_username',
    'page_path',
    'referrer',
    'submission_id'
  ];
}

function portalV2LogInternalUsername_(payload) {
  try {
    var username = String(payload && payload.tsi_username || '').trim();
    if (!username) return;
    var sheetName = String(PORTAL_V2_CONFIG.INTERNAL_USERNAME_SHEET_NAME || '').trim();
    if (!sheetName) return;
    var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
    if (!sid) return;

    var row = [
      portalV2Now_(),
      String(payload && payload.timestamp_local || ''),
      username,
      String(payload && payload.page_path || ''),
      String(payload && payload.referrer || ''),
      String(payload && payload.submission_id || Utilities.getUuid())
    ];

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var ss = SpreadsheetApp.openById(sid);
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      if (sheet.getLastRow() === 0) {
        var header = portalV2InternalUsernameHeader_();
        sheet.getRange(1, 1, 1, header.length).setValues([header]);
      }
      sheet.appendRow(row);
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  } catch (err) {
    console.error('portal v2 internal username log failed: ' + err);
  }
}

function portalV2ZeptoFromForRoute_(route) {
  if (route === PORTAL_V2_ROUTES.STAKEHOLDER && PORTAL_V2_CONFIG.ZEPTO_FROM_STAKEHOLDER) return PORTAL_V2_CONFIG.ZEPTO_FROM_STAKEHOLDER;
  if (route === PORTAL_V2_ROUTES.INVESTMENT && PORTAL_V2_CONFIG.ZEPTO_FROM_INVESTMENT) return PORTAL_V2_CONFIG.ZEPTO_FROM_INVESTMENT;
  if (route === PORTAL_V2_ROUTES.PRESS && PORTAL_V2_CONFIG.ZEPTO_FROM_PRESS) return PORTAL_V2_CONFIG.ZEPTO_FROM_PRESS;
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT && PORTAL_V2_CONFIG.ZEPTO_FROM_EMPLOYMENT) return PORTAL_V2_CONFIG.ZEPTO_FROM_EMPLOYMENT;
  if (route === PORTAL_V2_ROUTES.INTERNSHIP && PORTAL_V2_CONFIG.ZEPTO_FROM_INTERNSHIP) return PORTAL_V2_CONFIG.ZEPTO_FROM_INTERNSHIP;
  return String(PORTAL_V2_CONFIG.ZEPTO_FROM_DEFAULT || '').trim();
}

function portalV2ZeptoSendEmail_(opts) {
  var token = String(PORTAL_V2_CONFIG.ZEPTO_TOKEN || '').trim();
  var agent = String(PORTAL_V2_CONFIG.ZEPTO_AGENT_ALIAS || '').trim();
  var from = String(opts && opts.from || '').trim();
  var to = String(opts && opts.to || '').trim();
  var subject = String(opts && opts.subject || '').trim();
  var body = String(opts && opts.body || '');
  var replyTo = String(opts && opts.replyTo || '').trim();
  var route = String(opts && opts.route || '').trim();
  var mailType = String(opts && opts.mailType || '').trim();
  var submissionId = String(opts && opts.submissionId || '').trim();

  if (!token || !from || !to) {
    portalV2MailLog_({
      route: route,
      mailType: mailType,
      to: to,
      from: from,
      subject: subject,
      status: 'error',
      provider: 'zeptomail',
      error: 'missing_zepto_config',
      submissionId: submissionId
    });
    return { ok: false, error: 'missing_zepto_config' };
  }

  var htmlBody = String(body || '').replace(/\n/g, '<br>');
  var payload = {
    from: { address: from },
    to: [{ email_address: { address: to } }],
    subject: subject,
    textbody: body,
    htmlbody: htmlBody
  };
  if (replyTo) payload.reply_to = [{ address: replyTo }];
  if (submissionId) payload.client_reference = submissionId;

  var base = String(PORTAL_V2_CONFIG.ZEPTO_API_BASE || 'https://api.zeptomail.com').replace(/\/+$/, '');
  var url = base + '/v1.1/email';
  var options = {
    method: 'post',
    muteHttpExceptions: true,
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { Authorization: 'Zoho-enczapikey ' + token, Accept: 'application/json' }
  };

  try {
    var resp = UrlFetchApp.fetch(url, options);
    var code = resp.getResponseCode();
    var ok = code >= 200 && code < 300;
    var text = '';
    var headers = {};
    try { text = resp.getContentText('UTF-8'); } catch (ignore) {}
    try { headers = resp.getAllHeaders() || {}; } catch (ignore2) {}
    var detail = ok ? '' : ('code=' + code + '; headers=' + JSON.stringify(headers) + '; body=' + text);
    portalV2MailLog_({
      route: route,
      mailType: mailType,
      to: to,
      from: from,
      subject: subject,
      status: ok ? 'sent' : 'error',
      provider: 'zeptomail',
      error: ok ? '' : detail,
      submissionId: submissionId
    });
    return { ok: ok, status: code, error: ok ? '' : text };
  } catch (err) {
    portalV2MailLog_({
      route: route,
      mailType: mailType,
      to: to,
      from: from,
      subject: subject,
      status: 'error',
      provider: 'zeptomail',
      error: String(err || ''),
      submissionId: submissionId
    });
    return { ok: false, error: String(err || '') };
  }
}

function portalV2MailLog_(entry) {
  var header = [
    'timestamp_utc',
    'route',
    'mail_type',
    'to',
    'from',
    'subject',
    'status',
    'provider',
    'error',
    'submission_id'
  ];
  var row = [
    portalV2Now_(),
    String(entry.route || ''),
    String(entry.mailType || ''),
    String(entry.to || ''),
    String(entry.from || ''),
    String(entry.subject || ''),
    String(entry.status || ''),
    String(entry.provider || ''),
    String(entry.error || ''),
    String(entry.submissionId || '')
  ];
  portalV2AppendNamed_(PORTAL_V2_ROUTES.STAKEHOLDER, PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME, header, row);
}

// Run manually in Apps Script to authorize external requests (UrlFetchApp).
function portalV2AuthorizeExternalRequest_() {
  try {
    UrlFetchApp.fetch('https://api.zeptomail.com/', { method: 'get', muteHttpExceptions: true });
  } catch (err) {
    // Intentionally ignore; this function exists only to trigger the auth prompt.
  }
  return { ok: true };
}

// Wrapper for Apps Script UI dropdown (no trailing underscore).
function portalV2AuthorizeExternalRequest() {
  return portalV2AuthorizeExternalRequest_();
}

// Manual ZeptoMail debug sender to capture full error details in mail log.
function portalV2ZeptoDebugSend() {
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  var from = portalV2ZeptoFromForRoute_(PORTAL_V2_ROUTES.STAKEHOLDER);
  if (!admin || !from) return { ok: false, error: 'missing_admin_or_from' };
  var subject = 'Zepto debug';
  var body = 'Zepto debug send ' + portalV2Now_();
  return portalV2ZeptoSendEmail_({
    route: 'debug',
    mailType: 'zepto_debug',
    to: admin,
    from: from,
    replyTo: '',
    subject: subject,
    body: body,
    submissionId: 'zepto-debug-' + new Date().getTime()
  });
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

  var honeyRoute = PORTAL_V2_ROUTES.INVESTMENT;
  var honeyTarget = portalV2SheetTarget_(honeyRoute);
  var honeySs = SpreadsheetApp.openById(honeyTarget.spreadsheetId);
  var honey = honeySs.getSheetByName(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
  if (!honey) honey = honeySs.insertSheet(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
    if (honey.getLastRow() === 0) {
      var honeyHeader = portalV2HoneypotHeader_();
      honey.getRange(1, 1, 1, honeyHeader.length).setValues([honeyHeader]);
    }

    portalV2InitInternalUsernameSheet_();

    return { ok: true, initialized_routes: routes.length };
  }

  function portalV2ResetSheets() {
  var routes = portalV2RouteTypes_();
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];
    var target = portalV2SheetTarget_(route);
    var ss = SpreadsheetApp.openById(target.spreadsheetId);
    var sheet = ss.getSheetByName(target.sheetName);
    if (!sheet) sheet = ss.insertSheet(target.sheetName);
    sheet.clearContents();
    sheet.getRange(1, 1, 1, portalV2ColumnsForRoute_(route).length).setValues([portalV2ColumnsForRoute_(route)]);
  }

  var honeyRoute = PORTAL_V2_ROUTES.INVESTMENT;
  var honeyTarget = portalV2SheetTarget_(honeyRoute);
  var honeySs = SpreadsheetApp.openById(honeyTarget.spreadsheetId);
  var honey = honeySs.getSheetByName(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
  if (!honey) honey = honeySs.insertSheet(PORTAL_V2_CONFIG.HONEYPOT_SHEET_NAME);
  honey.clearContents();
    var honeyHeader = portalV2HoneypotHeader_();
    honey.getRange(1, 1, 1, honeyHeader.length).setValues([honeyHeader]);

    portalV2InitInternalUsernameSheet_(true);

    return { ok: true, reset_routes: routes.length };
  }

  function portalV2InitInternalUsernameSheet_(clearFirst) {
    var sheetName = String(PORTAL_V2_CONFIG.INTERNAL_USERNAME_SHEET_NAME || '').trim();
    var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
    if (!sheetName || !sid) return;
    var ss = SpreadsheetApp.openById(sid);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    if (clearFirst) sheet.clearContents();
    if (sheet.getLastRow() === 0) {
      var header = portalV2InternalUsernameHeader_();
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }
  }

function portalV2RouteTypes_() {
  return [
    PORTAL_V2_ROUTES.STAKEHOLDER,
    PORTAL_V2_ROUTES.EMPLOYMENT,
    PORTAL_V2_ROUTES.INVESTMENT,
    PORTAL_V2_ROUTES.PRESS,
    PORTAL_V2_ROUTES.INTERNSHIP
  ];
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
