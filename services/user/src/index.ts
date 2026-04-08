import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { userRoutes } from './routes/auth.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.get('/health', async () => ({
  statusCode: 200,
  intOpCode: 'SxUS200',
  data: 'user service ok',
}));

fastify.register(userRoutes);

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3001,
      host: '0.0.0.0',
    });
    console.log('User service corriendo en http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();