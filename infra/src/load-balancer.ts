import * as awsx from '@pulumi/awsx';
import { cluster } from './cluster';

// ApplicationLoadBalancer é um um load balancer da camada 7 do OSI.
export const appLoadBalancer = new awsx.classic.lb.ApplicationLoadBalancer(
  'app-lb',
  {
    // Security groups são grupos de regras de firewall.
    // Controlam tráfego inbound e outbound.
    securityGroups: cluster.securityGroups,
  }
);

// Fora dos protocolos HTTP e HTTPS, o ALB não é adequeado.
export const networkLoadBalancer = new awsx.classic.lb.NetworkLoadBalancer(
  'net-lb',
  {
    // Subnets são as sub-redes onde o load balancer será criado.
    subnets: cluster.vpc.publicSubnetIds,
  }
);
