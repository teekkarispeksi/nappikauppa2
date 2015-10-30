'use strict';

var db = require('./db.js');
var PDFDocument = require('pdfkit');

var ticket = {
  generatePdf: function(tickets) {

    var doc = new PDFDocument();
    for (var i = 0; i < tickets.length; ++i) {
      var ticket = tickets[i];
      var discount = ticket.discount_group_title;
      var showDate = ticket.show_date + ' klo ' + ticket.show_time; //'20.4.2015 klo 19:00';
      var show = ticket.show_title; //'Helsinki VI';
      var seat = ticket.section_title + ', ' + ticket.row_name + ' ' + ticket.row + ', ' + ' paikka ' + ticket.seat_number; //'PERMANTO, RIVI 8, PAIKKA 154';
      var venueDescription = ticket.venue_description.split('\n');
      var venue = venueDescription[0]; //'Aleksanterin teatteri, Helsinki';
      var address = venueDescription[1]; //'Bulevardi 23-27 / Albertinkatu 32';
      if (i > 0) {
        doc.addPage();
      }
      doc.fontSize(20)
          .text(discount, 50, 80, {align: 'right'})
          .text('Pääsylippu', 50, 80)
          .moveTo(50, 120)
          .lineTo(550, 120)
          .stroke()
          .moveDown()
          .font('Helvetica-Bold')

          .text(show + ' - ' + showDate)
          .font('Helvetica')
          .moveDown(0.5)

          .text(seat.toUpperCase())
          .font('Helvetica-Bold', 13)
          .text(venue)
          .font('Helvetica', 13)
          .text(address)
          .moveTo(50, 250)
          .font('Helvetica', 13)
          .lineWidth(2)
          .lineTo(550, 250)
          .stroke()

          .text('Teekkarispeksi ry', 50, 260)
          .text('liput@teekkarispeksi.fi', 405, 260);
    }
    doc.end();
    return doc;
  }

};

module.exports = ticket;
