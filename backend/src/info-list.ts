var config = require('../config/config.js');

import log = require('./log');
import { mailer } from './mail';
import { IOrder } from './order';
import { resolve } from 'dns';

// List address
const listAddress = `${config.email.info_list.name}@${config.email.mailgun.domain}`;

// Info list
const list = mailer.lists(listAddress);

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
      subscribed: true,
      address: order.email,
      name: order.name,
    };

    // Enquene add to next event loop iteration
    setImmediate(() => {
      list.members().create(user, (err, _) => {
        // Check if user is added to mailing list already.
        // Unfortunately we have to relay only to parsing
        // of error message.
        // If user is already added to mailing list, just update user information
        if (err.message && err.message.includes('Address already exists')) {

          log.info(`MAILING LIST: Updating customer on mailing list`, {order_id: order.order_id, email: order.email});

          // Update subroutine
          list.members().update(user, (err2, _) => {
            if (err2) {
              log.error(`MAILING LIST: Updating customer on mailing list failed`, {order_id: order.order_id, email: order.email, error: err});

              return;
            }
            log.info(`MAILING LIST: Updated customer on mailing list`, {order_id: order.order_id, email: order.email});

          });
          // Exit after update is triggered
          return;
        } else if (err) {
          log.error(`MAILING LIST: Adding customer to mailing list failed`, {order_id: order.order_id, email: order.email, error: err});
          return;
        }

        log.info(`MAILING LIST: Added customer to mailing list`, {order_id: order.order_id, email: order.email});

        // TODO: Send welcome message here
      });
    });
  }
}
