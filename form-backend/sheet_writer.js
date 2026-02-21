function appendRowToSheet(rowArray) {
  appendRowForSubmissionType('stakeholder', rowArray);
}

function appendRowForSubmissionType(submissionType, rowArray) {
  var target = resolveSubmissionSheetTarget(submissionType);
  appendRowToSheetTarget(target, rowArray);
}

function appendRowToSheetTarget(target, rowArray) {
  var resolvedTarget = target || {};
  var sheetId = requireSpreadsheetIdFromTarget_(resolvedTarget.spreadsheetId || CONFIG.SPREADSHEET_ID);
  var sheetName = String(resolvedTarget.sheetName || CONFIG.SHEET_NAME || 'responses');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(SHEET_COLUMNS);
  }
  sheet.appendRow(rowArray);
}

function appendToNamedSheet(sheetName, headerArray, rowArray) {
  appendToNamedSheetTarget(
    { spreadsheetId: CONFIG.SPREADSHEET_ID },
    sheetName,
    headerArray,
    rowArray
  );
}

function appendToNamedSheetForSubmissionType(submissionType, sheetName, headerArray, rowArray) {
  var target = resolveSubmissionSheetTarget(submissionType);
  appendToNamedSheetTarget(target, sheetName, headerArray, rowArray);
}

function appendToNamedSheetTarget(target, sheetName, headerArray, rowArray) {
  var resolvedTarget = target || {};
  var resolvedSheetId = requireSpreadsheetIdFromTarget_(resolvedTarget.spreadsheetId || CONFIG.SPREADSHEET_ID);
  var ss = SpreadsheetApp.openById(resolvedSheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headerArray && headerArray.length) sheet.appendRow(headerArray);
  } else {
    try {
      var lastRow = sheet.getLastRow();
      if ((!lastRow || lastRow === 0) && headerArray && headerArray.length) sheet.appendRow(headerArray);
    } catch (e) { /* ignore */ }
  }
  sheet.appendRow(rowArray);
}

function resolveSubmissionSheetTarget(submissionType) {
  var type = String(submissionType || '').toLowerCase();
  if (type === 'investor') {
    return {
      spreadsheetId: CONFIG.INVESTOR_SPREADSHEET_ID || CONFIG.SPREADSHEET_ID,
      sheetName: CONFIG.INVESTOR_SHEET_NAME || CONFIG.SHEET_NAME
    };
  }
  if (type === 'employment') {
    return {
      spreadsheetId: CONFIG.EMPLOYMENT_SPREADSHEET_ID || CONFIG.SPREADSHEET_ID,
      sheetName: CONFIG.EMPLOYMENT_SHEET_NAME || CONFIG.SHEET_NAME
    };
  }
  return {
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    sheetName: CONFIG.SHEET_NAME
  };
}

function requireSpreadsheetIdFromTarget_(spreadsheetId) {
  var sheetId = String(spreadsheetId || '').trim();
  if (!sheetId) {
    throw new Error('Missing spreadsheet id for target sheet write.');
  }
  return sheetId;
}

function notifyAdmin(subject, body) {
  if (!CONFIG.ADMIN_EMAIL) return;
  try {
    subject = String(subject || '').replace(/[\r\n]/g, ' ').substring(0, 200);
    body = String(body || '').replace(/\r\n/g, '\n');
    body = body.replace(/^(Bcc|Cc|Subject|To|From):\s*/gmi, '');
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
  } catch (e) {
    console.error('notifyAdmin failed: ' + e);
  }
}

function requireSpreadsheetId_() {
  var sheetId = String(CONFIG.SPREADSHEET_ID || '').trim();
  if (!sheetId) {
    throw new Error('Missing CONFIG.SPREADSHEET_ID. Set Script Property SPREADSHEET_ID before deploy.');
  }
  return sheetId;
}
