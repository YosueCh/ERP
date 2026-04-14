import { FastifyRequest, FastifyReply } from 'fastify';

function isAdmin(user: any): boolean {
  return (
    user?.usuario === 'admin' ||
    user?.email === 'admin@erp.com' ||
    Object.values(user?.permissionsByGroup ?? {}).some((perms: any) =>
      perms.includes('user:delete') &&
      perms.includes('group:delete') &&
      perms.includes('ticket:delete')
    )
  );
}

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

      // Admin bypass
      if (isAdmin(user)) return;

      const groupId = (request.params as any)?.grupo_id
        ?? (request.body as any)?.grupo_id;

      const permissionsByGroup = user.permissionsByGroup ?? {};

      let tienePermiso = false;

      if (groupId) {
        // Permiso por grupo específico
        const groupPerms: string[] = permissionsByGroup[String(groupId)] ?? [];
        tienePermiso = groupPerms.includes(permission);
      } else {
        // Permiso global: verificar en cualquier grupo del usuario
        tienePermiso = Object.values(permissionsByGroup).some(
          (perms: any) => perms.includes(permission)
        );
      }

      if (!tienePermiso) {
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