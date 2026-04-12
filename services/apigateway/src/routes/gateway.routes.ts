import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { verifyToken, verifyPermission } from '../middlewares/auth.middleware';
import dotenv from 'dotenv';
dotenv.config();

const USER_URL    = process.env.USER_SERVICE_URL;
const GROUPS_URL  = process.env.GROUPS_SERVICE_URL;
const TICKETS_URL = process.env.TICKETS_SERVICE_URL;

async function proxy(reply: FastifyReply, fn: () => Promise<any>) {
  try {
    const response = await fn();
    return reply.code(response.status).send(response.data);
  } catch (err: any) {
    const status = err.response?.status ?? 500;
    const data   = err.response?.data ?? { statusCode: 500, intOpCode: 'SxGW500', data: 'Error en el gateway' };
    return reply.code(status).send(data);
  }
}

function getAuthHeader(request: FastifyRequest) {
  return { Authorization: request.headers.authorization ?? '' };
}

export async function gatewayRoutes(fastify: FastifyInstance) {

  // ── AUTH ──────────────────────────────────────────────────
  fastify.post('/auth/login', async (request, reply) => {
    return proxy(reply, () => axios.post(`${USER_URL}/auth/login`, request.body));
  });

  fastify.post('/auth/register', async (request, reply) => {
    return proxy(reply, () => axios.post(`${USER_URL}/auth/register`, request.body));
  });

  // ── USERS ─────────────────────────────────────────────────
  fastify.get('/users', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.get(`${USER_URL}/users`, { headers: getAuthHeader(request) }));
  });

  fastify.get('/users/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.get(`${USER_URL}/users/${id}`, { headers: getAuthHeader(request) }));
  });

  fastify.post('/users', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.post(`${USER_URL}/users`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.put('/users/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.put(`${USER_URL}/users/${id}`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.delete('/users/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.delete(`${USER_URL}/users/${id}`, { headers: getAuthHeader(request) }));
  });

  // ── GROUPS ────────────────────────────────────────────────
  fastify.get('/groups', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.get(`${GROUPS_URL}/groups`, { headers: getAuthHeader(request) }));
  });

  fastify.get('/groups/user/:usuario_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { usuario_id } = request.params as any;
    return proxy(reply, () => axios.get(`${GROUPS_URL}/groups/user/${usuario_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.post('/groups', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.post(`${GROUPS_URL}/groups`, request.body, { headers: getAuthHeader(request) }));
  });

  // Rutas de members y permissions ANTES de /groups/:id
  fastify.post('/groups/:id/members', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.post(`${GROUPS_URL}/groups/${id}/members`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.delete('/groups/:id/members/:usuario_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id, usuario_id } = request.params as any;
    return proxy(reply, () => axios.delete(`${GROUPS_URL}/groups/${id}/members/${usuario_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.get('/groups/:id/permissions/:usuario_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id, usuario_id } = request.params as any;
    return proxy(reply, () => axios.get(`${GROUPS_URL}/groups/${id}/permissions/${usuario_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.put('/groups/:id/permissions', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.put(`${GROUPS_URL}/groups/${id}/permissions`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.get('/permissions', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.get(`${GROUPS_URL}/permissions`, { headers: getAuthHeader(request) }));
  });

  // Rutas genéricas con :id AL FINAL
  fastify.get('/groups/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.get(`${GROUPS_URL}/groups/${id}`, { headers: getAuthHeader(request) }));
  });

  fastify.put('/groups/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.put(`${GROUPS_URL}/groups/${id}`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.delete('/groups/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.delete(`${GROUPS_URL}/groups/${id}`, { headers: getAuthHeader(request) }));
  });

  // ── TICKETS ───────────────────────────────────────────────
  fastify.get('/tickets/group/:grupo_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { grupo_id } = request.params as any;
    return proxy(reply, () => axios.get(`${TICKETS_URL}/tickets/group/${grupo_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.get('/tickets/user/:usuario_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { usuario_id } = request.params as any;
    return proxy(reply, () => axios.get(`${TICKETS_URL}/tickets/user/${usuario_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.get('/tickets/stats/:grupo_id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { grupo_id } = request.params as any;
    return proxy(reply, () => axios.get(`${TICKETS_URL}/tickets/stats/${grupo_id}`, { headers: getAuthHeader(request) }));
  });

  fastify.post('/tickets/:id/comments', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.post(`${TICKETS_URL}/tickets/${id}/comments`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.get('/tickets/:id/comments', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.get(`${TICKETS_URL}/tickets/${id}/comments`, { headers: getAuthHeader(request) }));
  });

  fastify.patch('/tickets/:id/status', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.patch(`${TICKETS_URL}/tickets/${id}/status`, request.body, { headers: getAuthHeader(request) }));
  });

  // Rutas genéricas de tickets AL FINAL
  fastify.get('/tickets/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.get(`${TICKETS_URL}/tickets/${id}`, { headers: getAuthHeader(request) }));
  });

  fastify.post('/tickets', { preHandler: [verifyToken] }, async (request, reply) => {
    return proxy(reply, () => axios.post(`${TICKETS_URL}/tickets`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.put('/tickets/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.put(`${TICKETS_URL}/tickets/${id}`, request.body, { headers: getAuthHeader(request) }));
  });

  fastify.delete('/tickets/:id', { preHandler: [verifyToken] }, async (request, reply) => {
    const { id } = request.params as any;
    return proxy(reply, () => axios.delete(`${TICKETS_URL}/tickets/${id}`, { headers: getAuthHeader(request) }));
  });
}