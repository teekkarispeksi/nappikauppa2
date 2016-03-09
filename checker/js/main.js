'use strict';
/* globals _, $, Storage, qrcode */

// Inspiration got from:
// - QRCODE reader Copyright 2011 Lazar Laszlo
//   http://www.webqr.com
// - webrtc samples
//   https://github.com/webrtc/samples

var gCtx = null;
var videoElement = document.querySelector('video');
var timeout = null;
var bgTimeout = null;
var videos = null;
var dateObj = new Date();
var today = dateObj.getDate() + '.' + (dateObj.getMonth() + 1) + '.' + (dateObj.getYear() + 1900);

Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
  var value = this.getItem(key);
  return value && JSON.parse(value);
};

function checkTicketId(id) {
  clearTimeout(timeout);
  clearTimeout(bgTimeout);
  $('#reset').attr('disabled', false);
  var ticket = localStorage.getObject(id);
  showTicket(ticket ? ticket : id);
  if (ticket === null) {
    document.body.style.backgroundColor = 'red';
    stopScan();
    return 'Lippua ei löydy';
  } else if (ticket.used_time !== null) {
    document.body.style.backgroundColor = 'orange';
    stopScan();
    return 'Lippu käytetty ' + ticket.used_time;
  } else if (ticket.show_date !== today) {
    document.body.style.backgroundColor = 'yellow';
    stopScan();
    return 'Väärä näytös! ' + ticket.show_date + ' ' + ticket.show_title;
  } else {
    document.body.style.backgroundColor = 'green';
    bgTimeout = setTimeout(reset, 2000);
    ticket.used_time = Date();
    localStorage.setObject(id, ticket);
    var used = localStorage.getObject('used') || [];
    used.push(id);
    localStorage.setObject('used', used);
    $('#fetch').attr('disabled', true);
    $('#save').attr('disabled', false);
    return 'ok';
  }
}

function initCanvas(w, h) {
  var canvas = document.getElementById('qr-canvas');
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = w;
  canvas.height = h;
  gCtx = canvas.getContext('2d');
  gCtx.clearRect(0, 0, w, h);
}

function captureToCanvas() {
  try {
    gCtx.drawImage(videoElement,0,0,720,940);
    try {
      qrcode.decode(); // by default reads element with id "qr-canvas"
    } catch (e) {
      scheduleScan();
    }
  } catch (e) {
    scheduleScan();
  }
}

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setResult(result) {
  document.getElementById('result').innerHTML = result;
}

function setDebugMsg(msg) {
  document.getElementById('debug').innerHTML = msg;
}

function read(res) {
  var output = htmlEntities(res);
  setResult(checkTicketId(output));
}

function load() {
  initCanvas(720, 940);
  qrcode.callback = read;

  navigator.mediaDevices.enumerateDevices()
      .then(gotDevices)
      .then(setVideo)
      .catch(onError);

  if (localStorage.getObject('used')) {
    reset();
  } else {
    fetch();
  }
}

function gotDevices(deviceInfos) {
  videos = deviceInfos.filter(function(d) { return d.kind === 'videoinput'; });
  $('#videoDevices').empty();
  videos.forEach(function(device) {
    var deviceTitle = device.label + ' (' + device.deviceId.substr(0,5) + ')';
    $('#videoDevices').append('<option value="' + device.deviceId + '">' + deviceTitle + '</option>');
  });
  var videoDevice = localStorage.getItem('video');
  if (!videoDevice) {
    var rear = videos.filter(function(d) { return d.label.indexOf('back') > -1 || d.label.indexOf('rear') > -1; });
    var device = rear.length > 0 ? rear[0] : videos[videos.length - 1];
    videoDevice = device.deviceId;
  }
  return videoDevice;
}

function selectVideo(videoSource) {
  localStorage.setItem('video', videoSource);
  location.reload();
}

function setVideo(videoSource) {
  $('#videoDevices').val(videoSource);
  var constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };

  navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
          window.stream = stream; // make stream available to console
          videoElement.srcObject = stream;
        })
        .catch(onError);
}

function scheduleScan() {
  $('#stopPlaceholder').hide();
  $('#v').show();
  timeout = setTimeout(captureToCanvas, 300);
}

function stopScan() {
  clearTimeout(timeout);
  $('#stopPlaceholder').show();
  $('#v').hide();
}

function onError(error) {
  console.error(error);
}

function reset() {
  document.body.style.backgroundColor = null;
  setResult('Valmis! Etsitään QR-koodia...');
  $('#reset').attr('disabled', true);
  scheduleScan();
}

function fetch() {
  clearTimeout(timeout);
  setResult('Päivitetään tietoja lippukaupasta...');
  $.get('../checker-api/all', function(tickets) {
    tickets.forEach(function(ticket) {
      localStorage.setObject(ticket.hash, ticket);
    });
    reset();
  }).fail(function() {
    setResult('Ongelma lippukaupassa. Tarkista verkkoyhteys, pyydä apua koodareilta');
  });
}

function save() {
  var used = localStorage.getObject('used') || [];
  var used_tickets = [];
  for (var i = 0; i < used.length; ++i) {
    var ticket = localStorage.getObject(used[i]);
    if (ticket && ticket.used_time) {
      used_tickets.push(ticket);
    }
  }
  $.ajax({
    url: '../checker-api/use',
    method: 'POST',
    data: JSON.stringify(used_tickets),
    contentType: 'application/json',
    success: function() {
      setResult('Tallennettu!');
      localStorage.removeItem('used');
      $('#save').attr('disabled', true);
      $('#fetch').attr('disabled', false);
    }});
}

function showTicket(ticket) {
  if ('string' === typeof ticket) {
    ticket = {hash: ticket};
  }
  $('#hash').text(ticket.hash);
  $('#ticket_id').text(ticket.id);
  $('#order_id').text(ticket.order_id);
  $('#used_time').text(ticket.used_time);
  $('#discount_group').text(ticket.discount_group);
  $('#show').text(ticket.show_title + ' ' + ticket.show_date);
  $('#seat').text(ticket.section_title + ', ' + ticket.row_name + ' ' + ticket.row + ', paikka ' + ticket.seat);
}

load();
