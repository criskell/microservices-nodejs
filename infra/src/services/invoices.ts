import * as pulumi from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';

import { cluster } from '../cluster';
import { invoicesDockerImage } from '../images/invoices';
import { amqpListener } from './rabbitmq';
import { appLoadBalancer } from '../load-balancer';
import { config } from '../config';

const invoicesTargetGroup = appLoadBalancer.createTargetGroup(
  'invoices-target',
  {
    port: 3334,
    protocol: 'HTTP',
    healthCheck: {
      path: '/health',
      protocol: 'HTTP',
    },
  }
);

export const invoicesHttpListener = appLoadBalancer.createListener(
  'invoices-listener',
  {
    port: 3334,
    protocol: 'HTTP',
    targetGroup: invoicesTargetGroup,
  }
);

export const invoicesService = new awsx.classic.ecs.FargateService(
  'fargate-invoices',
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: invoicesDockerImage.ref,
        // 1vCPU = 1024 milicores
        cpu: 256,
        memory: 512,
        portMappings: [invoicesHttpListener],
        environment: [
          {
            name: 'BROKER_URL',
            value: pulumi.interpolate`amqp://${config.requireSecret(
              'AMQP_USERNAME'
            )}:${config.requireSecret('AMQP_PASSWORD')}@${
              amqpListener.endpoint.hostname
            }:${amqpListener.endpoint.port}`,
          },
          {
            name: 'DATABASE_URL',
            value: config.requireSecret('INVOICES_DATABASE_URL'),
          },
          {
            name: 'OTEL_TRACES_EXPORTER',
            value: 'otlp',
          },
          {
            name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
            value: 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp',
          },
          {
            name: 'OTEL_EXPORTER_OTLP_HEADERS',
            value: pulumi.interpolate`Authorization=Basic ${config.requireSecret(
              'GRAFANA_OTEL_API_KEY'
            )}`,
          },
          {
            name: 'OTEL_RESOURCE_ATTRIBUTES',
            value:
              'service.name=invoices,service.namespace=eventonodejs,deployment.environment=production',
          },
          {
            name: 'OTEL_NODE_RESOURCE_DETECTORS',
            value: 'env,host,os',
          },
          {
            name: 'OTEL_SERVICE_NAME',
            value: 'invoices',
          },
          {
            name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
            value: 'http,fastify,pg,amqplib',
          },
        ],
      },
    },
  }
);
