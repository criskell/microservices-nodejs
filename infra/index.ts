import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as docker from '@pulumi/docker-build';

const ordersECRRepository = new awsx.ecr.Repository('orders-ecr', {
  // Se apagar o repositório, apaga as imagens também.
  forceDelete: true,
});

const ordersECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ordersECRRepository.repository.registryId,
});

export const ordersDockerImage = new docker.Image('orders-image', {
  tags: [
    pulumi.interpolate`${ordersECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: {
    location: '../app-orders',
  },
  platforms: ['linux/amd64'],
  // Faça o build e manda pro repositório
  push: true,
  registries: [
    {
      address: ordersECRRepository.repository.repositoryUrl,
      username: ordersECRToken.userName,
      password: ordersECRToken.password,
    },
  ],
});

const cluster = new awsx.classic.ecs.Cluster('app-cluster');

const ordersService = new awsx.classic.ecs.FargateService('orders-service', {
  cluster,
  desiredCount: 1,
  // Não espera o serviço estar pronto para criar a próxima tarefa.
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      // CPU é 256 milicores, ou seja, 0.25 vCPU
      // 1vCPU = 1024 milicores
      cpu: 256,
      // 512MB de memória
      memory: 512,
    },
  },
});
