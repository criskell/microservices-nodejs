import { eq } from 'drizzle-orm';
import type { InvoiceCreatedMessage } from '../../../contracts/messages/invoice-created-message.ts';
import { db } from '../db/client.ts';
import { schema } from '../db/schema/index.ts';
import { invoices } from './channels/invoices.ts';

invoices.consume(
  'invoices',
  async (raw) => {
    if (!raw) {
      return;
    }

    const message: InvoiceCreatedMessage = JSON.parse(raw.content.toString());

    console.log(
      'Updating order status to "invoiced" for order:',
      message.orderId
    );

    await db
      .update(schema.orders)
      .set({
        status: 'invoiced',
      })
      .where(eq(schema.orders.id, message.orderId));

    invoices.ack(raw);
  },
  {
    noAck: false,
  }
);
