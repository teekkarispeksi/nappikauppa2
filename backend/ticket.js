'use strict';

var db = require('./db.js');
var PDFDocument = require('pdfkit');

var ticket = {
  //TODO
  getParameters: function (order_id, cb) {

    db.query('select * from nk2_tickets where order_id = :order_id',
      {order_id: order_id},
      function (err, res) {
        if (err) {
          throw err;
        }
        cb(res);
      });

    //Todo
  },

  generatePdf: function () {

    var doc = new PDFDocument;


    //TODO, get these values from database
    var showDate = '20.4.2015 klo 19:00';
    var show = 'Helsinki VI';
    var seat = 'PERMANTO, RIVI 8, PAIKKA 154';
    var venue = 'Aleksanterin teatteri, Helsinki';
    var venueLocation = 'Bulevardi 23-27 / Albertinkatu 32';

    doc.fontSize(20)
        .text('Pääsylippu', 100, 80)
        .moveTo(100, 120)
        .lineTo(500, 120)
        .stroke()
        .moveDown()
        .font('Helvetica-Bold')

        .text(show + ' - ' + showDate)
        .font('Helvetica')
        .moveDown(0.5)

        .text(seat)
        .font('Helvetica-Bold', 13)
        .text(venue)
        .font('Helvetica', 13)
        .text(venueLocation)
        .moveTo(100, 390)
        .font('Helvetica', 13)
        .lineWidth(2)
        .lineTo(500, 390)
        .stroke()

        .text('Teekkarispeksi ry', 100, 400)
        .text('liput@teekkarispeksi.fi', 365, 400)
        .end();

    return doc;
  }


};

module.exports = ticket;
