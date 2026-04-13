export const createTicketSchema = {
  body: {
    type: 'object',
    required: ['grupo_id', 'titulo'],
    additionalProperties: false,
    properties: {
      grupo_id:     { type: 'number', minimum: 1 },
      titulo:       { type: 'string', minLength: 2, maxLength: 200 },
      descripcion:  { type: 'string', maxLength: 2000 },
      estado:       { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
      prioridad:    { type: 'string', enum: ['baja', 'media', 'alta'] },
      asignado_a:   { type: ['string', 'null'], maxLength: 100 },
      fecha_limite: { type: ['string', 'null'], format: 'date' },
    },
  },
};

export const updateTicketSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      titulo:       { type: 'string', minLength: 2, maxLength: 200 },
      descripcion:  { type: 'string', maxLength: 2000 },
      estado:       { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
      prioridad:    { type: 'string', enum: ['baja', 'media', 'alta'] },
      asignado_a:   { type: ['string', 'null'], maxLength: 100 },
      fecha_limite: { type: ['string', 'null'] },
      grupo_id:     { type: 'number', minimum: 1 },
    },
  },
};

export const updateEstadoSchema = {
  body: {
    type: 'object',
    required: ['estado', 'grupo_id'],
    additionalProperties: false,
    properties: {
      estado:   { type: 'string', enum: ['pendiente', 'en_progreso', 'revision', 'hecho'] },
      grupo_id: { type: 'number', minimum: 1 },
    },
  },
};

export const addComentarioSchema = {
  body: {
    type: 'object',
    required: ['mensaje'],
    additionalProperties: false,
    properties: {
      mensaje: { type: 'string', minLength: 1, maxLength: 1000 },
    },
  },
};