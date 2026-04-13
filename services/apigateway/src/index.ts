import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { gatewayRoutes } from './routes/gateway.routes';

dotenv.config();

const fastify = Fastify({ logger: true });

// ── Supabase client para logs y métricas ──────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// ── Helper: guardar log en BD ─────────────────────────────────────────────
async function saveLog(data: {
  endpoint:    string;
  metodo:      string;
  usuario_id?: string | null;
  ip:          string;
  status:      number;
  duracion_ms: number;
  error?:      string | null;
}): Promise<void> {
  try {
    await supabase.from('logs').insert(data);
  } catch (err) {
    fastify.log.error({ err }, 'Error guardando log');
  }
}

// ── Helper: actualizar métricas en BD ────────────────────────────────────
async function updateMetrica(endpoint: string, metodo: string, duracion_ms: number): Promise<void> {
  try {
    const { data } = await supabase
      .from('metricas')
      .select('id, total_requests, tiempo_total_ms')
      .eq('endpoint', endpoint)
      .eq('metodo', metodo)
      .single();

    if (data) {
      const nuevoTotal  = data.total_requests + 1;
      const nuevoTiempo = data.tiempo_total_ms + duracion_ms;
      const promedio    = nuevoTiempo / nuevoTotal;

      await supabase.from('metricas').update({
        total_requests:     nuevoTotal,
        tiempo_total_ms:    nuevoTiempo,
        tiempo_promedio_ms: Number(promedio.toFixed(2)),
        ultimo_acceso:      new Date().toISOString(),
      }).eq('id', data.id);
    } else {
      await supabase.from('metricas').insert({
        endpoint,
        metodo,
        total_requests:     1,
        tiempo_total_ms:    duracion_ms,
        tiempo_promedio_ms: duracion_ms,
        ultimo_acceso:      new Date().toISOString(),
      });
    }
  } catch (err) {
    fastify.log.error({ err }, 'Error actualizando métrica');
  }
}

// ── Helper: extraer usuario_id del JWT ───────────────────────────────────
function getUserId(request: FastifyRequest): string | null {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
    const decoded = fastify.jwt.decode<{ id: string }>(token);
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

// ── Plugins ───────────────────────────────────────────────────────────────
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

fastify.register(jwt, { secret: process.env.JWT_SECRET! });

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    intOpCode:  'SxGW429',
    data:       'Too many requests',
  }),
});

// ── Hooks ─────────────────────────────────────────────────────────────────
fastify.addHook('onRequest', async (request: FastifyRequest) => {
  (request as any).startTime = Date.now();
});

fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.method === 'OPTIONS') return;

  const duracion_ms  = Date.now() - ((request as any).startTime ?? Date.now());
  const usuario_id   = getUserId(request);

  // Guardar log
  await saveLog({
    endpoint:   request.url,
    metodo:     request.method,
    usuario_id,
    ip:         request.ip,
    status:     reply.statusCode,
    duracion_ms,
    error:      null,
  });

  // Actualizar métricas
  await updateMetrica(request.url, request.method, duracion_ms);
});

fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
  const duracion_ms = Date.now() - ((request as any).startTime ?? Date.now());
  const usuario_id  = getUserId(request);

  await saveLog({
    endpoint:   request.url,
    metodo:     request.method,
    usuario_id,
    ip:         request.ip,
    status:     reply.statusCode ?? 500,
    duracion_ms,
    error:      `${error.message}\n${error.stack ?? ''}`.slice(0, 2000),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
fastify.get('/health', async () => ({
  statusCode: 200,
  intOpCode:  'SxGW200',
  data:       'api gateway ok',
}));

fastify.register(gatewayRoutes);

// ── Start ─────────────────────────────────────────────────────────────────
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