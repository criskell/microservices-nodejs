import { trace } from '@opentelemetry/api';

if (!process.env.OTEL_SERVICE_NAME) {
  throw new Error('OTEL_SERVICE_NAME environment variable is not set');
}

export const tracer = trace.getTracer(process.env.OTEL_SERVICE_NAME);
