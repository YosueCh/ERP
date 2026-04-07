import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../plugins/supabase';
import { loginSchema, registerSchema, addUserSchema } from '../schemas/user.schema';

export async function authRoutes(fastify: FastifyInstance) {

  // ── POST /register ────────────────────────────────────────
  fastify.post('/register', { schema: registerSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { nombre, email, usuario, password, direccion } = request.body as {
      nombre: string;
      email: string;
      usuario: string;
      password: string;
      direccion?: string;
    };

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .or(`email.eq.${email},usuario.eq.${usuario}`)
      .single();

    if (existe) {
      return reply.code(400).send({ error: 'El email o usuario ya está registrado' });
    }

    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert({ nombre, email, usuario, password, direccion })
      .select('id, nombre, email, usuario')
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Error al registrar usuario' });
    }

    return reply.code(201).send({
      message: 'Usuario registrado correctamente',
      user: newUser,
    });
  });

  // ── POST /login ───────────────────────────────────────────
  fastify.post('/login', { schema: loginSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, usuario, direccion, password, activo')
      .eq('email', email)
      .single();

    if (error || !user) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }

    if (!user.activo) {
      return reply.code(403).send({ error: 'Usuario desactivado' });
    }

    if (user.password !== password) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }

    const { data: permisosData } = await supabase
      .from('usuario_grupo_permisos')
      .select('permisos(clave)')
      .eq('usuario_id', user.id)
      .eq('activo', true);

    const permissions: string[] = [
      ...new Set(
        (permisosData ?? [])
          .map((p: any) => p.permisos?.clave)
          .filter(Boolean)
      ),
    ];

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: '8h' }
    );

    return reply.code(200).send({
      token,
      user: {
        id:        user.id,
        nombre:    user.nombre,
        email:     user.email,
        usuario:   user.usuario,
        direccion: user.direccion,
      },
      permissions,
    });
  });

  // ── POST /users/add ───────────────────────────────────────
   fastify.post('/users/add', {
    schema: addUserSchema,
    preHandler: [(fastify as any).authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { nombre, email, usuario, password, direccion } = request.body as {
      nombre: string;
      email: string;
      usuario: string;
      password: string;
      direccion?: string;
      permisos?: string[];
    };

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .or(`email.eq.${email},usuario.eq.${usuario}`)
      .single();

    if (existe) {
      return reply.code(400).send({ error: 'El email o usuario ya está registrado' });
    }

    const { data: newUser, error } = await supabase
      .from('usuarios')
      .insert({ nombre, email, usuario, password, direccion })
      .select('id, nombre, email, usuario')
      .single();

    if (error || !newUser) {
      return reply.code(500).send({ error: 'Error al crear usuario' });
    }

    return reply.code(201).send({
      message: 'Usuario creado correctamente',
      user: newUser,
    });
  });
}