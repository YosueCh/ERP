export const createGroupSchema = {
  body: {
    type: 'object',
    required: ['nombre'],
    additionalProperties: false,
    properties: {
      nombre:      { type: 'string', minLength: 2, maxLength: 100 },
      descripcion: { type: 'string', maxLength: 300 },
    },
  },
};

export const updateGroupSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      nombre:      { type: 'string', minLength: 2, maxLength: 100 },
      descripcion: { type: 'string', maxLength: 300 },
    },
  },
};

export const addMemberSchema = {
  body: {
    type: 'object',
    required: ['usuario_id'],
    additionalProperties: false,
    properties: {
      usuario_id: { type: 'string', minLength: 1, maxLength: 100 },
    },
  },
};

export const updatePermissionsSchema = {
  body: {
    type: 'object',
    required: ['usuario_id', 'permisos'],
    additionalProperties: false,
    properties: {
      usuario_id: { type: 'string', minLength: 1, maxLength: 100 },
      grupo_id:   { type: 'number' },
      permisos: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['permiso_id', 'activo'],
          additionalProperties: false,
          properties: {
            permiso_id: { type: 'number', minimum: 1 },
            activo:     { type: 'boolean' },
          },
        },
      },
    },
  },
};