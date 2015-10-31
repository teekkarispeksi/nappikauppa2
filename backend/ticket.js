'use strict';

var config = require('../config/config.js');
var db = require('./db.js');
var PDFDocument = require('pdfkit');

var ticket = {
  generatePdf: function(tickets) {

    var doc = new PDFDocument();
    doc.registerFont('mp-bold', 'assets/fonts/MYRIADPRO-BOLD.ttf');
    doc.registerFont('mp', 'assets/fonts/MYRIADPRO-REGULAR.ttf');

    for (var i = 0; i < tickets.length; ++i) {
      var ticket = tickets[i];
      var discount = ticket.discount_group_title;
      var showDate = ticket.show_date + ' klo ' + ticket.show_time; //'20.4.2015 klo 19:00';
      var show = ticket.show_title; //'Helsinki VI';
      var seat = ticket.section_title + ', ' + ticket.row_name + ' ' + ticket.row + ', paikka ' + ticket.seat_number; //'PERMANTO, RIVI 8, PAIKKA 154';
      var venueDescription = ticket.venue_description.split('\n');
      var venue = venueDescription[0]; //'Aleksanterin teatteri, Helsinki';
      var address = venueDescription[1]; //'Bulevardi 23-27 / Albertinkatu 32';
      if (i > 0) {
        doc.addPage();
      }
      doc.rect(30, 30, 15, 135)
          .fill([254, 240, 53]) // yellow

          .font('mp-bold')
          .fill('#000000')
          .fontSize(21)
          .text(config.title.toUpperCase(), 60, 30)

          .font('mp')
          .text(discount, 60, 30, {align: 'right'})

          .moveUp(0.2)
          .font('mp-bold')
          .text(show)

          .moveUp(0.2)
          .font('mp')
          .fontSize(16)
          .text(showDate)

          .moveDown(0.8)
          .font('mp-bold')
          .text(seat.toUpperCase())

          .moveDown(0.8)
          .font('mp')
          .text(venue)

          .moveUp(0.2)
          .fontSize(9)
          .text(address)
    }
    doc.end();
    return doc;
  }

};

module.exports = ticket;
