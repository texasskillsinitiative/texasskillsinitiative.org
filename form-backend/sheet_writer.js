function appendRowToSheet(rowArray) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // create header row if sheet was newly created
    sheet.appendRow(SHEET_COLUMNS);
  }
  sheet.appendRow(rowArray);
}

function notifyAdmin(subject, body) {
  if (!CONFIG.ADMIN_EMAIL) return;
  try {
    // Sanitize subject and body to prevent email header injection (CRLF injection).
    // Strip CR/LF and header-like keywords that could inject additional recipients.
    subject = String(subject || '').replace(/[\r\n]/g, ' ').substring(0, 200);
    body = String(body || '').replace(/\r\n/g, '\n');
    // Remove lines that look like email headers to prevent Bcc/Cc injection
    body = body.replace(/^(Bcc|Cc|Subject|To|From):\s*/gmi, '');
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
  } catch (e) {
    console.error('notifyAdmin failed: ' + e);
  }
}

function appendToNamedSheet(sheetName, headerArray, rowArray) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headerArray && headerArray.length) sheet.appendRow(headerArray);
  } else {
    // If sheet exists but has no header and headerArray provided, try to set it when empty
    try {
      var lastCol = sheet.getLastColumn();
      var lastRow = sheet.getLastRow();
      if ((!lastRow || lastRow === 0) && headerArray && headerArray.length) sheet.appendRow(headerArray);
    } catch (e) { /* ignore */ }
  }
  sheet.appendRow(rowArray);
}
