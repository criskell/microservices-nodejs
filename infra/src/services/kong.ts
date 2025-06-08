import * as pulumi from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';
import { cluster } from '../cluster';
import { kongDockerImage } from '../images/kong';
import { ordersHttpListener } from './orders';
import { appLoadBalancer } from '../load-balancer';

const proxyTargetGroup = appLoadBalancer.createTargetGroup('proxy-target', {
  port: 8000,
  protocol: 'HTTP',
  healthCheck: {
    path: '/orders/health',
    protocol: 'HTTP',
  },
});

export const proxyHttpListener = appLoadBalancer.createListener(
  'proxy-listener',
  {
    port: 80,
    protocol: 'HTTP',
    targetGroup: proxyTargetGroup,
  }
);

const adminTargetGroup = appLoadBalancer.createTargetGroup('admin-target', {
  port: 8002,
  protocol: 'HTTP',
  healthCheck: {
    path: '/',
    protocol: 'HTTP',
  },
});

export const adminHttpListener = appLoadBalancer.createListener(
  'admin-listener',
  {
    port: 8002,
    protocol: 'HTTP',
    targetGroup: adminTargetGroup,
  }
);

const adminAPITargetGroup = appLoadBalancer.createTargetGroup(
  'admin-api-target',
  {
    port: 8001,
    protocol: 'HTTP',
    healthCheck: {
      path: '/',
      protocol: 'HTTP',
    },
  }
);

export const adminAPIHttpListener = appLoadBalancer.createListener(
  'admin-api-listener',
  {
    port: 8001,
    protocol: 'HTTP',
    targetGroup: adminAPITargetGroup,
  }
);

export const kongService = new awsx.classic.ecs.FargateService('fargate-kong', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: kongDockerImage.ref,
      // 1vCPU = 1024 milicores
      cpu: 256,
      memory: 512,
      portMappings: [
        proxyHttpListener,
        adminHttpListener,
        adminAPIHttpListener,
      ],
      environment: [
        {
          name: 'KONG_DATABASE',
          value: 'off',
        },
        {
          name: 'KONG_ADMIN_LISTEN',
          value: '0.0.0.0:8001',
        },
        {
          name: 'ORDERS_SERVICE_URL',
          value: pulumi.interpolate`http://${ordersHttpListener.endpoint.hostname}:${ordersHttpListener.endpoint.port}`,
        },
      ],
    },
  },
});
