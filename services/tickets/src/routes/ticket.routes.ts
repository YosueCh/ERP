import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../plugins/supabase';
import {
  createTicketSchema,
  updateTicketSchema,
  updateEstadoSchema,
  addComentarioSchema,
} from '../schemas/ticket.schema';

const res = (statusCode: number, intOpCode: string, data: any) => ({
  statusCode,
  intOpCode,
  data,
});

export async function ticketRoutes(fastify: FastifyInstance) {

  // ── GET /tickets/group/:grupo_id ──────────────────────────
  fastify.get('/tickets/group/:grupo_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { grupo_id } = request.params as any;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id, titulo, descripcion, estado, prioridad, fecha_limite, created_at, updated_at,
        asignado:asignado_a(id, nombre, email),
        creador:creado_por(id, nombre, email)
      `)
      .eq('grupo_id', grupo_id)
      .order('created_at', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al obtener tickets'));
    }

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── GET /tickets/user/:usuario_id ─────────────────────────
  fastify.get('/tickets/user/:usuario_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { usuario_id } = request.params as any;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id, titulo, estado, prioridad, fecha_limite,
        grupo:grupo_id(id, nombre),
        creador:creado_por(id, nombre)
      `)
      .eq('asignado_a', usuario_id)
      .order('fecha_limite', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al obtener tickets del usuario'));
    }

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── GET /tickets/:id ──────────────────────────────────────
  fastify.get('/tickets/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id, titulo, descripcion, estado, prioridad, fecha_limite, created_at,
        asignado:asignado_a(id, nombre, email),
        creador:creado_por(id, nombre, email),
        comentarios:ticket_comentarios(
          id, mensaje, created_at,
          autor:autor_id(id, nombre)
        ),
        historial:ticket_historial(
          id, accion, created_at,
          autor:autor_id(id, nombre)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return reply.code(404).send(res(404, 'SxTS404', 'Ticket no encontrado'));
    }

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── POST /tickets ─────────────────────────────────────────
  fastify.post('/tickets', { schema: createTicketSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const creadoPor = (request as any).user?.id;

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        grupo_id:    body.grupo_id,
        titulo:      body.titulo,
        descripcion: body.descripcion,
        estado:      body.estado ?? 'pendiente',
        prioridad:   body.prioridad ?? 'media',
        asignado_a:  body.asignado_a ?? null,
        creado_por:  creadoPor,
        fecha_limite: body.fecha_limite ?? null,
      })
      .select('id, titulo, estado, prioridad, created_at')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al crear ticket'));
    }

    // Registrar en historial
    await supabase.from('ticket_historial').insert({
      ticket_id: data.id,
      autor_id:  creadoPor,
      accion:    'Ticket creado',
    });

    return reply.code(201).send(res(201, 'SxTS201', data));
  });

  // ── PUT /tickets/:id ──────────────────────────────────────
  fastify.put('/tickets/:id', { schema: updateTicketSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const autorId = (request as any).user?.id;

    const { data, error } = await supabase
      .from('tickets')
      .update(body)
      .eq('id', id)
      .select('id, titulo, estado, prioridad')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al actualizar ticket'));
    }

    await supabase.from('ticket_historial').insert({
      ticket_id: id,
      autor_id:  autorId,
      accion:    'Ticket actualizado',
    });

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── PATCH /tickets/:id/status ─────────────────────────────
  fastify.patch('/tickets/:id/status', { schema: updateEstadoSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { estado } = request.body as any;
    const autorId = (request as any).user?.id;

    const { data, error } = await supabase
      .from('tickets')
      .update({ estado })
      .eq('id', id)
      .select('id, titulo, estado')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al actualizar estado'));
    }

    await supabase.from('ticket_historial').insert({
      ticket_id: id,
      autor_id:  autorId,
      accion:    `Estado cambiado a ${estado}`,
    });

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── DELETE /tickets/:id ───────────────────────────────────
  fastify.delete('/tickets/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al eliminar ticket'));
    }

    return reply.code(200).send(res(200, 'SxTS200', 'Ticket eliminado correctamente'));
  });

  // ── POST /tickets/:id/comments ────────────────────────────
  fastify.post('/tickets/:id/comments', { schema: addComentarioSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { mensaje } = request.body as any;
    const autorId = (request as any).user?.id;

    const { data, error } = await supabase
      .from('ticket_comentarios')
      .insert({ ticket_id: id, autor_id: autorId, mensaje })
      .select('id, mensaje, created_at')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al agregar comentario'));
    }

    await supabase.from('ticket_historial').insert({
      ticket_id: id,
      autor_id:  autorId,
      accion:    'Comentario agregado',
    });

    return reply.code(201).send(res(201, 'SxTS201', data));
  });

  // ── GET /tickets/:id/comments ─────────────────────────────
  fastify.get('/tickets/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { data, error } = await supabase
      .from('ticket_comentarios')
      .select('id, mensaje, created_at, autor:autor_id(id, nombre)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al obtener comentarios'));
    }

    return reply.code(200).send(res(200, 'SxTS200', data));
  });

  // ── GET /tickets/stats/:grupo_id ──────────────────────────
  fastify.get('/tickets/stats/:grupo_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { grupo_id } = request.params as any;

    const { data, error } = await supabase
      .from('tickets')
      .select('estado, prioridad')
      .eq('grupo_id', grupo_id);

    if (error) {
      return reply.code(500).send(res(500, 'SxTS500', 'Error al obtener estadísticas'));
    }

    const stats = {
      total: data?.length ?? 0,
      por_estado: {
        pendiente:   data?.filter(t => t.estado === 'pendiente').length ?? 0,
        en_progreso: data?.filter(t => t.estado === 'en_progreso').length ?? 0,
        revision:    data?.filter(t => t.estado === 'revision').length ?? 0,
        hecho:       data?.filter(t => t.estado === 'hecho').length ?? 0,
      },
      por_prioridad: {
        baja:  data?.filter(t => t.prioridad === 'baja').length ?? 0,
        media: data?.filter(t => t.prioridad === 'media').length ?? 0,
        alta:  data?.filter(t => t.prioridad === 'alta').length ?? 0,
      },
    };

    return reply.code(200).send(res(200, 'SxTS200', stats));
  });
}