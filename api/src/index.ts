import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Token inválido o expirado' });
  }
});

fastify.register(authRoutes);

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    });
    console.log('Servidor corriendo en http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();