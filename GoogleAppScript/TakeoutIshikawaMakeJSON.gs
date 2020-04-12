function myFunction() {

  // Yahoo app ID ( https://e.developer.yahoo.co.jp/register で新規アプリを登録 )
  var yahooAppID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  
  // スプレッドシートのURL
  var spreadsheetURL="https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/edit";
  
  // GoogleドライブのフォルダID : Googleドライブでフォルダを開いた際の以下の*****の部分 "https://drive.google.com/drive/u/1/folders/*****";  
  var googleDriveFolderID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

  // Googleドライブに保存する店舗情報ファイル （保存用フォルダとデータのバックアップ用フォルダを作っておきます）
  var StoreListFolderName = 'TakeoutIshikawa';
  var BackupFolderName = 'backup';
  var StoreListFileName = 'StoreList.json'; // https://drive.google.com/uc?id=<ファイルID>
  
  // 住所から緯度経度算出できなかった場合のデフォルト位置 （例:金沢駅）
  var initialLon = 136.6482;
  var initialLat = 36.5780;

//  var keyList=["name","description","longitude","latitude","flg_takeout","flg_delivery"];

  var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetURL);
  var sheet = spreadsheet.getSheetByName('FormAnswer');

  var rowIndex = 1;
  var colStartIndex = 2;
  var rowNum = 1;
  var data = sheet.getRange(rowIndex + 1, colStartIndex, sheet.getLastRow(), sheet.getLastColumn()).getValues();

  var list = [];
  data.forEach(function(element,index){
    if(element[0]){
      var row = index+2;
      var lon = sheet.getRange("I"+row).getValue();
      var lat = sheet.getRange("J"+row).getValue();
      if(lon.length<1){
        lot = initialLon;
        lan = initialLat;
        // Geocoding
        if(element[0].length){
          var addressStr = element[2];
          var geo = getLatLon(addressStr);
          if(geo.length){
            var value = geo.split(',');
            lon = value[0];
            lat = value[1];
            sheet.getRange("I"+row).setFontColor('#000000');
            sheet.getRange("J"+row).setFontColor('#000000');
          }
          else {
            sheet.getRange("I"+row).setFontColor('#FF0000');
            sheet.getRange("J"+row).setFontColor('#FF0000');
          }
          
          // 緯度経度をスプレッドシートに書き込み
          sheet.getRange("I"+row).setValue(lon);
          sheet.getRange("J"+row).setValue(lat);        
        }    
      }
      // JSONを作成
      var entry = {};
      entry['name'] = element[0];
      entry['description'] = element[1]+"<br>住所: "+element[2]+"<br>電話: <a href='tel:"+element[3]+"'>"+element[3]+"</a><br>ホームページ: <a href='"+element[4]+"' target=_blank>"+element[4]+"</a><br>SNS: <a href='"+element[5]+"' target=_blank>"+element[5]+"</a>";
      entry['longitude'] = ''+lon;
      entry['latitude']  = ''+lat;
      entry['flg_takeout'] = '1';
      entry['flg_delivery'] = (element[6].length?'1':'0');
      list[index] = entry;
    }
  });

  var outStrJson = JSON.stringify(list);

  var StoreListFolder = DriveApp.getFolderById(DriveApp.getFoldersByName(StoreListFolderName).next().getId());
  var files = StoreListFolder.getFilesByName(StoreListFileName);
  if(files.hasNext()){
    var file = StoreListFolder.getFilesByName(StoreListFileName).next();
    var BackupFolder = StoreListFolder.getFoldersByName(BackupFolderName).next();
    BackupFolder.addFile(file);
    //StoreListFolder.removeFile(file);
    file.setContent(outStrJson);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }
  else {
    StoreListFolder.createFile(StoreListFileName, outStrJson, MimeType.PLAIN_TEXT);
  }

//  Browser.msgBox(outStrJson);

  
/* ----- Helper Functions ----- */

  function getLatLon(addressStr){
    var geocodingQuery="https://map.yahooapis.jp/geocode/V1/geoCoder?output=json&recursive=true&sort=score&results=1&appid="+yahooAppID+"&query="+addressStr;
    const response = UrlFetchApp.fetch(geocodingQuery);
    const contents = response.getContentText();
    const contentJson = JSON.parse(contents);
    const feature = contentJson.Feature;
    var coord = "";
    if(feature){
      coord = feature[0].Geometry.Coordinates;
    }
    return coord;

  }
  
}