import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { gatewayRoutes } from './routes/gateway.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

// Rate limiting: 100 requests por minuto
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    intOpCode: 'SxGW429',
    data: 'Too many requests',
  }),
});

fastify.get('/health', async () => ({
  statusCode: 200,
  intOpCode: 'SxGW200',
  data: 'api gateway ok',
}));

fastify.register(gatewayRoutes);

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    });
    console.log('API Gateway corriendo en http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();