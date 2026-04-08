export const createGroupSchema = {
  body: {
    type: 'object',
    required: ['nombre'],
    properties: {
      nombre:      { type: 'string', minLength: 2 },
      descripcion: { type: 'string' },
    },
  },
};

export const updateGroupSchema = {
  body: {
    type: 'object',
    properties: {
      nombre:      { type: 'string', minLength: 2 },
      descripcion: { type: 'string' },
    },
  },
};

export const addMemberSchema = {
  body: {
    type: 'object',
    required: ['usuario_id'],
    properties: {
      usuario_id: { type: 'string' },
    },
  },
};

export const updatePermissionsSchema = {
  body: {
    type: 'object',
    required: ['usuario_id', 'permisos'],
    properties: {
      usuario_id: { type: 'string' },
      permisos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            permiso_id: { type: 'number' },
            activo:     { type: 'boolean' },
          },
        },
      },
    },
  },
};