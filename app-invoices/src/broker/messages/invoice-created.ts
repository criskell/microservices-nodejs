import { channels } from '../channels/index.ts';
import type { InvoiceCreatedMessage } from '../../../../contracts/messages/invoice-created-message.ts';

export function dispatchInvoiceCreated(data: InvoiceCreatedMessage) {
  channels.invoices.sendToQueue('invoices', Buffer.from(JSON.stringify(data)));
}
