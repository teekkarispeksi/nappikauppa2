var config = require('../config/config.js');

import { list } from 'pdfkit';
import log = require('./log');
import { mailer, sendMail } from './mail';
import { IOrder } from './order';

// List address
const listAddress = `${config.email.info_list.name}@${config.email.mailgun.domain}`;

const listFrom = config.email.info_list.from;
const listTag = config.email.info_list.tag;

// Info list welcome subject
const WELCOME_SUBJECT = `${listTag} Tervetuloa teekkarispeksi liput info listalle`;

// Info list welcome message
function getWelcomeMessageText(order: IOrder): string {
  return `
  Hei ${order.name},

  Tervetuloa Teekkarispeksi ry:n lippukaupan tiedotuslistalle. Tätä kautta saat tiedon
  Teekkarispeksi ry:n tulevista produktioista, sekä isännöimistämme vierasnäytöksistä.

  Lisätietoa yhdistyksestä löytyy osoitteesta https://teekkarispeksi.fi ja listan
  tietosuojaseloste osoitteesta https://rekisterit.teekkarispeksi.fi/lippukauppa-info .

  Ystävällisin terveisin
  Teekkarispeksi
  `;
}

/**
 * Adds order to mailing list, does not return status promise,
 * but instead enquenes add operation to be executed asyncronosly on background
 * @param order Order for adding to mailing list
 */
export function addOrderToMailingList(order: IOrder) {
  // Check that user wants email
  if (order.wants_email) {

    log.info(`MAILING LIST: Adding customer to mailing list`, {order_id: order.order_id, email: order.email});
    const user = {
      address: order.email,
      name: order.name,
    };

    // Enquene add to next event loop iteration
    setImmediate( async () => {
      try {
        await mailer.lists.members.createMember(
          listAddress,
          {
            ...user,
            subscribed: 'yes',
        });

        log.info(`MAILING LIST: Added customer to mailing list`, {order_id: order.order_id, email: order.email});

        send_welcome_message(order);

      } catch(error) {
        // Check if user is added to mailing list already.
        // Unfortunately we have to relay only to parsing
        // of error message.
        // If user is already added to mailing list, just update user information
        if (error.details && error.details.includes('Address already exists')) {
          log.info(`MAILING LIST: Updating customer on mailing list`, {order_id: order.order_id, email: order.email});
          try {
            await mailer.lists.members.updateMember(listAddress, order.email, {
                ...user,
                subscribed: 'yes'
              });

            log.info(`MAILING LIST: Updated customer on mailing list`, {order_id: order.order_id, email: order.email});
          } catch (updateError) {
            log.error(`MAILING LIST: Update customer on mailing list failed`, {order_id: order.order_id, email: order.email, error: updateError});
          }
        } else {
          log.error(`MAILING LIST: Adding customer to mailing list failed`, {order_id: order.order_id, email: order.email, error});
        }
      }
    });
  }
}

/**
 * Send welcome to mailing list message to user
 * @param order Order
 */
function send_welcome_message(order: IOrder): void {
  const message = {
    from: listFrom,
    to: order.email,
    subject: WELCOME_SUBJECT,
    text: getWelcomeMessageText(order),
  };
  sendMail(message)
  .then(() => log.info('MAILING LIST: Sent welcome message', {order_id: order.order_id, email: order.email}))
  .catch(error => log.error('MAILING LIST: Failed to send welcome message',  {error, order_id: order.order_id, email: order.email}));
}
