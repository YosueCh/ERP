import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({
      statusCode: 401,
      intOpCode: 'SxGW401',
      data: 'Token inválido o expirado',
    });
  }
}

export function verifyPermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const user = (request as any).user;
      const groupId = (request.params as any)?.grupo_id
        ?? (request.body as any)?.grupo_id;

      if (!groupId) {
        return reply.code(403).send({
          statusCode: 403,
          intOpCode: 'SxGW403',
          data: 'Grupo no especificado',
        });
      }

      const groupPerms: string[] = user.permissionsByGroup?.[String(groupId)] ?? [];

      if (!groupPerms.includes(permission)) {
        return reply.code(403).send({
          statusCode: 403,
          intOpCode: 'SxGW403',
          data: `No tienes permiso: ${permission}`,
        });
      }
    } catch (err) {
      return reply.code(401).send({
        statusCode: 401,
        intOpCode: 'SxGW401',
        data: 'Token inválido o expirado',
      });
    }
  };
}