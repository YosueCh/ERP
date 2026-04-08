export const registerSchema = {
  body: {
    type: 'object',
    required: ['nombre', 'email', 'usuario', 'password'],
    properties: {
      nombre:           { type: 'string', minLength: 2 },
      email:            { type: 'string', format: 'email' },
      usuario:          { type: 'string', minLength: 3 },
      direccion:        { type: 'string' },
      password:         { type: 'string', minLength: 6 },
      confirmPassword:  { type: 'string', minLength: 6 },
      telefono:         { type: 'string' },
      fecha_nacimiento: { type: 'string' },
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
    },
  },
};

export const updateUserSchema = {
  body: {
    type: 'object',
    properties: {
      nombre:    { type: 'string', minLength: 2 },
      email:     { type: 'string', format: 'email' },
      usuario:   { type: 'string', minLength: 3 },
      direccion: { type: 'string' },
      activo:    { type: 'boolean' },
    },
  },
};