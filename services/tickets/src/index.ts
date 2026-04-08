import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { ticketRoutes } from './routes/ticket.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });
fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.get('/health', async () => ({
  statusCode: 200,
  intOpCode: 'SxTS200',
  data: 'tickets service ok',
}));

fastify.register(ticketRoutes);

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3002,
      host: '0.0.0.0',
    });
    console.log('Tickets service corriendo en http://localhost:3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();