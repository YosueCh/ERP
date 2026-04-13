export const registerSchema = {
  body: {
    type: 'object',
    required: ['nombre', 'email', 'usuario', 'password'],
    additionalProperties: false,
    properties: {
      nombre:           { type: 'string', minLength: 2,  maxLength: 100 },
      email:            { type: 'string', format: 'email', maxLength: 150 },
      usuario:          { type: 'string', minLength: 3,  maxLength: 50,  pattern: '^[a-zA-Z0-9_]+$' },
      direccion:        { type: 'string', maxLength: 200 },
      password:         { type: 'string', minLength: 6,  maxLength: 100 },
      confirmPassword:  { type: 'string', minLength: 6,  maxLength: 100 },
      telefono:         { type: 'string', minLength: 10, maxLength: 15,  pattern: '^[0-9+\\-\\s]+$' },
      fecha_nacimiento: { type: 'string', format: 'date' },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email:    { type: 'string', format: 'email', maxLength: 150 },
      password: { type: 'string', minLength: 6,    maxLength: 100 },
    },
  },
};

export const addUserSchema = {
  body: {
    type: 'object',
    required: ['nombre', 'email', 'usuario', 'password'],
    additionalProperties: false,
    properties: {
      nombre:    { type: 'string', minLength: 2, maxLength: 100 },
      email:     { type: 'string', format: 'email', maxLength: 150 },
      usuario:   { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
      direccion: { type: 'string', maxLength: 200 },
      password:  { type: 'string', minLength: 6, maxLength: 100 },
    },
  },
};

export const updateUserSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      nombre:    { type: 'string', minLength: 2, maxLength: 100 },
      email:     { type: 'string', format: 'email', maxLength: 150 },
      usuario:   { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
      direccion: { type: 'string', maxLength: 200 },
      activo:    { type: 'boolean' },
    },
  },
};