// TSI intake backend version marker: v3 Build 0018
var PORTAL_V2_INTERNAL_EVENT_TSI_USERNAME_CAPTURE = 'tsi_username_capture';

var PORTAL_V2_ROUTES = {
  GOVERNMENT: 'government',
  EDUCATION: 'education',
  PRIVATE_SECTOR: 'private-sector',
  SMALL_BUSINESS: 'small-business',
  PROFESSIONAL: 'professional',
  STUDENT: 'student',
  INVESTMENT: 'investment',
  PRESS: 'press',
  EMPLOYMENT: 'employment',
  INTERNSHIP: 'internship'
};

var PORTAL_V2_STAKEHOLDER_ROUTE_SET = {
  'government': true,
  'education': true,
  'private-sector': true,
  'small-business': true,
  'professional': true,
  'student': true
};

var PORTAL_V2_CANONICAL_ROUTE_SET = {
  'government': true,
  'education': true,
  'private-sector': true,
  'small-business': true,
  'professional': true,
  'student': true,
  'investment': true,
  'press': true,
  'employment': true,
  'internship': true
};

var PORTAL_V2_ROUTE_TO_ROUT = {
  'government': 'SGOV',
  'education': 'SEDU',
  'private-sector': 'SPVT',
  'small-business': 'SSML',
  'professional': 'SPRO',
  'student': 'SSTU',
  'investment': 'PINV',
  'press': 'PPRS',
  'employment': 'PEMP',
  'internship': 'PINT'
};

var PORTAL_V2_ROUT_TO_ROUTE = {
  'sgov': 'government',
  'sedu': 'education',
  'spvt': 'private-sector',
  'ssml': 'small-business',
  'spro': 'professional',
  'sstu': 'student',
  'pinv': 'investment',
  'pprs': 'press',
  'pemp': 'employment',
  'pint': 'internship'
};

var PORTAL_V2_ROUTE_NAMES = {
  'government': 'REGIONAL & GOVERNMENT AUTHORITY',
  'education': 'EDUCATIONAL LEADERSHIP & INSTRUCTION',
  'private-sector': 'PRIVATE SECTOR & INDUSTRY LEADERSHIP',
  'small-business': 'SMALL BUSINESS & LOCAL COMMERCE',
  'professional': 'PROFESSIONAL & TECHNICAL PERSPECTIVE',
  'student': 'STUDENT & COMMUNITY PERSPECTIVE',
  'investment': 'INVESTMENT INQUIRY',
  'press': 'PRESS INQUIRY',
  'employment': 'EMPLOYMENT INQUIRY',
  'internship': 'INTERNSHIP INQUIRY'
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
function doGet(e) {
  return portalV2Json_({
    ok: true,
    health: true,
    version: String(PORTAL_V2_CONFIG.VERSION || ''),
    build: String(PORTAL_V2_CONFIG.BUILD || '')
  });
}

function doPost(e) {
  try {
    var payload = portalV2Parse_(e);
    if (!payload) return portalV2Json_({ ok: false, error: 'invalid_input' });

    if (portalV2IsInternalUsernamePayload_(payload)) {
      portalV2LogInternalUsername_(payload);
      return portalV2Json_({ ok: true });
    }

    var route = portalV2ResolveRoute_(payload);
    if (!route) return portalV2Json_({ ok: false, error: 'invalid_input' });
    var isStakeholderRoute = portalV2IsStakeholderRoute_(route);
    var submissionId = portalV2Esc_(payload.submission_id || '') || Utilities.getUuid();
    var receivedUtc = portalV2Now_();
    payload.submission_id = submissionId;

    if (payload[PORTAL_V2_CONFIG.HONEYPOT_KEY]) {
      portalV2WriteHoneypot_(route, payload, submissionId);
      return portalV2Json_({ ok: true });
    }

    if (payload && String(payload._debug_burst || '') === '1') {
      portalV2LogBurstDebug_(route, payload, submissionId);
      return portalV2Json_({ ok: true, debug_burst: true });
    }

    var abuse = portalV2AbuseGate_(route, payload, submissionId);
    if (!abuse.ok) {
      return portalV2Json_({ ok: false, error: abuse.error });
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
      var pressDeadline = String(payload.pprs_deadline || '').trim();
      var pressDeadlineMode = String(payload.press_deadline_mode || '').toLowerCase().trim();
      var hasNoDeadlineFlag = pressDeadlineMode === 'no_deadline';
      if (!pressDeadline && !hasNoDeadlineFlag) return portalV2Json_({ ok: false, error: 'invalid_input' });
    }

    var emailGate = portalV2RateLimit_(email, route, payload, submissionId);
    if (!emailGate.ok) {
      return portalV2Json_({ ok: false, error: emailGate.error });
    }

    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (lockErr) {
      portalV2LogFailure_(route, payload, 'operational_failure', 'append_lock_timeout', { submission_id: submissionId }, submissionId);
      return portalV2Json_({ ok: false, error: 'temporarily_unavailable' });
    }
    var visibility = portalV2RouteVisibility_(route);
    var attachmentVisible = visibility.attachment || Boolean(payload.attachment_data);
    var attachment = attachmentVisible
      ? portalV2Attachment_(payload, route, submissionId)
      : portalV2NotVisibleAttachment_();
    if (attachment.error) {
      try { lock.releaseLock(); } catch (ignoreLock) {}
      return portalV2Json_({ ok: false, error: attachment.error });
    }

    var row = portalV2PortalRow_(payload, route, receivedUtc, email, city, country, message, attachment, submissionId, visibility);

    var appendMeta;
    try {
      try {
        appendMeta = portalV2Append_(route, row, submissionId, payload);
      } catch (appendErr) {
        portalV2LogFailure_(route, payload, 'operational_failure', 'append_failed', { submission_id: submissionId, error: String(appendErr || '') }, submissionId);
        return portalV2Json_({ ok: false, error: 'temporarily_unavailable' });
      }
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }

    portalV2NotifyAdmin_(route, email, submissionId, attachment, payload, receivedUtc);
    portalV2TryAutoReply_(route, payload, email, submissionId, receivedUtc);
    portalV2RefreshDashboardSafe_();

    return portalV2Json_({
      ok: true,
      mirror_ok: appendMeta && appendMeta.mirrorOk !== false
    });
  } catch (err) {
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
  var rawRout = String(payload && payload.rout || '').toLowerCase().trim();
  if (PORTAL_V2_ROUT_TO_ROUTE[rawRout]) return PORTAL_V2_ROUT_TO_ROUTE[rawRout];
  var rawRoute = String(payload && payload.route || '').toLowerCase().trim();
  if (PORTAL_V2_CANONICAL_ROUTE_SET[rawRoute]) return rawRoute;
  return '';
}

function portalV2IsStakeholderRoute_(route) {
  var rawRoute = String(route || '').trim().toLowerCase();
  return !!PORTAL_V2_STAKEHOLDER_ROUTE_SET[rawRoute];
}

function portalV2IsCanonicalRoute_(route) {
  return !!PORTAL_V2_CANONICAL_ROUTE_SET[String(route || '').trim().toLowerCase()];
}

function portalV2IsInternalUsernamePayload_(payload) {
  var safePayload = payload || {};
  var eventType = String(safePayload.internal_event || '').trim().toLowerCase();
  return Boolean(
    String(safePayload.tsi_username || '').trim()
    && eventType === PORTAL_V2_INTERNAL_EVENT_TSI_USERNAME_CAPTURE
  );
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

function portalV2RouteVisibility_(route) {
  var isStakeholder = portalV2IsStakeholderRoute_(route);
  var isInvestment = route === PORTAL_V2_ROUTES.INVESTMENT;
  var isPress = route === PORTAL_V2_ROUTES.PRESS;
  var isEmployment = route === PORTAL_V2_ROUTES.EMPLOYMENT;
  var isInternship = route === PORTAL_V2_ROUTES.INTERNSHIP;
  var stakeholderOrgRole = route === PORTAL_V2_ROUTES.GOVERNMENT
    || route === PORTAL_V2_ROUTES.EDUCATION
    || route === PORTAL_V2_ROUTES.PRIVATE_SECTOR
    || route === PORTAL_V2_ROUTES.SMALL_BUSINESS;
  var stakeholderFocus = route === PORTAL_V2_ROUTES.PROFESSIONAL
    || route === PORTAL_V2_ROUTES.STUDENT;

  return {
    org: isStakeholder ? stakeholderOrgRole : isEmployment,
    role: isStakeholder ? stakeholderOrgRole : isInvestment,
    focus: isStakeholder ? stakeholderFocus : false,
    locState: isStakeholder,
    investment: isInvestment,
    press: isPress,
    employment: isEmployment,
    internship: isInternship,
    attachment: !isStakeholder
  };
}

function portalV2PortalRow_(payload, route, receivedUtc, email, city, country, message, attachment, submissionId, visibility) {
  return [
    String(receivedUtc || portalV2Now_()),
    portalV2Esc_(payload.client_tz || ''),
    portalV2Esc_(payload.client_utc_offset_minutes || ''),
    portalV2RoutFromRoute_(route),
    portalV2Esc_(String(payload.name || '').trim()),
    portalV2Esc_(email),
    portalV2ValueOrNotVisible_(payload.org || '', visibility.org),
    portalV2ValueOrNotVisible_(payload.role || '', visibility.role),
    portalV2Esc_(city),
    portalV2EscOrNotVisible_(payload.loc_state || '', visibility.locState),
    portalV2Esc_(country),
    portalV2ValueOrNotVisible_(payload.focus || '', visibility.focus),

    portalV2ValueOrNotVisible_(payload.pinv_stage || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.pinv_check_range || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.pinv_geography || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.pinv_focus || '', visibility.investment, PORTAL_V2_CONFIG.MESSAGE_MAX_LENGTH),
    portalV2ValueOrNotVisible_(payload.pinv_timeline || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.pinv_investor_type || '', visibility.investment),
    portalV2ValueOrNotVisible_(payload.pinv_investor_type_other || '', visibility.investment),

    portalV2ValueOrNotVisible_(payload.pprs_outlet || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.pprs_role || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.pprs_deadline || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.pprs_topic || '', visibility.press),
    portalV2ValueOrNotVisible_(payload.pprs_format || '', visibility.press),

    portalV2ValueOrNotVisible_(payload.pemp_role_interest || '', visibility.employment),
    portalV2ValueOrNotVisible_(payload.pemp_timeline || '', visibility.employment),
    portalV2ValueOrNotVisible_(payload.pemp_location_pref || '', visibility.employment),

    portalV2ValueOrNotVisible_(payload.pint_school || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_program || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_grad_date || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_track || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_mode || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_hours_per_week || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_start_date || '', visibility.internship),
    portalV2ValueOrNotVisible_(payload.pint_portfolio_url || '', visibility.internship),

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

function portalV2WriteHoneypot_(route, payload, submissionId) {
  try {
    var honeyKey = PORTAL_V2_CONFIG.HONEYPOT_KEY;
    var honeyVal = payload ? payload[honeyKey] : '';
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    var failAttachment = portalV2FailAttachment_(nextPayload, route, submissionId || nextPayload.submission_id || '');
    nextPayload._honeypot_reason = 'honeypot_field_populated';
    nextPayload._honeypot_field = honeyKey;
    nextPayload._honeypot_value = String(honeyVal || '');
    nextPayload._honeypot_summary = "Honeypot field '" + String(honeyKey || '') + "' was populated.";
    portalV2AppendFail_(route, nextPayload, {
      category: 'abuse',
      triggerType: 'honeypot',
      reason: 'honeypot_field_populated',
      reasonDetails: '',
      honeypotField: honeyKey,
      honeypotValue: String(honeyVal || ''),
      attachmentCapture: failAttachment
    });
    portalV2NotifyFail_(route, nextPayload, submissionId, failAttachment, 'abuse', 'honeypot_field_populated', '');
    portalV2RefreshDashboardSafe_();
  } catch (e2) {
    console.error('portal v2 fail honeypot write failed: ' + e2);
  }
}

function portalV2LogFailure_(route, payload, category, reason, details, submissionId) {
  try {
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    var failAttachment = portalV2FailAttachment_(nextPayload, route, submissionId || nextPayload.submission_id || '');
    nextPayload._fail_category = String(category || 'operational_failure');
    nextPayload._fail_reason = String(reason || 'unknown');
    if (String(category || '') === 'abuse' || String(category || '') === 'policy_block') {
      nextPayload._abuse_reason = String(reason || 'unknown');
    }
    if (details !== undefined) nextPayload._abuse_details = details;
    portalV2AppendFail_(route, nextPayload, {
      category: String(category || 'operational_failure'),
      triggerType: String(category || 'operational_failure'),
      reason: String(reason || 'unknown'),
      reasonDetails: details,
      honeypotField: 'fail_reason',
      honeypotValue: String(reason || 'unknown'),
      attachmentCapture: failAttachment
    });
    portalV2NotifyFail_(route, nextPayload, submissionId || nextPayload.submission_id || '', failAttachment, category, reason, details);
  } catch (err) {
    console.error('portal v2 fail log failed: ' + err);
  }
}

function portalV2LogBurstDebug_(route, payload, submissionId) {
  try {
    var snapshot = portalV2BurstSnapshot_(route);
    var nextPayload = payload ? JSON.parse(JSON.stringify(payload)) : {};
    nextPayload.submission_id = submissionId || nextPayload.submission_id || Utilities.getUuid();
    nextPayload._debug_burst = '1';
    portalV2AppendFail_(route, nextPayload, {
      category: 'operational_failure',
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

function portalV2AppendFail_(route, payload, meta) {
  var header = portalV2FailHeader_();
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
  var capture = portalV2FailAttachmentMeta_(meta && meta.attachmentCapture);
  var payloadJson = JSON.stringify(safePayload);
  var payloadBytes = String(payloadJson.length || 0);
  var row = [
    portalV2Now_(),
    portalV2Esc_(safePayload.client_tz || ''),
    portalV2Esc_(safePayload.client_utc_offset_minutes || ''),
    portalV2RoutFromRoute_(route),
    submissionId,
    String(meta && meta.category || ''),
    String(meta && meta.triggerType || ''),
    portalV2Esc_(meta && meta.reason || ''),
    portalV2Esc_(meta && meta.reasonDetails !== undefined ? JSON.stringify(meta.reasonDetails) : ''),
    portalV2Esc_(meta && meta.honeypotField || ''),
    portalV2Esc_(meta && meta.honeypotValue || ''),
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
    String(capture.status || ''),
    String(capture.name || ''),
    String(capture.type || ''),
    String(capture.size || ''),
    String(capture.url || ''),
    String(capture.error || ''),
    PORTAL_V2_CONFIG.SOURCE,
    payloadBytes,
    portalV2Esc_(payloadJson)
  ];
  portalV2AppendFailRow_(route, header, row);
}

function portalV2FailHeader_() {
  return [
    'received_utc',
    'client_tz',
    'client_utc_offset_minutes',
    'rout',
    'submission_id',
    'fail_category',
    'trigger_type',
    'trigger_reason',
    'trigger_details',
    'honeypot_field',
    'honeypot_value',
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
    'attachment_capture_status',
    'attachment_capture_name',
    'attachment_capture_type',
    'attachment_capture_size',
    'attachment_capture_url',
    'attachment_capture_error',
    'source',
    'payload_bytes',
    'payload'
  ];
}

function portalV2AbuseGate_(route, payload, submissionId) {
  var dedupe = portalV2DedupeOk_(route, payload, submissionId);
  if (!dedupe.ok) return dedupe;
  var burst = portalV2BurstGate_(route, payload);
  if (!burst.ok) return burst;
  return { ok: true, error: '' };
}

function portalV2DedupeOk_(route, payload, submissionId) {
  var sid = String(submissionId || '').trim();
  if (!sid) return { ok: true, error: '' };
  var ttl = Number(PORTAL_V2_CONFIG.DEDUPE_SECONDS || 3600);
  if (!Number.isFinite(ttl) || ttl < 1) ttl = 3600;
  var cache = CacheService.getScriptCache();
  var key = 'portal_v2_sub_' + sid;
  var existing = cache.get(key);
  if (existing) {
    portalV2LogFailure_(route, payload, 'policy_block', 'duplicate_submission', { submission_id: sid }, sid);
    return { ok: false, error: 'already_received' };
  }
  cache.put(key, '1', ttl);
  return { ok: true, error: '' };
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
    portalV2LogFailure_(route, payload, 'operational_failure', 'rate_limit_lock', { error: 'lock_failed' }, payload && payload.submission_id);
    return { ok: false, error: 'temporarily_unavailable' };
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
        portalV2LogFailure_(route, payload, 'policy_block', blockedReason, { window_start_ms: globalStart, max: globalMax, window_seconds: globalWindow }, payload && payload.submission_id);
      } else {
        portalV2LogFailure_(route, payload, 'policy_block', blockedReason, { window_start_ms: trackStart, max: trackMax, window_seconds: trackWindow, route: routeKey }, payload && payload.submission_id);
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

    if (blockedReason) return { ok: false, error: 'retry_later' };
    return { ok: true, error: '' };
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
      portalV2LogFailure_(route, payload, 'policy_block', 'rate_limit_email', { email: String(email || ''), submission_id: submissionId }, submissionId);
      return { ok: false, error: 'retry_later' };
    }
  cache.put(key, '1', ttl);
  return { ok: true, error: '' };
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

function portalV2FailAttachment_(payload, route, submissionId) {
  var safePayload = payload || {};
  var b64 = String(safePayload.attachment_data || '').trim();
  if (!b64) return { status: 'none', name: '', type: '', size: '', url: '', error: '' };

  var folderId = String(PORTAL_V2_CONFIG.FAIL_UPLOAD_FOLDER_ID || '').trim();
  if (!folderId) {
    return { status: 'failed', name: '', type: '', size: '', url: '', error: 'missing_fail_upload_folder' };
  }

  var nameRaw = String(safePayload.attachment_name || '').trim();
  var typeRaw = String(safePayload.attachment_type || '').trim();
  var normalized = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!normalized) return { status: 'failed', name: '', type: '', size: '', url: '', error: 'invalid_attachment' };

  var safeName = portalV2SafeFileName_(nameRaw || 'attachment.bin');
  var ext = portalV2Ext_(safeName);
  if (!PORTAL_V2_ALLOWED_EXTENSIONS[ext]) {
    return { status: 'failed', name: safeName, type: typeRaw, size: String(safePayload.attachment_size || ''), url: '', error: 'invalid_attachment_type' };
  }

  var bytes;
  try { bytes = Utilities.base64Decode(normalized); } catch (err) {
    return { status: 'failed', name: safeName, type: typeRaw, size: '', url: '', error: 'invalid_attachment' };
  }
  var size = bytes && bytes.length ? bytes.length : 0;
  if (!size) return { status: 'failed', name: safeName, type: typeRaw, size: '0', url: '', error: 'invalid_attachment' };
  if (size > PORTAL_V2_CONFIG.FILE_UPLOAD_MAX_BYTES) {
    return { status: 'failed', name: safeName, type: typeRaw, size: String(size), url: '', error: 'file_too_large' };
  }

  var mime = typeRaw || portalV2Mime_(ext);
  var blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', 'fail_' + String(route || 'unknown') + '_' + String(submissionId || Utilities.getUuid()) + '_' + safeName);
  try {
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    return { status: 'saved', name: file.getName(), type: mime, size: String(size), url: file.getUrl(), error: '' };
  } catch (driveErr) {
    return { status: 'failed', name: safeName, type: mime, size: String(size), url: '', error: 'fail_upload_error:' + String(driveErr || '') };
  }
}

function portalV2FailAttachmentMeta_(capture) {
  var meta = capture || {};
  return {
    status: String(meta.status || 'none'),
    name: String(meta.name || ''),
    type: String(meta.type || ''),
    size: String(meta.size || ''),
    url: String(meta.url || ''),
    error: String(meta.error || '')
  };
}

function portalV2Append_(route, row, submissionId, payload) {
  var masterTarget = portalV2MasterSheetTarget_();
  var routeTarget = portalV2SheetTarget_(route);
  var masterMeta = portalV2AppendTargetRow_(masterTarget, portalV2ColumnsForRoute_(route), row);
  var mirrorOk = true;
  var routeMeta = null;
  var mirrorError = '';

  try {
    routeMeta = portalV2AppendTargetRow_(routeTarget, portalV2ColumnsForRoute_(route), row);
  } catch (mirrorErr) {
    mirrorOk = false;
    mirrorError = String(mirrorErr || '');
    portalV2LogWriteIssue_(route, submissionId, payload, masterTarget, routeTarget, mirrorError);
  }

  return {
    master: masterMeta,
    route: routeMeta,
    mirrorOk: mirrorOk,
    mirrorError: mirrorError
  };
}

function portalV2AppendNamed_(route, name, header, row) {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  return portalV2AppendTargetRow_({
    spreadsheetId: sid,
    sheetName: String(name || '').trim()
  }, header, row);
}

function portalV2AppendFailRow_(route, header, row) {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  var sheetName = String(PORTAL_V2_CONFIG.FAIL_SHEET_NAME || '').trim();
  if (!sheetName) throw new Error('Missing fail sheet name');

  var ss = SpreadsheetApp.openById(sid);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  } else {
    var currentHeader = [];
    if (sheet.getLastRow() > 0) {
      currentHeader = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
      while (currentHeader.length && String(currentHeader[currentHeader.length - 1] || '') === '') {
        currentHeader.pop();
      }
    }
    var currentLength = currentHeader.length;
    var canExtend = currentLength > 0 && currentLength < header.length;
    if (canExtend) {
      for (var i = 0; i < currentLength; i += 1) {
        if (String(currentHeader[i] || '') !== String(header[i] || '')) {
          canExtend = false;
          break;
        }
      }
    }
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    } else if (canExtend) {
      sheet.getRange(1, currentLength + 1, 1, header.length - currentLength).setValues([header.slice(currentLength)]);
    } else if (!portalV2HeaderMatches_(sheet, header)) {
      throw new Error('fail_sheet_header_mismatch');
    }
  }
  sheet.appendRow(row);
}

function portalV2AppendTargetRow_(target, header, row) {
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  var sheet = ss.getSheetByName(target.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(target.sheetName);
    if (header && header.length) sheet.appendRow(header);
  } else if (header && header.length && !portalV2HeaderMatches_(sheet, header)) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  sheet.appendRow(row);
  return {
    spreadsheetId: target.spreadsheetId,
    sheetName: target.sheetName,
    rowIndex: sheet.getLastRow()
  };
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

function portalV2MasterSheetTarget_() {
  var portalSid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!portalSid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  return {
    spreadsheetId: portalSid,
    sheetName: String(PORTAL_V2_CONFIG.MASTER_SHEET_NAME || '').trim()
  };
}

function portalV2SheetTarget_(route) {
  var portalSid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!portalSid) throw new Error('Missing PORTAL_V2_DATABASE_ID');

  var routeKey = String(route || '').trim().toLowerCase();
  var routeSheets = PORTAL_V2_CONFIG.ROUTE_SHEETS || {};
  var sheetName = String(routeSheets[routeKey] || '').trim();
  if (!sheetName) throw new Error('Missing route sheet for route: ' + routeKey);
  return { spreadsheetId: portalSid, sheetName: sheetName };
}

function portalV2UploadFolderByRoute_(route) {
  var portalFallback = String(PORTAL_V2_CONFIG.PORTAL_UPLOAD_FOLDER_ID || '').trim();
  if (route === PORTAL_V2_ROUTES.INVESTMENT) return String(PORTAL_V2_CONFIG.INVESTMENT_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.PRESS) return String(PORTAL_V2_CONFIG.PRESS_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.EMPLOYMENT) return String(PORTAL_V2_CONFIG.EMPLOYMENT_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (route === PORTAL_V2_ROUTES.INTERNSHIP) return String(PORTAL_V2_CONFIG.INTERNSHIP_UPLOAD_FOLDER_ID || portalFallback || '').trim();
  if (portalV2IsStakeholderRoute_(route)) return String(PORTAL_V2_CONFIG.STAKEHOLDER_UPLOAD_FOLDER_ID || portalFallback || '').trim();
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

function portalV2TemplateData_(route, payload, submissionId, email, receivedUtc, fallbackReasons, failMeta) {
  var safePayload = payload || {};
  var routeName = portalV2RouteName_(route);
  var submittedFieldsBlock = portalV2SubmittedFieldsBlock_(route, safePayload, routeName);
  var abuseReason = portalV2AbuseReason_(safePayload);
  var normalizedFallbackReasons = portalV2NormalizeFallbackReasons_(fallbackReasons);
  var nextFailMeta = failMeta || {};
  return {
    name: String(safePayload.name || '').trim() || 'there',
    rout: portalV2RoutFromRoute_(route),
    route: String(route || ''),
    route_name: routeName,
    subject_tag: portalV2SubjectTag_(safePayload, normalizedFallbackReasons),
    abuse_flag: abuseReason ? 'ABUSE' : 'none',
    abuse_reason: abuseReason || 'n/a',
    fail_category: String(nextFailMeta.category || safePayload._fail_category || 'n/a'),
    fail_reason: String(nextFailMeta.reason || safePayload._fail_reason || 'n/a'),
    fail_details: nextFailMeta.details !== undefined ? String(nextFailMeta.details) : (safePayload._abuse_details !== undefined ? String(typeof safePayload._abuse_details === 'string' ? safePayload._abuse_details : JSON.stringify(safePayload._abuse_details)) : 'n/a'),
    fail_attachment_capture_status: String(nextFailMeta.attachmentStatus || 'none'),
    fail_attachment_capture_name: String(nextFailMeta.attachmentName || 'n/a'),
    fail_attachment_capture_type: String(nextFailMeta.attachmentType || 'n/a'),
    fail_attachment_capture_size: String(nextFailMeta.attachmentSize || 'n/a'),
    fail_attachment_capture_url: String(nextFailMeta.attachmentUrl || 'n/a'),
    fail_attachment_capture_error: String(nextFailMeta.attachmentError || 'n/a'),
    fallback_flag: normalizedFallbackReasons.length ? 'FALLBACK' : 'none',
    fallback_reasons: normalizedFallbackReasons.length ? normalizedFallbackReasons.join(' | ') : 'n/a',
    submission_id: String(submissionId || ''),
    received_utc: String(receivedUtc || ''),
    client_tz: String(safePayload.client_tz || ''),
    client_utc_offset_minutes: String(safePayload.client_utc_offset_minutes || ''),
    received_local: portalV2ReceivedLocal_(safePayload, receivedUtc),
    received_texas: portalV2FormatInTimeZone_(receivedUtc, 'America/Chicago'),
    email: String(email || ''),
    org: String(safePayload.org || ''),
    role: String(safePayload.role || ''),
    loc_city: String(safePayload.loc_city || ''),
    loc_state: String(safePayload.loc_state || ''),
    loc_country: String(safePayload.loc_country || ''),
    focus: String(safePayload.focus || ''),
    message: String(safePayload.message || ''),
    source: String(PORTAL_V2_CONFIG.SOURCE || ''),
    page_path: String(safePayload.page_path || '/'),
    referrer: String(safePayload.referrer || 'direct'),
    pinv_stage: String(safePayload.pinv_stage || ''),
    pinv_check_range: String(safePayload.pinv_check_range || ''),
    pinv_geography: String(safePayload.pinv_geography || ''),
    pinv_focus: String(safePayload.pinv_focus || ''),
    pinv_timeline: String(safePayload.pinv_timeline || ''),
    pinv_investor_type: String(safePayload.pinv_investor_type || ''),
    pinv_investor_type_other: String(safePayload.pinv_investor_type_other || ''),
    pprs_outlet: String(safePayload.pprs_outlet || ''),
    pprs_role: String(safePayload.pprs_role || ''),
    pprs_deadline: String(safePayload.pprs_deadline || ''),
    pprs_topic: String(safePayload.pprs_topic || ''),
    pprs_format: String(safePayload.pprs_format || ''),
    pemp_role_interest: String(safePayload.pemp_role_interest || ''),
    pemp_timeline: String(safePayload.pemp_timeline || ''),
    pemp_location_pref: String(safePayload.pemp_location_pref || ''),
    pint_school: String(safePayload.pint_school || ''),
    pint_program: String(safePayload.pint_program || ''),
    pint_grad_date: String(safePayload.pint_grad_date || ''),
    pint_track: String(safePayload.pint_track || ''),
    pint_mode: String(safePayload.pint_mode || ''),
    pint_hours_per_week: String(safePayload.pint_hours_per_week || ''),
    pint_start_date: String(safePayload.pint_start_date || ''),
    pint_portfolio_url: String(safePayload.pint_portfolio_url || ''),
    attachment_name: String(safePayload.attachment_name || ''),
    attachment_type: String(safePayload.attachment_type || ''),
    attachment_size: String(safePayload.attachment_size || ''),
    attachment_url: String(safePayload.attachment_url || ''),
    attachment_status: String(safePayload.attachment_status || ''),
    submitted_fields_block: submittedFieldsBlock
  };
}

function portalV2ReceivedLocal_(payload, receivedUtc) {
  var safePayload = payload || {};
  var clientTz = String(safePayload.client_tz || '').trim();
  if (clientTz) {
    var formattedInClientTz = portalV2FormatInTimeZone_(receivedUtc, clientTz);
    if (formattedInClientTz) return formattedInClientTz;
  }
  var rawOffset = String(safePayload.client_utc_offset_minutes || '').trim();
  if (rawOffset) return portalV2FormatWithUtcOffset_(receivedUtc, rawOffset);
  return 'Unavailable';
}

function portalV2FormatInTimeZone_(isoOrDate, timeZoneId) {
  var tz = String(timeZoneId || '').trim() || 'Etc/UTC';
  try {
    var d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return Utilities.formatDate(d, tz, "yyyy-MM-dd HH:mm:ss z");
  } catch (err) {
    return '';
  }
}

function portalV2FormatWithUtcOffset_(isoOrDate, offsetMinutesRaw) {
  var parsedOffset = Number(offsetMinutesRaw);
  if (!Number.isFinite(parsedOffset)) return 'Unavailable';
  var date = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(date.getTime())) return 'Unavailable';
  var shifted = new Date(date.getTime() + (parsedOffset * 60000));
  var sign = parsedOffset >= 0 ? '+' : '-';
  var absMinutes = Math.abs(parsedOffset);
  var offsetHours = Math.floor(absMinutes / 60);
  var offsetMinutes = absMinutes % 60;
  var label = 'UTC' + sign
    + (offsetHours < 10 ? '0' : '') + offsetHours
    + ':'
    + (offsetMinutes < 10 ? '0' : '') + offsetMinutes;
  try {
    return Utilities.formatDate(shifted, 'Etc/UTC', "yyyy-MM-dd HH:mm:ss") + ' ' + label;
  } catch (err) {
    return 'Unavailable';
  }
}

function portalV2RoutFromRoute_(route) {
  return String(PORTAL_V2_ROUTE_TO_ROUT[String(route || '').trim().toLowerCase()] || '');
}

function portalV2RouteFromRout_(rout) {
  return String(PORTAL_V2_ROUT_TO_ROUTE[String(rout || '').trim().toLowerCase()] || '');
}

function portalV2RouteName_(route) {
  var safeRoute = String(route || '').trim().toLowerCase();
  return String(PORTAL_V2_ROUTE_NAMES[safeRoute] || safeRoute.toUpperCase() || 'TSI SUBMISSION');
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

function portalV2SubmittedFieldsBlock_(route, payload, routeName) {
  var safePayload = payload || {};
  var visibility = portalV2RouteVisibility_(route);
  var lines = [];
  var add = function (label, value) {
    var next = portalV2TemplateFieldValue_(value);
    if (!next) return;
    lines.push(String(label || '').trim() + ': ' + next);
  };

  add('Form Submitted', routeName);
  add('Route Code', portalV2RoutFromRoute_(route));
  add('Route Key', route);
  add('Name', safePayload.name);
  add('Email', safePayload.email);
  if (visibility.org) add('Organization', safePayload.org);
  if (visibility.role) add('Role', safePayload.role);
  add('City', safePayload.loc_city);
  if (visibility.locState) add('State/Region', safePayload.loc_state);
  add('Country', safePayload.loc_country);
  if (visibility.focus) add('Focus', safePayload.focus);

  if (visibility.investment) {
    add('Investment Stage', safePayload.pinv_stage);
    add('Investment Check Range', safePayload.pinv_check_range);
    add('Investment Geography', safePayload.pinv_geography);
    add('Investment Focus', safePayload.pinv_focus);
    add('Investment Timeline', safePayload.pinv_timeline);
    add('Investor Type', safePayload.pinv_investor_type);
    add('Investor Type Other', safePayload.pinv_investor_type_other);
  }

  if (visibility.press) {
    add('Press Outlet', safePayload.pprs_outlet);
    add('Press Role', safePayload.pprs_role);
    add('Press Deadline', safePayload.pprs_deadline);
    add('Press Topic', safePayload.pprs_topic);
    add('Press Format', safePayload.pprs_format);
  }

  if (visibility.employment) {
    add('Employment Role Interest', safePayload.pemp_role_interest);
    add('Employment Timeline', safePayload.pemp_timeline);
    add('Employment Location Preference', safePayload.pemp_location_pref);
  }

  if (visibility.internship) {
    add('School', safePayload.pint_school);
    add('Program', safePayload.pint_program);
    add('Graduation Date', safePayload.pint_grad_date);
    add('Internship Track', safePayload.pint_track);
    add('Internship Mode', safePayload.pint_mode);
    add('Hours Per Week', safePayload.pint_hours_per_week);
    add('Start Date', safePayload.pint_start_date);
    add('Portfolio URL', safePayload.pint_portfolio_url);
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

function portalV2DefaultAdminNotifyTemplate_() {
  return {
    subject: '[{{subject_tag}}][{{rout}}][{{submission_id}}] {{name}}',
    body: [
      'Form Submitted: {{route_name}}',
      'Route Code: {{rout}} | {{route}}',
      'Submission ID: {{submission_id}}',
      '',
      '##Error Status##',
      'Fallback Status: {{fallback_flag}} | {{fallback_reasons}}',
      '',
      '##User Data##',
      'Name: {{name}}',
      'Email: {{email}}',
      'Organization: {{org}}',
      'Role: {{role}}',
      'City: {{loc_city}}',
      'State/Region: {{loc_state}}',
      'Country: {{loc_country}}',
      '',
      '##Time Received##',
      'Local: {{received_local}}',
      'Texas: {{received_texas}}',
      'UTC: {{received_utc}}',
      '',
      '##Site Info##',
      'Page Path: {{page_path}}',
      'Referrer: {{referrer}}',
      '',
      '##Full Submit Content##',
      '{{submitted_fields_block}}'
    ].join('\n')
  };
}

function portalV2DefaultFailNotifyTemplate_() {
  return {
    subject: '[{{subject_tag}}][{{rout}}][{{submission_id}}] {{name}}',
    body: [
      'Form Submitted: {{route_name}}',
      'Route Code: {{rout}} | {{route}}',
      'Submission ID: {{submission_id}}',
      '',
      '##Error Status##',
      'Fallback Flag: {{fallback_flag}}',
      'Fallback Reasons: {{fallback_reasons}}',
      '------------------------------',
      'Fail Category: {{fail_category}}',
      'Fail Reason: {{fail_reason}}',
      'Fail Details: {{fail_details}}',
      '------------------------------',
      'Abuse Flag: {{abuse_flag}}',
      'Abuse Reason: {{abuse_reason}}',
      '',
      '##Time Received##',
      'Local: {{received_local}}',
      'Texas: {{received_texas}}',
      'UTC: {{received_utc}}',
      '',
      '##Site Info##',
      'Page Path: {{page_path}}',
      'Referrer: {{referrer}}',
      '',
      '##Full Submit Content##',
      '{{submitted_fields_block}}'
    ].join('\n')
  };
}

function portalV2AbuseTagDebug() {
  var route = PORTAL_V2_ROUTES.GOVERNMENT;
  var receivedUtc = portalV2Now_();
  var normalPayload = {
    name: 'Normal Example',
    email: 'normal@example.com',
    loc_city: 'Austin',
    loc_state: 'Texas',
    loc_country: 'United States',
    message: 'Normal template token check.'
  };
  var abusePayload = {
    name: 'Abuse Example',
    email: 'abuse@example.com',
    loc_city: 'Austin',
    loc_state: 'Texas',
    loc_country: 'United States',
    message: 'Abuse template token check.',
    _abuse_reason: 'duplicate_submission'
  };
  var normalData = portalV2TemplateData_(route, normalPayload, 'debug-normal', String(normalPayload.email || ''), receivedUtc, []);
  var abuseData = portalV2TemplateData_(route, abusePayload, 'debug-abuse', String(abusePayload.email || ''), receivedUtc, []);
  var fallbackData = portalV2TemplateData_(route, normalPayload, 'debug-fallback', String(normalPayload.email || ''), receivedUtc, ['provider_fallback:zeptomail_send_failed']);
  var failData = portalV2TemplateData_(route, abusePayload, 'debug-fail', String(abusePayload.email || ''), receivedUtc, [], {
    category: 'policy_block',
    reason: 'duplicate_submission',
    details: '{"submission_id":"debug-fail"}',
    attachmentStatus: 'saved',
    attachmentName: 'debug.txt',
    attachmentType: 'text/plain',
    attachmentSize: '5',
    attachmentUrl: 'https://example.com/debug.txt',
    attachmentError: 'n/a'
  });
  return {
    ok: true,
    token_example: '{{subject_tag}}',
    reason_example: '{{abuse_reason}}',
    normal: {
      subject_tag: normalData.subject_tag,
      abuse_flag: normalData.abuse_flag,
      abuse_reason: normalData.abuse_reason,
      rendered: portalV2TemplateRender_('Tag={{subject_tag}}|Abuse={{abuse_flag}}|Reason={{abuse_reason}}|Fallback={{fallback_flag}}', normalData)
    },
    abuse: {
      subject_tag: abuseData.subject_tag,
      abuse_flag: abuseData.abuse_flag,
      abuse_reason: abuseData.abuse_reason,
      rendered: portalV2TemplateRender_('Tag={{subject_tag}}|Abuse={{abuse_flag}}|Reason={{abuse_reason}}|Fallback={{fallback_flag}}', abuseData)
    },
    fallback: {
      subject_tag: fallbackData.subject_tag,
      fallback_flag: fallbackData.fallback_flag,
      fallback_reasons: fallbackData.fallback_reasons,
      rendered: portalV2TemplateRender_('Tag={{subject_tag}}|Abuse={{abuse_flag}}|Reason={{abuse_reason}}|Fallback={{fallback_flag}}|FallbackReasons={{fallback_reasons}}', fallbackData)
    },
    fail: {
      subject_tag: failData.subject_tag,
      fail_category: failData.fail_category,
      fail_reason: failData.fail_reason,
      rendered: portalV2TemplateRender_('Tag={{subject_tag}}|FailCategory={{fail_category}}|FailReason={{fail_reason}}|FailDetails={{fail_details}}', failData)
    }
  };
}

function portalV2TryAutoReply_(route, payload, email, submissionId, receivedUtc) {
  try {
    if (!PORTAL_V2_CONFIG.AUTO_REPLY_ENABLED) return;
    if (!portalV2AutoReplyEnabledForRoute_(route)) return;
    if (!portalV2EmailOk_(email)) return;

    var data = portalV2TemplateData_(route, payload, submissionId, email, receivedUtc, []);
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
      subject = String(PORTAL_V2_CONFIG.AUTO_REPLY_SUBJECT_PREFIX || 'TSI Intake Confirmation') + ': ' + data.route_name;
      body = [
        'Hello ' + data.name + ',',
        '',
        'We received your submission and our team will review it.',
        '',
        'Form Submitted: ' + data.route_name,
        'Route Code: ' + data.rout,
        'Route Key: ' + route,
        'Submission ID: ' + String(submissionId || ''),
        'Received: ' + data.received_local + ' (Local) | ' + data.received_texas + ' (Texas) | ' + receivedUtc + ' (UTC)',
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
  var overrides = PORTAL_V2_CONFIG.AUTO_REPLY_ROUTE_OVERRIDES || {};
  var routeKey = String(route || '').trim().toLowerCase();
  var override = Object.prototype.hasOwnProperty.call(overrides, routeKey) ? overrides[routeKey] : null;
  if (override === null) return true;
  return override;
}

function portalV2NotifyAdmin_(route, email, submissionId, attachment, payload, receivedUtc) {
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  if (!admin) return;
  var tmpl = portalV2TemplatePick_(route, 'admin_notify', payload);
  if (tmpl && tmpl.enabled === false) return;

  var fallbackReasons = [];
  var subjectTemplate;
  var bodyTemplate;
  if (tmpl && tmpl.subject && tmpl.body) {
    subjectTemplate = tmpl.subject;
    bodyTemplate = tmpl.body;
  } else {
    fallbackReasons.push('template_fallback:admin_notify_template_missing_or_incomplete');
    var defaultAdminTemplate = portalV2DefaultAdminNotifyTemplate_();
    subjectTemplate = defaultAdminTemplate.subject;
    bodyTemplate = defaultAdminTemplate.body;
  }
  var data = portalV2TemplateData_(route, payload, submissionId, email, receivedUtc, fallbackReasons);
  var subject = portalV2TemplateRender_(subjectTemplate, data);
  var body = portalV2TemplateRender_(bodyTemplate, data);
  portalV2SendMail_(route, 'admin_notify', admin, subject, body, submissionId, fallbackReasons, {
    route: route,
    payload: payload,
    submissionId: submissionId,
    email: email,
    receivedUtc: receivedUtc,
    subjectTemplate: subjectTemplate,
    bodyTemplate: bodyTemplate
  });
}

function portalV2NotifyFail_(route, payload, submissionId, attachmentCapture, category, reason, details) {
  try {
    if (!PORTAL_V2_CONFIG.FAIL_NOTIFY_ENABLED) return;
    var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
    if (!admin) return;
    if (!portalV2IsInternalEmailAddress_(admin)) return;

    var attachmentMeta = portalV2FailAttachmentMeta_(attachmentCapture);
    var detailsText = details === undefined ? 'n/a' : (typeof details === 'string' ? details : JSON.stringify(details));
    var email = String(payload && payload.email || '').trim();
    var receivedUtc = portalV2Now_();
    var failMeta = {
      category: String(category || 'operational_failure'),
      reason: String(reason || 'unknown'),
      details: String(detailsText || 'n/a'),
      attachmentStatus: attachmentMeta.status || 'none',
      attachmentName: attachmentMeta.name || 'n/a',
      attachmentType: attachmentMeta.type || 'n/a',
      attachmentSize: attachmentMeta.size || 'n/a',
      attachmentUrl: attachmentMeta.url || 'n/a',
      attachmentError: attachmentMeta.error || 'n/a'
    };
    var tmpl = portalV2TemplatePick_(route, 'fail_notify', payload);
    if (tmpl && tmpl.enabled === false) return;

    var fallbackReasons = [];
    var subjectTemplate;
    var bodyTemplate;
    if (tmpl && tmpl.subject && tmpl.body) {
      subjectTemplate = tmpl.subject;
      bodyTemplate = tmpl.body;
    } else {
      fallbackReasons.push('template_fallback:fail_notify_template_missing_or_incomplete');
      var defaultFailTemplate = portalV2DefaultFailNotifyTemplate_();
      subjectTemplate = defaultFailTemplate.subject;
      bodyTemplate = defaultFailTemplate.body;
    }
    var data = portalV2TemplateData_(route, payload, submissionId, email, receivedUtc, fallbackReasons, failMeta);
    var subject = portalV2TemplateRender_(subjectTemplate, data);
    var body = portalV2TemplateRender_(bodyTemplate, data);
    portalV2SendMail_(route, 'fail_notify', admin, subject, body, submissionId, fallbackReasons, {
      route: route,
      payload: payload,
      submissionId: submissionId,
      email: email,
      receivedUtc: receivedUtc,
      subjectTemplate: subjectTemplate,
      bodyTemplate: bodyTemplate,
      failMeta: failMeta
    });
  } catch (err) {
    console.error('portal v2 fail-notify failed: ' + err);
  }
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

function portalV2AbuseReason_(payload) {
  var safePayload = payload || {};
  return String(safePayload._abuse_reason || safePayload._honeypot_reason || '').trim();
}

function portalV2SubjectTag_(payload, fallbackReasons) {
  var failCategory = String(payload && payload._fail_category || '').trim().toLowerCase();
  var normalizedFallbackReasons = portalV2NormalizeFallbackReasons_(fallbackReasons);
  if (normalizedFallbackReasons.length) return 'FALLBACK';
  if (failCategory && failCategory !== 'n/a' && failCategory !== 'none') return 'FAIL';
  return 'TSI';
}

function portalV2ApplySubjectTag_(subject, tag) {
  var rawSubject = String(subject || '').trim();
  var nextTag = String(tag || '').trim();
  if (!nextTag) return rawSubject;
  if (/^\[[^\]]+\]/.test(rawSubject)) {
    return rawSubject.replace(/^\[[^\]]+\]/, '[' + nextTag + ']');
  }
  return '[' + nextTag + '] ' + rawSubject;
}

function portalV2AnnotateFallbackMessage_(subject, body, reasons, annotateForRecipient) {
  var normalized = portalV2NormalizeFallbackReasons_(reasons);
  var rawSubject = String(subject || '').trim();
  var rawBody = String(body || '');
  if (!normalized.length) return { subject: rawSubject, body: rawBody, reasons: [] };
  if (!annotateForRecipient) return { subject: rawSubject, body: rawBody, reasons: normalized };

  var taggedSubject = portalV2ApplySubjectTag_(rawSubject, 'FALLBACK');

  var note = [
    '',
    '[[FALLBACK_NOTICE]]',
    'Triggers: ' + normalized.join(' | ')
  ].join('\n');
  return { subject: taggedSubject, body: rawBody + note, reasons: normalized };
}

function portalV2IsInternalMailType_(mailType) {
  var kind = String(mailType || '').trim().toLowerCase();
  return kind === 'admin_notify' || kind === 'fallback_notice' || kind === 'fail_notify';
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
  var useRouteFrom = !!PORTAL_V2_CONFIG.ZEPTO_USE_ROUTE_FROM;
  var r = String(route || '').trim().toLowerCase();
  var routeFrom = '';
  if (useRouteFrom) {
    routeFrom = String((PORTAL_V2_CONFIG.ZEPTO_FROM_ROUTE_OVERRIDES || {})[r] || '').trim();
    if (routeFrom) return { from: routeFrom, reason: '' };
  }

  var defaultFrom = String(PORTAL_V2_CONFIG.ZEPTO_FROM_DEFAULT || '').trim();
  if (defaultFrom) return { from: defaultFrom, reason: '' };
  return { from: '', reason: 'sender_fallback:no sender configured' };
}

function portalV2SendMail_(route, mailType, toAddress, subject, body, submissionId, fallbackReasons, renderContext) {
  var to = String(toAddress || '').trim();
  if (!to) return false;
  var internalOnly = portalV2IsInternalMailType_(mailType) && portalV2IsInternalEmailAddress_(to);
  var reasons = portalV2NormalizeFallbackReasons_(fallbackReasons);
  var fromCtx = portalV2ZeptoFromContext_(route);
  var from = String(fromCtx.from || '').trim();
  if (fromCtx.reason) reasons = portalV2AppendFallbackReason_(reasons, fromCtx.reason);
  var primaryMail = portalV2AnnotateFallbackMessage_(subject, body, reasons, internalOnly);
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
    var fallbackMail;
    if (renderContext && renderContext.subjectTemplate && renderContext.bodyTemplate) {
      var renderedData = portalV2TemplateData_(
        renderContext.route,
        renderContext.payload || {},
        renderContext.submissionId || submissionId,
        renderContext.email || to,
        renderContext.receivedUtc || portalV2Now_(),
        providerReasons,
        renderContext.failMeta || null
      );
      fallbackMail = {
        subject: portalV2TemplateRender_(renderContext.subjectTemplate, renderedData),
        body: portalV2TemplateRender_(renderContext.bodyTemplate, renderedData),
        reasons: providerReasons
      };
      if (internalOnly) {
        fallbackMail = portalV2AnnotateFallbackMessage_(fallbackMail.subject, fallbackMail.body, providerReasons, true);
      }
    } else {
      fallbackMail = portalV2AnnotateFallbackMessage_(subject, body, providerReasons, internalOnly);
    }
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
  var subject = portalV2ApplySubjectTag_(String(originalSubject || 'MailApp fallback used'), 'FALLBACK');
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
    'received_utc',
    'client_tz',
    'client_utc_offset_minutes',
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
      String(payload && payload.client_tz || ''),
      String(payload && payload.client_utc_offset_minutes || ''),
      username,
      String(payload && payload.page_path || ''),
      String(payload && payload.referrer || ''),
      String(payload && payload.submission_id || Utilities.getUuid())
    ];

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      portalV2AppendNamed_(PORTAL_V2_ROUTES.GOVERNMENT, sheetName, portalV2InternalUsernameHeader_(), row);
    } finally {
      try { lock.releaseLock(); } catch (ignore) {}
    }
    portalV2RefreshDashboardSafe_();
  } catch (err) {
    console.error('portal v2 internal username log failed: ' + err);
  }
}

function portalV2WriteIssueHeader_() {
  return [
    'timestamp_utc',
    'rout',
    'submission_id',
    'master_sheet',
    'route_sheet',
    'status',
    'error',
    'name',
    'email',
    'page_path',
    'referrer'
  ];
}

function portalV2LogWriteIssue_(route, submissionId, payload, masterTarget, routeTarget, errorText) {
  var safePayload = payload || {};
  var row = [
    portalV2Now_(),
    portalV2RoutFromRoute_(route),
    String(submissionId || ''),
    String(masterTarget && masterTarget.sheetName || ''),
    String(routeTarget && routeTarget.sheetName || ''),
    'mirror_mismatch',
    String(errorText || ''),
    String(safePayload.name || ''),
    String(safePayload.email || ''),
    String(safePayload.page_path || ''),
    String(safePayload.referrer || '')
  ];
  portalV2AppendNamed_(route, PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME, portalV2WriteIssueHeader_(), row);
  portalV2RefreshDashboardSafe_();
  if (PORTAL_V2_CONFIG.WRITE_ISSUE_ALERT_ENABLED) {
    portalV2NotifyWriteIssue_(route, submissionId, masterTarget, routeTarget, errorText);
  }
}

function portalV2NotifyWriteIssue_(route, submissionId, masterTarget, routeTarget, errorText) {
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  if (!admin || !portalV2IsInternalEmailAddress_(admin)) return;
  var subject = '[Mirror Issue][' + portalV2RoutFromRoute_(route) + '] ' + String(submissionId || '');
  var body = [
    'rout: ' + portalV2RoutFromRoute_(route),
    'route: ' + String(route || ''),
    'submission_id: ' + String(submissionId || ''),
    'master_sheet: ' + String(masterTarget && masterTarget.sheetName || ''),
    'route_sheet: ' + String(routeTarget && routeTarget.sheetName || ''),
    'error: ' + String(errorText || '')
  ].join('\n');
  try {
    MailApp.sendEmail(admin, subject, body);
  } catch (err) {
    console.error('portal v2 write issue notify failed: ' + err);
  }
}

function portalV2DashboardHeader_() {
  return ['section', 'metric', 'key', 'value', 'updated_utc'];
}

function portalV2RefreshDashboardSafe_() {
  if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) return { ok: true, skipped: 'dashboard_disabled' };
  try {
    return portalV2RefreshDashboard_();
  } catch (err) {
    console.error('portal v2 dashboard refresh failed: ' + err);
    return { ok: false, error: String(err || '') };
  }
}

function portalV2RefreshDashboard() {
  if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) return { ok: true, skipped: 'dashboard_disabled' };
  return portalV2RefreshDashboard_();
}

function portalV2RefreshDashboard_() {
  if (!PORTAL_V2_CONFIG.DASHBOARD_ENABLED) return { ok: true, skipped: 'dashboard_disabled' };
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  var ss = SpreadsheetApp.openById(sid);
  var dashboardName = String(PORTAL_V2_CONFIG.DASHBOARD_SHEET_NAME || '').trim();
  if (!dashboardName) return { ok: false, error: 'missing_dashboard_sheet_name' };

  var dashboard = ss.getSheetByName(dashboardName);
  if (!dashboard) dashboard = ss.insertSheet(dashboardName);

  var rows = [portalV2DashboardHeader_()];
  var now = portalV2Now_();
  var masterSheet = ss.getSheetByName(PORTAL_V2_CONFIG.MASTER_SHEET_NAME);
  rows.push(['submissions', 'total_rows', PORTAL_V2_CONFIG.MASTER_SHEET_NAME, portalV2SheetDataRowCount_(masterSheet), now]);
  rows.push(['submissions', 'latest_timestamp_utc', PORTAL_V2_CONFIG.MASTER_SHEET_NAME, portalV2SheetLastTimestamp_(masterSheet), now]);

  var routes = portalV2RouteTypes_();
  for (var i = 0; i < routes.length; i += 1) {
    var route = routes[i];
    var target = portalV2SheetTarget_(route);
    var routeSheet = ss.getSheetByName(target.sheetName);
    rows.push(['route', 'row_count', route, portalV2SheetDataRowCount_(routeSheet), now]);
    rows.push(['route', 'latest_timestamp_utc', route, portalV2SheetLastTimestamp_(routeSheet), now]);
  }

  rows.push(['support', 'fail_rows', PORTAL_V2_CONFIG.FAIL_SHEET_NAME, portalV2SheetDataRowCount_(ss.getSheetByName(PORTAL_V2_CONFIG.FAIL_SHEET_NAME)), now]);
  rows.push(['support', 'mail_rows', PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME, portalV2SheetDataRowCount_(ss.getSheetByName(PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME)), now]);
  rows.push(['support', 'mail_error_rows', PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME, portalV2MailErrorCount_(ss.getSheetByName(PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME)), now]);
  rows.push(['support', 'write_issue_rows', PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME, portalV2SheetDataRowCount_(ss.getSheetByName(PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME)), now]);
  rows.push(['support', 'latest_write_issue_utc', PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME, portalV2SheetLastTimestamp_(ss.getSheetByName(PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME)), now]);

  dashboard.clearContents();
  dashboard.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  return { ok: true, rows_written: rows.length };
}

function portalV2SheetDataRowCount_(sheet) {
  if (!sheet) return 0;
  return Math.max(sheet.getLastRow() - 1, 0);
}

function portalV2SheetLastTimestamp_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return '';
  return String(sheet.getRange(sheet.getLastRow(), 1).getValue() || '');
}

function portalV2MailErrorCount_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var values = sheet.getDataRange().getValues();
  var count = 0;
  for (var i = 1; i < values.length; i += 1) {
    var status = String(values[i][6] || '').trim().toLowerCase();
    if (status === 'error' || status === 'blocked') count += 1;
  }
  return count;
}

function portalV2ReconcileRouteMirrors() {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(sid);
    var master = ss.getSheetByName(PORTAL_V2_CONFIG.MASTER_SHEET_NAME);
    if (!master || master.getLastRow() < 2) return { ok: true, restored_rows: 0, by_route: {} };

    var masterRows = master.getDataRange().getValues();
    var routIndex = portalV2ColumnIndex_('rout');
    var submissionIdIndex = portalV2ColumnIndex_('submission_id');
    var nameIndex = portalV2ColumnIndex_('name');
    var emailIndex = portalV2ColumnIndex_('email');
    var pagePathIndex = portalV2ColumnIndex_('page_path');
    var referrerIndex = portalV2ColumnIndex_('referrer');
    var restored = 0;
    var byRoute = {};

    for (var i = 0; i < portalV2RouteTypes_().length; i += 1) {
      var route = portalV2RouteTypes_()[i];
      var target = portalV2SheetTarget_(route);
      var routeSheet = ss.getSheetByName(target.sheetName);
      if (!routeSheet) {
        routeSheet = ss.insertSheet(target.sheetName);
        routeSheet.getRange(1, 1, 1, PORTAL_V2_COLUMNS.length).setValues([PORTAL_V2_COLUMNS]);
      }

      var routeValues = routeSheet.getDataRange().getValues();
      var existing = {};
      for (var r = 1; r < routeValues.length; r += 1) {
        var existingId = String(routeValues[r][submissionIdIndex] || '').trim();
        if (existingId) existing[existingId] = true;
      }

      var restoredForRoute = 0;
      for (var m = 1; m < masterRows.length; m += 1) {
        var row = masterRows[m];
        var rowRoute = portalV2RouteFromRout_(row[routIndex]);
        var rowSubmissionId = String(row[submissionIdIndex] || '').trim();
        if (rowRoute !== route || !rowSubmissionId || existing[rowSubmissionId]) continue;
        portalV2AppendTargetRow_(target, PORTAL_V2_COLUMNS, row);
        existing[rowSubmissionId] = true;
        restored += 1;
        restoredForRoute += 1;
        portalV2AppendNamed_(route, PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME, portalV2WriteIssueHeader_(), [
          portalV2Now_(),
          route,
          rowSubmissionId,
          String(PORTAL_V2_CONFIG.MASTER_SHEET_NAME || ''),
          String(target.sheetName || ''),
          'mirror_backfill',
          '',
          String(row[nameIndex] || ''),
          String(row[emailIndex] || ''),
          String(row[pagePathIndex] || ''),
          String(row[referrerIndex] || '')
        ]);
      }
      byRoute[route] = restoredForRoute;
    }

    portalV2RefreshDashboardSafe_();
    return { ok: true, restored_rows: restored, by_route: byRoute };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function portalV2ColumnIndex_(columnName) {
  var target = String(columnName || '').trim();
  for (var i = 0; i < PORTAL_V2_COLUMNS.length; i += 1) {
    if (String(PORTAL_V2_COLUMNS[i] || '') === target) return i;
  }
  throw new Error('Unknown column: ' + target);
}

function portalV2ZeptoFromForRoute_(route) {
  var routeKey = String(route || '').trim().toLowerCase();
  var routeOverride = String((PORTAL_V2_CONFIG.ZEPTO_FROM_ROUTE_OVERRIDES || {})[routeKey] || '').trim();
  if (routeOverride) return routeOverride;
  return String(PORTAL_V2_CONFIG.ZEPTO_FROM_DEFAULT || '').trim();
}

function portalV2ZeptoSendEmail_(opts) {
  var token = String(PORTAL_V2_CONFIG.ZEPTO_TOKEN || '').trim();
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
    'rout',
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
    portalV2RoutFromRoute_(entry.route || ''),
    String(entry.mailType || ''),
    String(entry.to || ''),
    String(entry.from || ''),
    String(entry.subject || ''),
    String(entry.status || ''),
    String(entry.provider || ''),
    String(entry.error || ''),
    String(entry.submissionId || '')
  ];
  portalV2AppendNamed_(String(entry.route || PORTAL_V2_ROUTES.GOVERNMENT), PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME, header, row);
}

// Manual ZeptoMail debug sender to capture full error details in mail log.
function portalV2ZeptoDebugSend() {
  var admin = String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || '').trim();
  var from = portalV2ZeptoFromForRoute_(PORTAL_V2_ROUTES.GOVERNMENT);
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

function portalV2SenderDebug() {
  var routes = portalV2RouteTypes_();
  var routeResolution = [];
  for (var i = 0; i < routes.length; i += 1) {
    var route = routes[i];
    var ctx = portalV2ZeptoFromContext_(route);
    routeResolution.push({
      route: route,
      resolved_from: String(ctx && ctx.from || ''),
      fallback_reason: String(ctx && ctx.reason || '')
    });
  }
  var report = {
    ok: true,
    timestamp_utc: portalV2Now_(),
    config_source: 'top_of_script_defaults',
    use_route_from: !!PORTAL_V2_CONFIG.ZEPTO_USE_ROUTE_FROM,
    effective_config: {
      ADMIN_NOTIFY_EMAIL: String(PORTAL_V2_CONFIG.ADMIN_NOTIFY_EMAIL || ''),
      ZEPTO_FROM_DEFAULT: String(PORTAL_V2_CONFIG.ZEPTO_FROM_DEFAULT || ''),
      ZEPTO_FROM_ROUTE_OVERRIDES: PORTAL_V2_CONFIG.ZEPTO_FROM_ROUTE_OVERRIDES || {}
    },
    route_resolution: routeResolution
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function portalV2RuntimeConfigDebug() {
  var report = {
    ok: true,
    timestamp_utc: portalV2Now_(),
    config_source: 'top_of_script_defaults',
    version: String(PORTAL_V2_CONFIG.VERSION || ''),
    script_id: String(PORTAL_V2_CONFIG.SCRIPT_ID || ''),
    spreadsheet_id_present: !!String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim(),
    template_sheet_id_present: !!String(PORTAL_V2_CONFIG.TEMPLATE_SHEET_ID || '').trim(),
    zepto_token_present: !!String(PORTAL_V2_CONFIG.ZEPTO_TOKEN || '').trim(),
    runtime: {
      honeypot_key: PORTAL_V2_CONFIG.HONEYPOT_KEY,
      source: PORTAL_V2_CONFIG.SOURCE,
      master_sheet_name: PORTAL_V2_CONFIG.MASTER_SHEET_NAME,
      template_sheet_name: PORTAL_V2_CONFIG.TEMPLATE_SHEET_NAME,
      internal_username_event: PORTAL_V2_INTERNAL_EVENT_TSI_USERNAME_CAPTURE,
      rate_limit_seconds: PORTAL_V2_CONFIG.RATE_LIMIT_SECONDS,
      rate_limit_global_max: PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_MAX,
      rate_limit_global_window_seconds: PORTAL_V2_CONFIG.RATE_LIMIT_GLOBAL_WINDOW_SECONDS,
      rate_limit_track_max: PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_MAX,
      rate_limit_track_window_seconds: PORTAL_V2_CONFIG.RATE_LIMIT_TRACK_WINDOW_SECONDS,
      dedupe_seconds: PORTAL_V2_CONFIG.DEDUPE_SECONDS,
      write_issue_alert_enabled: PORTAL_V2_CONFIG.WRITE_ISSUE_ALERT_ENABLED,
      auto_reply_enabled: PORTAL_V2_CONFIG.AUTO_REPLY_ENABLED,
      auto_reply_route_overrides: PORTAL_V2_CONFIG.AUTO_REPLY_ROUTE_OVERRIDES || {}
    },
    managed_sheet_names: portalV2ManagedSheetSpecs_()
  };
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function portalV2InitializeSheets() {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  var ss = SpreadsheetApp.openById(sid);
  var specs = portalV2ManagedSheetSpecs_();
  for (var i = 0; i < specs.length; i += 1) {
    var spec = specs[i];
    var sheet = ss.getSheetByName(spec.sheetName);
    if (!sheet) sheet = ss.insertSheet(spec.sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, spec.header.length).setValues([spec.header]);
    }
  }
  portalV2RefreshDashboardSafe_();
  return { ok: true, initialized_sheets: specs.length };
}

function portalV2ResetSheets() {
  var sid = String(PORTAL_V2_CONFIG.SPREADSHEET_ID || '').trim();
  if (!sid) throw new Error('Missing PORTAL_V2_DATABASE_ID');
  var live = SpreadsheetApp.openById(sid);
  var specs = portalV2ManagedSheetSpecs_();
  var stamp = Utilities.formatDate(new Date(), 'Etc/UTC', 'yyyyMMdd_HHmmss');
  var archive = SpreadsheetApp.create('TSI Portal ' + String(PORTAL_V2_CONFIG.VERSION || 'v3').toUpperCase() + ' Archive ' + stamp + ' UTC');
  var meta = archive.getSheets()[0];
  meta.setName('archive_meta');
  meta.getRange(1, 1, 6, 2).setValues([
    ['archived_at_utc', portalV2Now_()],
    ['source_spreadsheet_id', sid],
    ['source_spreadsheet_name', live.getName()],
    ['managed_sheet_count', specs.length],
    ['archive_spreadsheet_id', archive.getId()],
    ['archive_spreadsheet_url', archive.getUrl()]
  ]);

  var archived = [];
  for (var i = 0; i < specs.length; i += 1) {
    var spec = specs[i];
    var liveSheet = live.getSheetByName(spec.sheetName);
    if (!liveSheet) {
      liveSheet = live.insertSheet(spec.sheetName);
      liveSheet.getRange(1, 1, 1, spec.header.length).setValues([spec.header]);
    }

    var archiveSheet = archive.getSheetByName(spec.sheetName);
    if (!archiveSheet) archiveSheet = archive.insertSheet(spec.sheetName);
    var values = liveSheet.getDataRange().getValues();
    if (values.length && values[0].length) {
      archiveSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    } else {
      archiveSheet.getRange(1, 1, 1, spec.header.length).setValues([spec.header]);
    }

    liveSheet.clearContents();
    liveSheet.getRange(1, 1, 1, spec.header.length).setValues([spec.header]);
    archived.push([spec.sheetName, values.length]);
  }

  meta.getRange(8, 1, archived.length + 1, 2).setValues([['sheet_name', 'rows_archived']].concat(archived));
  portalV2RefreshDashboardSafe_();
  return {
    ok: true,
    reset_sheets: specs.length,
    archive_spreadsheet_id: archive.getId(),
    archive_spreadsheet_url: archive.getUrl()
  };
}

function portalV2RouteTypes_() {
  return [
    PORTAL_V2_ROUTES.GOVERNMENT,
    PORTAL_V2_ROUTES.EDUCATION,
    PORTAL_V2_ROUTES.PRIVATE_SECTOR,
    PORTAL_V2_ROUTES.SMALL_BUSINESS,
    PORTAL_V2_ROUTES.PROFESSIONAL,
    PORTAL_V2_ROUTES.STUDENT,
    PORTAL_V2_ROUTES.EMPLOYMENT,
    PORTAL_V2_ROUTES.INVESTMENT,
    PORTAL_V2_ROUTES.PRESS,
    PORTAL_V2_ROUTES.INTERNSHIP
  ];
}

function portalV2ManagedSheetSpecs_() {
  var specs = [];
  var seen = {};
  var add = function (sheetName, header) {
    var safeName = String(sheetName || '').trim();
    if (!safeName || seen[safeName]) return;
    seen[safeName] = true;
    specs.push({ sheetName: safeName, header: header });
  };

  add(PORTAL_V2_CONFIG.MASTER_SHEET_NAME, PORTAL_V2_COLUMNS);
  var routes = portalV2RouteTypes_();
  for (var i = 0; i < routes.length; i += 1) {
    add(portalV2SheetTarget_(routes[i]).sheetName, PORTAL_V2_COLUMNS);
  }
  add(PORTAL_V2_CONFIG.FAIL_SHEET_NAME, portalV2FailHeader_());
  add(PORTAL_V2_CONFIG.MAIL_LOG_SHEET_NAME, [
    'timestamp_utc',
    'rout',
    'mail_type',
    'to',
    'from',
    'subject',
    'status',
    'provider',
    'error',
    'submission_id'
  ]);
  add(PORTAL_V2_CONFIG.BURST_SHEET_NAME, portalV2BurstHeader_());
  add(PORTAL_V2_CONFIG.INTERNAL_USERNAME_SHEET_NAME, portalV2InternalUsernameHeader_());
  add(PORTAL_V2_CONFIG.WRITE_ISSUES_SHEET_NAME, portalV2WriteIssueHeader_());
  if (PORTAL_V2_CONFIG.DASHBOARD_ENABLED) {
    add(PORTAL_V2_CONFIG.DASHBOARD_SHEET_NAME, portalV2DashboardHeader_());
  }
  return specs;
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
