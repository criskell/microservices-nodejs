import { broker } from '../broker.ts';

export const invoices = await broker.createChannel();

await invoices.assertQueue('invoices');
