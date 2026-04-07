export const registerSchema = {
  body: {
    type: 'object',
    required: ['nombre', 'email', 'usuario', 'password'],
    properties: {
      nombre:    { type: 'string', minLength: 2 },
      email:     { type: 'string', format: 'email' },
      usuario:   { type: 'string', minLength: 3 },
      direccion: { type: 'string' },
      password:  { type: 'string', minLength: 6 },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id:      { type: 'string' },
            nombre:  { type: 'string' },
            email:   { type: 'string' },
            usuario: { type: 'string' },
          },
        },
      },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email:    { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id:        { type: 'string' },
            nombre:    { type: 'string' },
            email:     { type: 'string' },
            usuario:   { type: 'string' },
            direccion: { type: 'string' },
          },
        },
        permissions: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
};

export const addUserSchema = {
  body: {
    type: 'object',
    required: ['nombre', 'email', 'usuario', 'password'],
    properties: {
      nombre:    { type: 'string', minLength: 2 },
      email:     { type: 'string', format: 'email' },
      usuario:   { type: 'string', minLength: 3 },
      direccion: { type: 'string' },
      password:  { type: 'string', minLength: 6 },
      permisos: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id:      { type: 'string' },
            nombre:  { type: 'string' },
            email:   { type: 'string' },
            usuario: { type: 'string' },
          },
        },
      },
    },
  },
};