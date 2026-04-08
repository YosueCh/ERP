import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../plugins/supabase';
import {
  loginSchema,
  registerSchema,
  addUserSchema,
  updateUserSchema,
} from '../schemas/user.schema';

const res = (statusCode: number, intOpCode: string, data: any) => ({
  statusCode,
  intOpCode,
  data,
});

export async function userRoutes(fastify: FastifyInstance) {

  // ── POST /auth/register ───────────────────────────────────
  fastify.post('/auth/register', { schema: registerSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { nombre, email, usuario, direccion } = body;

    if (body.confirmPassword && body.password !== body.confirmPassword) {
      return reply.code(400).send(res(400, 'SxUS400', 'Las contraseñas no coinciden'));
    }

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .or(`email.eq.${email},usuario.eq.${usuario}`)
      .single();

    if (existe) {
      return reply.code(400).send(res(400, 'SxUS400', 'El email o usuario ya está registrado'));
    }

    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email,
        usuario,
        password:         body.password,
        direccion,
        telefono:         body.telefono ?? null,
        fecha_nacimiento: body.fecha_nacimiento ?? null,
      })
      .select('id, nombre, email, usuario')
      .single();

    if (error) {
      return reply.code(500).send(res(500, 'SxUS500', 'Error al registrar usuario'));
    }

    return reply.code(201).send(res(201, 'SxUS201', newUser));
  });

  // ── POST /auth/login ──────────────────────────────────────
  fastify.post('/auth/login', { schema: loginSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as any;

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, usuario, direccion, password, activo')
      .eq('email', email)
      .single();

    if (error || !user) {
      return reply.code(401).send(res(401, 'SxUS401', 'Credenciales inválidas'));
    }

    if (!user.activo) {
      return reply.code(403).send(res(403, 'SxUS403', 'Usuario desactivado'));
    }

    if (user.password !== password) {
      return reply.code(401).send(res(401, 'SxUS401', 'Credenciales inválidas'));
    }

    // Obtener permisos por grupo
    const { data: permisosData } = await supabase
      .from('usuario_grupo_permisos')
      .select('grupo_id, permisos(clave)')
      .eq('usuario_id', user.id)
      .eq('activo', true);

    // Agrupar permisos por grupo
    const permissionsByGroup: Record<string, string[]> = {};
    (permisosData ?? []).forEach((p: any) => {
      const groupId = String(p.grupo_id);
      if (!permissionsByGroup[groupId]) permissionsByGroup[groupId] = [];
      if (p.permisos?.clave) permissionsByGroup[groupId].push(p.permisos.clave);
    });

    const token = fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        permissionsByGroup,
      },
      { expiresIn: '8h' }
    );

    return reply.code(200).send(res(200, 'SxUS200', {
      token,
      user: {
        id:        user.id,
        nombre:    user.nombre,
        email:     user.email,
        usuario:   user.usuario,
        direccion: user.direccion,
      },
      permissionsByGroup,
    }));
  });

  // ── GET /users ────────────────────────────────────────────
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, usuario, direccion, activo, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return reply.code(500).send(res(500, 'SxUS500', 'Error al obtener usuarios'));
    }

    return reply.code(200).send(res(200, 'SxUS200', data));
  });

  // ── GET /users/:id ────────────────────────────────────────
  fastify.get('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, usuario, direccion, activo, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return reply.code(404).send(res(404, 'SxUS404', 'Usuario no encontrado'));
    }

    return reply.code(200).send(res(200, 'SxUS200', data));
  });

  // ── POST /users ───────────────────────────────────────────
  fastify.post('/users', { schema: addUserSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { nombre, email, usuario, password, direccion } = request.body as any;

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .or(`email.eq.${email},usuario.eq.${usuario}`)
      .single();

    if (existe) {
      return reply.code(400).send(res(400, 'SxUS400', 'El email o usuario ya está registrado'));
    }

    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert({ nombre, email, usuario, password, direccion })
      .select('id, nombre, email, usuario')
      .single();

    if (error || !newUser) {
      return reply.code(500).send(res(500, 'SxUS500', 'Error al crear usuario'));
    }

    return reply.code(201).send(res(201, 'SxUS201', newUser));
  });

  // ── PUT /users/:id ────────────────────────────────────────
  fastify.put('/users/:id', { schema: updateUserSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const body = request.body as any;

    const { data, error } = await supabase
      .from('usuarios')
      .update(body)
      .eq('id', id)
      .select('id, nombre, email, usuario, direccion, activo')
      .single();

    if (error || !data) {
      return reply.code(500).send(res(500, 'SxUS500', 'Error al actualizar usuario'));
    }

    return reply.code(200).send(res(200, 'SxUS200', data));
  });

  // ── DELETE /users/:id ─────────────────────────────────────
  fastify.delete('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      return reply.code(500).send(res(500, 'SxUS500', 'Error al eliminar usuario'));
    }

    return reply.code(200).send(res(200, 'SxUS200', 'Usuario eliminado correctamente'));
  });
}