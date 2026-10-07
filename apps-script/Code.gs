/**
 * Bending Test Quiz – CE 306 Lab
 * Google Apps Script Web App that receives one quiz result per POST
 * and appends it as a row to the sheet this script is attached to.
 *
 * Columns: Timestamp | Name | Student ID | Q1 answer | Q2 answer | Q3 answer | Score (out of 3)
 */

var SHEET_NAME = 'Results';
var HEADERS = ['Timestamp', 'Name', 'Student ID', 'Q1 answer', 'Q2 answer', 'Q3 answer', 'Score (out of 3)'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // one write at a time, so rows from many phones never collide

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      clean_(data.name),
      clean_(data.studentId),
      clean_(data.q1),
      clean_(data.q2),
      clean_(data.q3),
      Number(data.score) || 0
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the Web App URL in a browser to check that it is live.
function doGet() {
  return ContentService.createTextOutput('Bending Test Quiz endpoint is running.');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// Trim, limit length, and stop text like "=..." from being treated as a formula.
// Student IDs keep a leading apostrophe so Sheets stores them as text (no lost zeros).
function clean_(value) {
  var s = String(value == null ? '' : value).trim().slice(0, 200);
  if (/^[=+\-@]/.test(s) || /^\d+$/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
