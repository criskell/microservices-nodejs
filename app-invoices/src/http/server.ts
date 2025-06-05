import '@opentelemetry/auto-instrumentations-node/register';
import '../broker/subscriber.ts';

import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: '*' });

app.get('/health', (request, reply) => {
  return 'ok';
});

app.listen({ host: '0.0.0.0', port: 3334 }).then(() => {
  console.log('[Invoices] Server is running on http://localhost:3334');
});
