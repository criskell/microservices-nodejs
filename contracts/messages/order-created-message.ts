export interface OrderCreatedMessage {
  orderId: string;
  customer: {
    id: string;
  };
  amount: number;
}
