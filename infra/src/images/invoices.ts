import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as docker from '@pulumi/docker-build';

const invoicesECRRepository = new awsx.ecr.Repository('invoices-ecr', {
  forceDelete: true,
});

const invoicesECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: invoicesECRRepository.repository.registryId,
});

export const invoicesDockerImage = new docker.Image('invoices-image', {
  tags: [
    pulumi.interpolate`${invoicesECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: {
    location: '../app-invoices',
  },
  platforms: ['linux/amd64'],
  push: true,
  registries: [
    {
      address: invoicesECRRepository.repository.repositoryUrl,
      username: invoicesECRToken.userName,
      password: invoicesECRToken.password,
    },
  ],
});
