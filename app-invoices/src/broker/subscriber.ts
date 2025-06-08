import { setTimeout } from 'node:timers/promises';

import { orders } from './channels/orders.ts';
import type { OrderCreatedMessage } from '../../../contracts/messages/order-created-message.ts';
import { dispatchInvoiceCreated } from './messages/invoice-created.ts';

orders.consume(
  'orders',
  async (raw) => {
    if (!raw) {
      return;
    }

    const message: OrderCreatedMessage = JSON.parse(raw.content.toString());

    // Simulate invoice creation
    console.log('Creating invoice for order:', message.orderId);
    await setTimeout(3000);

    dispatchInvoiceCreated({
      orderId: message.orderId,
    });

    orders.ack(raw);
  },
  {
    noAck: false,
  }
);
