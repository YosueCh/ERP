import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { groupRoutes } from './routes/group.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.get('/health', async () => ({
  statusCode: 200,
  intOpCode: 'SxGS200',
  data: 'groups service ok',
}));

fastify.register(groupRoutes);

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3003,
      host: '0.0.0.0',
    });
    console.log('Groups service corriendo en http://localhost:3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();