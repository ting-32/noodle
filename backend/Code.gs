
/**
 * 麵廠訂單管理系統 - Google Apps Script 後端 (時間格式強化版 v3.4)
 */

// --- 核心初始化區域 ---

function ensureHeaders() { return initSheets(); }
function _sys_initSheetStructure() { return initSheets(); }

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = {
    "Orders": ["Date", "StoreName", "ItemName", "Quantity", "Status", "CreatedAt", "DeliveryTime"],
    "Stores": ["StoreName", "Phone", "Holidays", "DeliveryTime", "DefaultItems"],
    "Products": ["ItemName", "Unit"]
  };

  for (let sheetName in schema) {
    let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    let lastCol = sheet.getLastColumn();
    let existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    let requiredHeaders = schema[sheetName];
    requiredHeaders.forEach(header => {
      if (existingHeaders.indexOf(header) === -1) {
        let newColIndex = sheet.getLastColumn() + 1;
        sheet.getRange(1, newColIndex).setValue(header);
      }
    });
    
    if (sheet.getLastRow() < 1) {
      sheet.setFrozenRows(1);
    }
  }
  SpreadsheetApp.flush();
  return true;
}

function getHeaderMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { if (h) map[h] = i; });
  return map;
}

/**
 * 強大的時間格式化：確保產出 HH:mm
 */
function formatTimeValue(val) {
  if (!val) return "08:00";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT+8", "HH:mm");
  }
  
  let str = String(val).trim();
  // 使用正則表達式尋找 hh:mm 或 h:mm 模式
  let match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    let h = match[1].padStart(2, '0');
    let m = match[2];
    return h + ":" + m;
  }
  
  return str.substring(0, 5);
}

function doGet(e) {
  try {
    initSheets(); 
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 讀取店家
    const storeSheet = ss.getSheetByName("Stores");
    const storeMap = getHeaderMap(storeSheet);
    const storeData = storeSheet.getLastRow() > 1 ? storeSheet.getRange(2, 1, storeSheet.getLastRow() - 1, storeSheet.getLastColumn()).getValues() : [];
    const stores = storeData.map(row => {
      let defaults = [];
      try {
        const jsonStr = row[storeMap["DefaultItems"]];
        if (jsonStr) defaults = JSON.parse(jsonStr);
      } catch (e) {}

      return {
        storeName: String(row[storeMap["StoreName"]] || ""),
        phone: String(row[storeMap["Phone"]] || ""),
        holidayDates: String(row[storeMap["Holidays"]] || "").split(',').filter(s => s.trim() !== ""),
        deliveryTime: formatTimeValue(row[storeMap["DeliveryTime"]]),
        defaultItems: defaults
      };
    }).filter(s => s.storeName !== "");

    // 讀取品項
    const productSheet = ss.getSheetByName("Products");
    const productData = productSheet.getLastRow() > 1 ? productSheet.getRange(2, 1, productSheet.getLastRow() - 1, 2).getValues() : [];
    const products = productData.map(row => ({
      itemName: String(row[0] || ""),
      unit: String(row[1] || "")
    })).filter(p => p.itemName !== "");

    // 讀取訂單
    const orderSheet = ss.getSheetByName("Orders");
    const orderMap = getHeaderMap(orderSheet);
    const orderData = orderSheet.getLastRow() > 1 ? orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, orderSheet.getLastColumn()).getValues() : [];
    const orders = orderData.map((row, index) => ({
      id: "cloud_" + index,
      date: row[orderMap["Date"]] instanceof Date ? Utilities.formatDate(row[orderMap["Date"]], "GMT+8", "yyyy-MM-dd") : String(row[orderMap["Date"]]),
      storeName: String(row[orderMap["StoreName"]] || ""),
      itemName: String(row[orderMap["ItemName"]] || ""),
      quantity: Number(row[orderMap["Quantity"]] || 0),
      status: row[orderMap["Status"]] || 'pending',
      createdAt: row[orderMap["CreatedAt"]] instanceof Date ? Utilities.formatDate(row[orderMap["CreatedAt"]], "GMT+8", "yyyy-MM-dd HH:mm:ss") : String(row[orderMap["CreatedAt"]] || ""),
      deliveryTime: formatTimeValue(row[orderMap["DeliveryTime"]])
    })).filter(o => o.storeName !== "");

    return ContentService.createTextOutput(JSON.stringify({ v: "3.4", stores, products, orders }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "GET Fatal: " + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    initSheets(); 
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'saveOrders') {
      const sheet = ss.getSheetByName("Orders");
      const map = getHeaderMap(sheet);
      const colWidth = sheet.getLastColumn();
      const rows = postData.orders.map(o => {
        let row = new Array(colWidth).fill("");
        if (map["Date"] !== undefined) row[map["Date"]] = o.date;
        if (map["StoreName"] !== undefined) row[map["StoreName"]] = o.storeName;
        if (map["ItemName"] !== undefined) row[map["ItemName"]] = o.itemName;
        if (map["Quantity"] !== undefined) row[map["Quantity"]] = o.quantity;
        if (map["Status"] !== undefined) row[map["Status"]] = 'pending';
        if (map["CreatedAt"] !== undefined) row[map["CreatedAt"]] = new Date();
        if (map["DeliveryTime"] !== undefined) row[map["DeliveryTime"]] = "'" + formatTimeValue(o.deliveryTime);
        return row;
      });
      if (rows.length > 0) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, colWidth).setValues(rows);
    } 
    else if (action === 'saveStores') {
      const sheet = ss.getSheetByName("Stores");
      const map = getHeaderMap(sheet);
      const colWidth = sheet.getLastColumn();
      if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, colWidth).clearContent();
      const rows = postData.stores.map(s => {
        let row = new Array(colWidth).fill("");
        if (map["StoreName"] !== undefined) row[map["StoreName"]] = s.storeName;
        if (map["Phone"] !== undefined) row[map["Phone"]] = s.phone;
        if (map["Holidays"] !== undefined) row[map["Holidays"]] = s.holidayDates.join(',');
        if (map["DeliveryTime"] !== undefined) row[map["DeliveryTime"]] = "'" + formatTimeValue(s.deliveryTime);
        if (map["DefaultItems"] !== undefined) row[map["DefaultItems"]] = JSON.stringify(s.defaultItems || []);
        return row;
      });
      if (rows.length > 0) sheet.getRange(2, 1, rows.length, colWidth).setValues(rows);
    }
    else if (action === 'saveProducts') {
      const sheet = ss.getSheetByName("Products");
      if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).clearContent();
      const rows = postData.products.map(p => [p.itemName, p.unit]);
      if (rows.length > 0) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }

    SpreadsheetApp.flush();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", v: "3.4" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "POST Fatal: " + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
