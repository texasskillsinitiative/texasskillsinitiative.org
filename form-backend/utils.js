function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // basic email regex: allow most normal emails, keep it simple
  var re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email.trim());
}

function nowUtcIso() {
  return new Date().toISOString();
}

function jsonResponse(obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  if (out.setHeader) {
    out.setHeader('Access-Control-Allow-Origin', '*');
    out.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    out.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return out;
}

function escapeCellValue(v, maxLen) {
  // Escape formula-starting characters to prevent Google Sheets formula injection.
  // If value starts with =, @, +, or -, prepend a single quote to force text interpretation.
  if (v === undefined || v === null) return '';
  v = String(v);
  if (maxLen && v.length > maxLen) v = v.slice(0, maxLen);
  // Prepend single quote if starts with formula prefix
  if (/^[=@+\-]/.test(v)) return "'" + v;
  return v;
}

// Deprecated: use escapeCellValue() instead
function safeString(v, maxLen) {
  return escapeCellValue(v, maxLen);
}
