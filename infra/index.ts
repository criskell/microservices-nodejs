import { ordersService } from './src/services/orders';
import { invoicesService } from './src/services/invoices';
import { appLoadBalancer } from './src/load-balancer';
import { rabbitMQService } from './src/services/rabbitmq';
import { kongService } from './src/services/kong';

export const ordersServiceId = ordersService.service.id;
export const invoicesServiceId = invoicesService.service.id;
export const rabbitMQId = rabbitMQService.service.id;
export const kongId = kongService.service.id;
export const loadBalancerId = appLoadBalancer.loadBalancer.id;
