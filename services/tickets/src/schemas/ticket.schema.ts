export const createTicketSchema = {
  body: {
    type: 'object',
    required: ['grupo_id', 'titulo'],
    properties: {
      grupo_id:    { type: 'number' },
      titulo:      { type: 'string', minLength: 2 },
      descripcion: { type: 'string' },
      estado:      { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
      prioridad:   { type: 'string', enum: ['baja', 'media', 'alta'] },
      asignado_a:  { type: 'string' },
      fecha_limite:{ type: 'string' },
    },
  },
};

export const updateTicketSchema = {
  body: {
    type: 'object',
    properties: {
      titulo:      { type: 'string', minLength: 2 },
      descripcion: { type: 'string' },
      estado:      { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
      prioridad:   { type: 'string', enum: ['baja', 'media', 'alta'] },
      asignado_a:  { type: 'string' },
      fecha_limite:{ type: 'string' },
    },
  },
};

export const updateEstadoSchema = {
  body: {
    type: 'object',
    required: ['estado'],
    properties: {
      estado: { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
    },
  },
};

export const addComentarioSchema = {
  body: {
    type: 'object',
    required: ['mensaje'],
    properties: {
      mensaje: { type: 'string', minLength: 1 },
    },
  },
};