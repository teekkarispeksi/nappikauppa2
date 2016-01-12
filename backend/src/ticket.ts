'use strict';

var config = require('../config/config.js');
import PDFDocument = require('pdfkit');
import qr = require('qr-image');

export interface ITicket {
  discount_group_title: string;
  production_performer: string;
  production_title: string;
  ticket_image_src: string;
  row: string;
  row_name: string;
  seat_number: string;
  section_title: string;
  show_date: string;
  show_time: string;
  show_title: string;
  ticket_id: string;
  ticket_hash: string;
  ticket_price: number;
  venue_description: string;
}

export function generatePdf(tickets: ITicket[]) {
  var margin = 50;
  var options = {size: 'A4', margins: {left: margin, right: margin, top: 72, bottom: 0}}; // A4: [595.28, 841.89]
  var width = 595.28;
  var height = 841.89;
  var doc = new PDFDocument(options);
  doc.registerFont('mp-bold', 'assets/fonts/MYRIADPRO-BOLD.ttf');
  doc.registerFont('mp', 'assets/fonts/MYRIADPRO-REGULAR.ttf');

  for (var i = 0; i < tickets.length; ++i) {
    var ticket = tickets[i];
    var title = ticket.production_performer + ' - ' + ticket.production_title;
    var discount = ticket.discount_group_title;
    var showDate = ticket.show_date + ' klo ' + ticket.show_time; // '20.4.2015 klo 19:00';
    var show = ticket.show_title; // 'Helsinki VI';
    // 'PERMANTO, RIVI 8, PAIKKA 154' for numbered, 'NUMEROIMATON' for unnumbered;
    var seat = ticket.row_name ? ticket.section_title + ', ' + ticket.row_name + ' ' + ticket.row + ', paikka ' + ticket.seat_number : ticket.section_title;
    var venueDescription = ticket.venue_description.split('\n');
    var venue = venueDescription[0]; // 'Aleksanterin teatteri, Helsinki';
    var address = venueDescription[1]; // 'Bulevardi 23-27 / Albertinkatu 32';
    var hash = ticket.ticket_hash;
    if (i > 0) {
      doc.addPage();
    }
    doc.rect(30, 30, 15, 135)
        .fill('rgb(254, 240, 53)') // yellow

        .font('mp-bold')
        .fill('#000000')
        .fontSize(19)
        .text(title.toUpperCase(), 60, 30)

        .font('mp')
        .text(discount, 60, 30, {align: 'right'})

        .font('mp-bold')
        .fontSize(21)
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
        .image(qr.imageSync(hash, {type: 'png', margin: 0, size: 3}), width - margin - (29 * 3), 77, {})
        // QR code has 29 blocks of width 3
        // bottom align: trial-and-error

        .image('assets/images/' + ticket.ticket_image_src, 0, height / 4, {width: width});
  }
  doc.end();
  return doc;
}
