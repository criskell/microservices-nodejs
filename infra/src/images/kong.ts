import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as docker from '@pulumi/docker-build';

const kongECRRepository = new awsx.ecr.Repository('kong-ecr', {
  // Se apagar o repositório, apaga as imagens também.
  forceDelete: true,
});

const kongECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: kongECRRepository.repository.registryId,
});

export const kongDockerImage = new docker.Image('kong-image', {
  tags: [
    pulumi.interpolate`${kongECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: {
    location: '../docker/kong',
  },
  platforms: ['linux/amd64'],
  // Faça o build e manda pro repositório
  push: true,
  registries: [
    {
      address: kongECRRepository.repository.repositoryUrl,
      username: kongECRToken.userName,
      password: kongECRToken.password,
    },
  ],
});
