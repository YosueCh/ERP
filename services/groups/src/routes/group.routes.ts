import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../plugins/supabase';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updatePermissionsSchema,
} from '../schemas/group.schema';

const res = (statusCode: number, intOpCode: string, data: any) => ({
  statusCode,
  intOpCode,
  data,
});

export async function groupRoutes(fastify: FastifyInstance) {

  // ── GET /groups ───────────────────────────────────────────
  fastify.get('/groups', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabase
      .from('grupos')
      .select(`
        id, nombre, descripcion, created_at,
        autor:autor_id(id, nombre, email)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al obtener grupos'));
    }

    return reply.code(200).send(res(200, 'SxGS200', data));
  });

  // ── GET /groups/user/:usuario_id ──────────────────────────
  fastify.get('/groups/user/:usuario_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { usuario_id } = request.params as any;

    const { data, error } = await supabase
      .from('grupo_miembros')
      .select(`
        grupo:grupo_id(
          id, nombre, descripcion, created_at,
          autor:autor_id(id, nombre, email)
        )
      `)
      .eq('usuario_id', usuario_id);

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al obtener grupos del usuario'));
    }

    const grupos = (data ?? []).map((d: any) => d.grupo);
    return reply.code(200).send(res(200, 'SxGS200', grupos));
  });

  // ── GET /groups/:id ───────────────────────────────────────
  fastify.get('/groups/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { data, error } = await supabase
      .from('grupos')
      .select(`
        id, nombre, descripcion, created_at,
        autor:autor_id(id, nombre, email),
        miembros:grupo_miembros(
          usuario:usuario_id(id, nombre, email, usuario)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return reply.code(404).send(res(404, 'SxGS404', 'Grupo no encontrado'));
    }

    return reply.code(200).send(res(200, 'SxGS200', data));
  });

  // ── POST /groups ──────────────────────────────────────────
  fastify.post('/groups', { schema: createGroupSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { nombre, descripcion } = request.body as any;
    const autorId = (request as any).user?.id;

    const { data, error } = await supabase
      .from('grupos')
      .insert({ nombre, descripcion, autor_id: autorId })
      .select('id, nombre, descripcion, created_at')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al crear grupo'));
    }

    // Agregar autor como miembro automáticamente
    if (autorId) {
      await supabase
        .from('grupo_miembros')
        .insert({ grupo_id: data.id, usuario_id: autorId });
    }

    return reply.code(201).send(res(201, 'SxGS201', data));
  });

  // ── PUT /groups/:id ───────────────────────────────────────
  fastify.put('/groups/:id', { schema: updateGroupSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const body = request.body as any;

    const { data, error } = await supabase
      .from('grupos')
      .update(body)
      .eq('id', id)
      .select('id, nombre, descripcion')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al actualizar grupo'));
    }

    return reply.code(200).send(res(200, 'SxGS200', data));
  });

  // ── DELETE /groups/:id ────────────────────────────────────
  fastify.delete('/groups/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { error } = await supabase
      .from('grupos')
      .delete()
      .eq('id', id);

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al eliminar grupo'));
    }

    return reply.code(200).send(res(200, 'SxGS200', 'Grupo eliminado correctamente'));
  });

  // ── POST /groups/:id/members ──────────────────────────────
  fastify.post('/groups/:id/members', { schema: addMemberSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { usuario_id } = request.body as any;

    const { data, error } = await supabase
      .from('grupo_miembros')
      .insert({ grupo_id: id, usuario_id })
      .select()
      .single();

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al agregar miembro'));
    }

    return reply.code(201).send(res(201, 'SxGS201', data));
  });

  // ── DELETE /groups/:id/members/:usuario_id ────────────────
  fastify.delete('/groups/:id/members/:usuario_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, usuario_id } = request.params as any;

    const { error } = await supabase
      .from('grupo_miembros')
      .delete()
      .eq('grupo_id', id)
      .eq('usuario_id', usuario_id);

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al eliminar miembro'));
    }

    return reply.code(200).send(res(200, 'SxGS200', 'Miembro eliminado correctamente'));
  });

  // ── GET /groups/:id/permissions/:usuario_id ───────────────
  fastify.get('/groups/:id/permissions/:usuario_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, usuario_id } = request.params as any;

    const { data, error } = await supabase
      .from('usuario_grupo_permisos')
      .select('permiso_id, activo, permisos(clave, label, grupo)')
      .eq('grupo_id', id)
      .eq('usuario_id', usuario_id);

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al obtener permisos'));
    }

    return reply.code(200).send(res(200, 'SxGS200', data));
  });

  // ── PUT /groups/:id/permissions ───────────────────────────
  fastify.put('/groups/:id/permissions', { schema: updatePermissionsSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { usuario_id, permisos } = request.body as any;

    for (const permiso of permisos) {
      await supabase
        .from('usuario_grupo_permisos')
        .upsert({
          usuario_id,
          grupo_id:   Number(id),
          permiso_id: permiso.permiso_id,
          activo:     permiso.activo,
        }, { onConflict: 'usuario_id,grupo_id,permiso_id' });
    }

    return reply.code(200).send(res(200, 'SxGS200', 'Permisos actualizados correctamente'));
  });

  // ── GET /permissions ──────────────────────────────────────
  fastify.get('/permissions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabase
      .from('permisos')
      .select('id, clave, label, grupo')
      .order('id', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxGS500', 'Error al obtener permisos'));
    }

    return reply.code(200).send(res(200, 'SxGS200', data));
  });
}