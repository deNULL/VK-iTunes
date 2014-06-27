function ge(e) {
  return document.getElementById(e);
}
function num(n,cs) {
  n = n % 100;
  if ((n % 10 == 0) || (n % 10 > 4) || (n > 4 && n < 21)) {
    return cs[2];
  } else
  if (n % 10 == 1) {
    return cs[0];
  } else {
    return cs[1];
  }
}
function updateHeight() {
  //VK.callMethod("resizeWindow", 607, 130 + ge('list').clientHeight);
}
function handleFile(file) {
  var fr = new FileReader();
  fr.onloadend = loadPlaylist;

  fr.readAsText(file);
}

function query(m, url, post, cb) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      cb(xhr.responseText);
    }
  }
  xhr.open(m, url, true);
  if (m == "POST") {
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  }
  xhr.send(post);
}
var add_hash;
function mob_init(cb) {
  query("GET", "http://m.vk.com/audio?q=qew324l1ewq27421349", "", function(text) {
    var match = text.match(/"add_hash":"([^"]*)"/);
    add_hash = match[1];
    if (cb) cb();
  });
}
function mob_search(q, cb) {
  query("POST", "http://m.vk.com/audio", "_ajax=1&q=" + encodeURIComponent(q), function(text) {
    var res = JSON.parse(text);
    text = res[3][2];

    var regexp = /"audio([-0-9]+)_([-0-9]+)_search([-0-9]+)"[^]*?data-dur="([0-9]+)"[^]*?<span class="artist">(.*?)<\/span>[^]*?<span class="title">(.*?)<\/span>/gi;
    var match = regexp.exec(text);
    var res = [];
    while (match) {
      res.push({
        aid: match[2],
        owner_id: match[1],
        search_id: match[3],
        duration: match[4],
        artist: match[5],
        title: match[6]
      });
      match = regexp.exec(text);
    }

    cb(res);

  });
}
function mob_add(audio, cb, captcha_sid, captcha_key) {
  var params = "_ajax=1&act=add&audio=" + audio.owner_id + "_" + audio.aid + "_search" + audio.search_id + "&hash=" + add_hash;
  if (captcha_sid) {
    params += "&captcha_sid=" + captcha_sid + "&captcha_key=" + captcha_key;
  }
  query("POST", "http://m.vk.com/audio", params, function(text) {
    var res = JSON.parse(text);

    if (res[2] == 0) { // ok
      cb(true);
    } else
    if (res[2] == 2) { // captcha
      var captcha_img = res[4];
      var captcha_sid = res[5].captcha_sid;

      ge('captcha_wrap').style.display = 'block';
      document.body.style.overflow = 'hidden';
      ge('captcha_img').src = 'http://vk.com' + captcha_img;
      ge('captcha_send').onclick = function() {
        ge('captcha_wrap').style.display = 'none';
        document.body.style.overflow = 'auto';

        mob_add(audio, cb, captcha_sid, ge('captcha_key').value);
      }
      ge('captcha_cancel').onclick = function() {
        ge('captcha_wrap').style.display = 'none';
        document.body.style.overflow = 'auto';
      }
      ge('captcha_key').focus();
    } else {
      cb(false);
    }
  });
}
mob_init();

var cur = false;
function loadPlaylist(e) {
  var lines = this.result.split("\r");
  cur = [];
  var html = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].split("\t");
    if (line.length < 2) continue;

    var song = {
      title:        line[0],
      artist:       line[1],
      composer:     line[2],
      album:        line[3],
      collection:   line[4],
      genre:        line[5],
      size:         line[6],
      duration:     line[7],
      disc:         line[8],
      discs:        line[9],
      track:        line[10],
      tracks:       line[11],
      year:         line[12],
      changed:      line[13],
      added:        line[14],
      bitrate:      line[15],
      samplerate:   line[16],
      volume:       line[17],
      type:         line[18],
      equalizer:    line[19],
      comments:     line[20],
      playcount:    line[21],
      lastplay:     line[22],
      skipcount:    line[23],
      lastskip:     line[24],
      rating:       line[25],
      location:     line[26]
    };
    cur.push(song);

    html.push(
      '<div class="track" id="track' + (i - 1) + '">' +
        '<img class="loading" src="images/upload.gif"/>' +
        '<input class="check" id="selected' + (i - 1) + '" type="checkbox" disabled /> ' +
        '<b>' + song.artist + '</b> &mdash; ' + song.title + ' ' +
        '<span>(' + Math.round(song.duration / 60) + ':' + ((song.duration % 60) < 10 ? '0' : '') + (song.duration % 60) + ')</span>' +
      '</div>' +
      '<div class="matches" id="matches' + (i - 1) + '">' +
      '</div>'
    );
  }
  ge('list').innerHTML =
    '<div id="import_wrap" style="float: right"><img class="loading" style="display: block" src="images/upload.gif"/></div>' +
    '<h3 id="counter">' + cur.length + ' ' + num(cur.length, ['композиция', 'композиции', 'композиций']) + '</h3>' +
    'Если ничего не находится — попробуйте позже; через полчасика, скажем.' +
    html.join('');
  updateHeight();
  for (var i = 0; i < cur.length; i++) {
    (function(i){
      ge('selected' + i).onclick = function(event) {
        select(i, this.checked);
        event.stopPropagation();
      }
      ge('track' + i).onclick = function(event) {
        toggle(i);
      }
    })(i);
  }

  startScan();
}
function toggle(index) {
  ge('matches' + index).style.display =
    (ge('matches' + index).style.display == 'block') ? 'none' : 'block';
  updateHeight();
}
function select(index, checked) {
  for (var i = 1; i < cur[index].matches.length; i++) {
    ge('match' + index + '_' + i).checked = checked ? (i == cur[index].best_match - 1) : false;
  }
}

var idx = 0;
var left = 0;
var found = 0;
var scanTimer;
function startScan() {
  idx = 0;
  left = cur.length;
  found = 0;
  scanIteration();
  scanTimer = setInterval(scanIteration, 500);
}
function scanIteration() {
  var code = [];
  var index = idx;
  var song = cur[idx];
  ge('track' + idx).getElementsByClassName('loading')[0].style.display = 'block';

  mob_search((song.artist + ' ' + song.title).replace(/['"&]/g, ' '), function(result) {
    var elem = ge('track' + index);
    elem.getElementsByClassName('loading')[0].style.display = 'none';
    var check = elem.getElementsByClassName('check')[0];

    check.checked = (result.length > 0);
    check.disabled = !(result.length > 0);
    found += (result.length > 0) ? 1 : 0;

    var html = [];
    var best_match = 1;
    for (var j = 0; j < result.length; j++) {
      if (diff(cur[index], result[j]) < diff(cur[index], result[best_match])) {
        best_match = j;
      }
    }
    cur[index].best_match = best_match;
    cur[index].matches = result;
    for (var j = 0; j < result.length; j++) {
      html.push(
        '<label class="match" for="match' + index + '_' + j + '" style="' + ((j == result.length - 1) ? 'border-bottom: 1px solid #bbb' : '') + '">' +
          '<input class="check" id="match' + index + '_' + j + '" name="match' + index + '" value="' + j + '" type="radio"' + (j == best_match ? ' checked' : '') + '/> ' +
          '<b>' + result[j].artist + '</b> &mdash; ' + result[j].title + ' ' +
          '<span>(' + Math.round(result[j].duration / 60) + ':' + ((result[j].duration % 60) < 10 ? '0' : '') + (result[j].duration % 60) + ')</span>' +
        '</label>'
      );
    }
    ge('matches' + index).innerHTML = html.join('');
    ge('counter').innerHTML = cur.length + ' ' + num(cur.length, ['композиция', 'композиции', 'композиций']) + ' (найдено ' + found + ')';
    left--;
    if (left <= 0) {
      scanFinish();
    }
  });

  idx++;
  if (idx >= cur.length) {
    clearInterval(scanTimer);
  }
}
function diff(source, found) {
  var result = 0;
  result += Math.abs(source.duration - found.duration) * 5;
  result += Math.abs(source.artist.length - found.artist.length);
  result += Math.abs(source.title.length - found.title.length);
  return result;
}
function scanFinish() {
  ge('import_wrap').innerHTML = '<div class="button_blue" id="import_button"><button>Импортировать выбранные</button></div>';
  ge('import_button').onclick = doImport;
}

var importTimer;
var added = 0;
var lastTime = 0;
function doImport() {
  idx = 0;
  added = 0;
  left = cur.length;
  importIteration();
  ge('import_wrap').innerHTML = '<img class="loading" style="display: block" src="images/upload.gif"/>';
}
function importIteration() {
  while (idx < cur.length && !ge('selected' + idx).checked) {
    idx++;
    left--;
  }
  if (idx >= cur.length) return;

  var match;
  for (var j = 0; j < cur[idx].matches.length; j++) {
    if (ge('match' + idx + '_' + j).checked) {
      match = cur[idx].matches[j];
      break;
    }
  }

  ge('track' + idx).getElementsByClassName('loading')[0].style.display = 'block';

  lastTime = new Date();
  mob_add(match, function(success) {
    var elem = ge('track' + idx);
    elem.getElementsByClassName('loading')[0].style.display = 'none';
    var check = elem.getElementsByClassName('check')[0];

    check.checked = success;
    check.disabled = true;
    idx++;
    added++;
    left--;

    ge('counter').innerHTML = cur.length + ' ' + num(cur.length, ['композиция', 'композиции', 'композиций']) + ' (добавлено ' + added + ')';
    if (left <= 0) {
      importFinish();
    } else {
      importIteration();
    }
  });
}
function importFinish() {
  ge('import_wrap').innerHTML = '<span style="color: #bbb">готово</span>';
}

var dropbox = ge('dropbox');
dropbox.addEventListener("dragenter", function(e) {
  dropbox.className = "dropbox_active";
  e.stopPropagation();
  e.preventDefault();
}, false);
dropbox.addEventListener("dragleave", function(e) {
  dropbox.className = "";
  e.stopPropagation();
  e.preventDefault();
}, false);
dropbox.addEventListener("dragover", function(e) {
  dropbox.className = "dropbox_active";
  e.stopPropagation();
  e.preventDefault();
}, false);
dropbox.addEventListener("drop", function(e) {
  dropbox.className = "";
  e.stopPropagation();
  e.preventDefault();

  var dt = e.dataTransfer;
  var files = dt.files;

  if (files.length) {
    handleFile(files[0]);
  }
}, false);
ge('file').addEventListener("change", function(e) {
  handleFile(this.files[0]);
}, false);