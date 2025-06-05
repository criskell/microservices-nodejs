// Padrão Pub Sub
// Subscriber se inscreve em um canal e recebe mensagens.
// Publisher publica mensagens em um canal e o broker as distribui para os subscribers.

import { orders } from './channels/orders.ts';

orders.consume(
  'orders',
  async (message) => {
    if (!message) {
      return;
    }

    console.log(message.content.toString());

    orders.ack(message);
  },
  {
    // noAck significa se o broker deve esperar a confirmação do subscriber antes de remover a mensagem da fila.
    noAck: false,
    // Ack vem de acknowledge
  }
);
