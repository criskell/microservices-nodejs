import '@opentelemetry/auto-instrumentations-node/register';

// Stateless:
//  - Não guardar estado em disco.
//  - Deve ser possível matar a aplicação e subir uma nova instância e funcionar normalmente.

import { fastify } from 'fastify';
import { setTimeout } from 'node:timers/promises';
import z from 'zod';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import { trace } from '@opentelemetry/api';

import { db } from '../db/client.ts';
import { schema } from '../db/schema/index.ts';
import { randomUUID } from 'node:crypto';
import { dispatchOrderCreated } from '../broker/messages/order-created.ts';
import { tracer } from '../tracer/tracer.ts';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: '*' });

// Escalonamento horizontal (verifica se o serviço está rodando para que o load balancer possa distribuir as requisições)
// Blue-Green deployment (ativa a nova versão quando tudo estiver pronto)
app.get('/health', (request, reply) => {
  return 'ok';
});

app.post(
  '/orders',
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log('Creating an order with amount:', amount);

    const orderId = randomUUID();

    await db.insert(schema.orders).values({
      id: randomUUID(),
      amount,
      customerId: 'b109edee-3fc1-470e-870b-14877f85b4bf',
    });

    const span = tracer.startSpan('eu acho que aqui ta dando merda');
    span.setAttribute('order_id', 'Hello World');
    await setTimeout(1000);
    span.end();

    trace.getActiveSpan()?.setAttribute('order_id', orderId);

    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: 'b109edee-3fc1-470e-870b-14877f85b4bf',
      },
    });

    reply.status(201).send();
  }
);

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log('[Orders] Server is running on http://localhost:3333');
});
