import * as pulumi from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';
import { cluster } from '../cluster';
import { appLoadBalancer, networkLoadBalancer } from '../load-balancer';

const rabbitMQAdminTargetGroup = appLoadBalancer.createTargetGroup(
  'rabbitmq-admin-target',
  {
    port: 15672,
    protocol: 'HTTP',
    healthCheck: {
      path: '/',
      protocol: 'HTTP',
    },
  }
);

export const rabbitMQAdminHttpListener = appLoadBalancer.createListener(
  'rabbitmq-admin-listener',
  {
    port: 15672,
    protocol: 'HTTP',
    targetGroup: rabbitMQAdminTargetGroup,
  }
);

const amqpTargetGroup = networkLoadBalancer.createTargetGroup('amqp-target', {
  protocol: 'TCP',
  port: 5672,
  targetType: 'ip',
  healthCheck: {
    protocol: 'TCP',
    port: '5672',
  },
});

export const amqpListener = networkLoadBalancer.createListener(
  'amqp-listener',
  {
    port: 5672,
    protocol: 'TCP',
    targetGroup: amqpTargetGroup,
  }
);

export const rabbitMQService = new awsx.classic.ecs.FargateService(
  'fargate-rabbitmq',
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: 'rabbitmq:3-management',
        // 1vCPU = 1024 milicores
        cpu: 256,
        memory: 512,
        portMappings: [rabbitMQAdminHttpListener, amqpListener],
        environment: [
          {
            name: 'RABBITMQ_DEFAULT_USER',
            value: pulumi.secret('AMQP_USERNAME'),
          },
          {
            name: 'RABBITMQ_DEFAULT_PASS',
            value: pulumi.secret('AMQP_PASSWORD'),
          },
        ],
      },
    },
  }
);
