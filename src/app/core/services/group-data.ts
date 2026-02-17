import { Injectable, signal } from '@angular/core';

export type TicketEstado = 'pendiente' | 'en_progreso' | 'revision' | 'hecho';
export type TicketPrioridad = 'baja' | 'media' | 'alta';

export interface GroupMember {
  id: number;
  nombre: string;
  email: string;
}

export interface TicketComentario {
  id: number;
  autor: string;
  mensaje: string;
  fecha: string;
}

export interface TicketHistorial {
  id: number;
  accion: string;
  autor: string;
  fecha: string;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  asignadoA: string;
  creadoPor: string;
  fecha: string;
  fechaLimite?: string | null;
  comentarios: TicketComentario[];
  historial: TicketHistorial[];
}

export interface GroupData {
  id: number;
  nombre: string;
  descripcion: string;
  miembros: GroupMember[];
  tickets: Ticket[];
  perteneceUsuario: boolean;
  autor: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupDataService {
  private readonly groupsState = signal<GroupData[]>([
    {
      id: 1,
      nombre: 'Equipo Dev',
      descripcion: 'Desarrollo de aplicaciones web y móviles',
      perteneceUsuario: true,
      autor: 'Carlos Ruiz',
      miembros: [
        { id: 1, nombre: 'Administrador', email: 'admin@erp.com' },
        { id: 2, nombre: 'Carlos Ruiz', email: 'carlos@erp.com' },
        { id: 3, nombre: 'Ana G.', email: 'ana@erp.com' },
        { id: 4, nombre: 'Luis M.', email: 'luis@erp.com' },
        { id: 5, nombre: 'María P.', email: 'maria@erp.com' },
      ],
      tickets: [
        {
          id: 1,
          titulo: 'Corregir bug en login',
          descripcion: 'El botón no responde en móvil cuando el formulario tiene validaciones pendientes.',
          estado: 'pendiente',
          prioridad: 'alta',
          asignadoA: 'Administrador',
          creadoPor: 'Administrador',
          fecha: '2026-03-01',
          fechaLimite: '2026-03-05',
          comentarios: [
            { id: 1, autor: 'Administrador', mensaje: 'Se detectó en pruebas responsive.', fecha: '2026-03-01 09:00' },
          ],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-01 08:40' },
            { id: 2, accion: 'Asignado a Administrador', autor: 'Administrador', fecha: '2026-03-01 08:50' },
          ],
        },
        {
          id: 2,
          titulo: 'Diseñar pantalla home',
          descripcion: 'Crear mockup de la vista principal y validar distribución de widgets.',
          estado: 'en_progreso',
          prioridad: 'media',
          asignadoA: 'Ana G.',
          creadoPor: 'Administrador',
          fecha: '2026-03-02',
          fechaLimite: '2026-03-08',
          comentarios: [
            { id: 1, autor: 'Ana G.', mensaje: 'Ya tengo el primer wireframe.', fecha: '2026-03-02 11:25' },
          ],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-02 09:00' },
            { id: 2, accion: 'Estado cambiado a En Progreso', autor: 'Ana G.', fecha: '2026-03-02 10:10' },
          ],
        },
        {
          id: 3,
          titulo: 'API de autenticación',
          descripcion: 'Conectar frontend con backend JWT y validar persistencia de sesión.',
          estado: 'hecho',
          prioridad: 'alta',
          asignadoA: 'Luis M.',
          creadoPor: 'Administrador',
          fecha: '2026-03-03',
          fechaLimite: '2026-03-06',
          comentarios: [],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-03 08:00' },
            { id: 2, accion: 'Estado cambiado a Hecho', autor: 'Luis M.', fecha: '2026-03-03 16:20' },
          ],
        },
        {
          id: 4,
          titulo: 'Revisar permisos',
          descripcion: 'Validar roles en rutas protegidas y visibilidad de acciones por permiso.',
          estado: 'revision',
          prioridad: 'media',
          asignadoA: 'María P.',
          creadoPor: 'Administrador',
          fecha: '2026-03-04',
          fechaLimite: '2026-03-09',
          comentarios: [
            { id: 1, autor: 'María P.', mensaje: 'Ya se revisó la lógica base.', fecha: '2026-03-04 13:10' },
          ],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-04 09:00' },
            { id: 2, accion: 'Estado cambiado a Revisión', autor: 'María P.', fecha: '2026-03-04 12:30' },
          ],
        },
        {
          id: 5,
          titulo: 'Definir estructura del sidebar',
          descripcion: 'Pendiente de asignación para siguiente sprint.',
          estado: 'pendiente',
          prioridad: 'media',
          asignadoA: 'Sin asignar',
          creadoPor: 'Administrador',
          fecha: '2026-03-05',
          fechaLimite: '2026-03-12',
          comentarios: [],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-05 09:30' },
          ],
        },
        {
  id: 6,
  titulo: 'Optimizar carga de dashboard',
  descripcion: 'Reducir tiempos de carga en widgets principales.',
  estado: 'pendiente',
  prioridad: 'media',
  asignadoA: 'Administrador',
  creadoPor: 'Carlos Ruiz',
  fecha: '2026-03-06',
  fechaLimite: '2026-03-18',
  comentarios: [],
  historial: [
    { id: 1, accion: 'Ticket creado', autor: 'Carlos Ruiz', fecha: '2026-03-06 10:00' }
  ]
},
{
  id: 7,
  titulo: 'Actualizar dependencias Angular',
  descripcion: 'Migrar proyecto a la última versión estable.',
  estado: 'en_progreso',
  prioridad: 'alta',
  asignadoA: 'Administrador',
  creadoPor: 'Administrador',
  fecha: '2026-03-07',
  fechaLimite: '2026-03-20',
  comentarios: [],
  historial: [
    { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-07 09:30' }
  ]
},
{
  id: 8,
  titulo: 'Implementar auditoría de acciones',
  descripcion: 'Registrar acciones de usuarios en el sistema.',
  estado: 'revision',
  prioridad: 'media',
  asignadoA: 'Administrador',
  creadoPor: 'María P.',
  fecha: '2026-03-08',
  fechaLimite: '2026-03-22',
  comentarios: [],
  historial: [
    { id: 1, accion: 'Ticket creado', autor: 'María P.', fecha: '2026-03-08 12:00' }
  ]
}
      ],
    },
    {
      id: 2,
      nombre: 'Soporte',
      descripcion: 'Atención y resolución de incidencias',
      perteneceUsuario: true,
      autor: 'Ana García',
      miembros: [
        { id: 6, nombre: 'Administrador', email: 'admin@erp.com' },
        { id: 7, nombre: 'Ana García', email: 'ana.garcia@erp.com' },
        { id: 8, nombre: 'Pedro Díaz', email: 'pedro@erp.com' },
      ],
      tickets: [
        {
          id: 1,
          titulo: 'Resolver incidencia de acceso',
          descripcion: 'Usuarios no pueden entrar al portal en horario matutino.',
          estado: 'pendiente',
          prioridad: 'alta',
          asignadoA: 'Ana García',
          creadoPor: 'Administrador',
          fecha: '2026-03-02',
          fechaLimite: '2026-03-07',
          comentarios: [],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-02 08:30' },
          ],
        },
        {
          id: 2,
          titulo: 'Validar correos de soporte',
          descripcion: 'Revisar bandeja compartida y tiempos de respuesta.',
          estado: 'en_progreso',
          prioridad: 'media',
          asignadoA: 'Pedro Díaz',
          creadoPor: 'Administrador',
          fecha: '2026-03-03',
          fechaLimite: '2026-03-10',
          comentarios: [],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-03 10:00' },
          ],
        },
      ],
    },
    {
      id: 3,
      nombre: 'UX',
      descripcion: 'Diseño de experiencia e interfaces de usuario',
      perteneceUsuario: true,
      autor: 'Laura Méndez',
      miembros: [
        { id: 9, nombre: 'Administrador', email: 'admin@erp.com' },
        { id: 10, nombre: 'Laura Méndez', email: 'laura@erp.com' },
        { id: 11, nombre: 'Fernanda R.', email: 'fernanda@erp.com' },
        { id: 12, nombre: 'Jorge S.', email: 'jorge@erp.com' },
      ],
      tickets: [
        {
          id: 1,
          titulo: 'Rediseñar pantalla de perfil',
          descripcion: 'Mejorar jerarquía visual y distribución de información.',
          estado: 'pendiente',
          prioridad: 'media',
          asignadoA: 'Laura Méndez',
          creadoPor: 'Administrador',
          fecha: '2026-03-04',
          fechaLimite: '2026-03-11',
          comentarios: [],
          historial: [
            { id: 1, accion: 'Ticket creado', autor: 'Administrador', fecha: '2026-03-04 09:20' },
          ],
        },
      ],
    },
    {
      id: 4,
      nombre: 'Backend Core',
      descripcion: 'Servicios, APIs y arquitectura del sistema',
      perteneceUsuario: false,
      autor: 'Ricardo Torres',
      miembros: [
        { id: 13, nombre: 'Ricardo Torres', email: 'ricardo@erp.com' },
        { id: 14, nombre: 'Mónica V.', email: 'monica@erp.com' },
      ],
      tickets: [],
    },
    {
      id: 5,
      nombre: 'QA Labs',
      descripcion: 'Pruebas funcionales, regresión y control de calidad',
      perteneceUsuario: false,
      autor: 'Diana Soto',
      miembros: [
        { id: 15, nombre: 'Diana Soto', email: 'diana@erp.com' },
        { id: 16, nombre: 'Raúl P.', email: 'raul@erp.com' },
      ],
      tickets: [],
    },
    {
      id: 6,
      nombre: 'Data & Analytics',
      descripcion: 'Análisis de datos, reportes y métricas del producto',
      perteneceUsuario: false,
      autor: 'Miguel Herrera',
      miembros: [
        { id: 17, nombre: 'Miguel Herrera', email: 'miguel@erp.com' },
        { id: 18, nombre: 'Sofía N.', email: 'sofia@erp.com' },
      ],
      tickets: [],
    },
  ]);

  getGroups(): GroupData[] {
    return this.groupsState();
  }

  getMyGroups(): GroupData[] {
    return this.groupsState().filter(group => group.perteneceUsuario);
  }

  getGroupById(id: number): GroupData | undefined {
    return this.groupsState().find(group => group.id === id);
  }

  addGroup(newGroup: GroupData): void {
    this.groupsState.update(groups => [...groups, newGroup]);
  }

  updateGroup(updatedGroup: GroupData): void {
    this.groupsState.update(groups =>
      groups.map(group => (group.id === updatedGroup.id ? updatedGroup : group))
    );
  }

  deleteGroup(groupId: number): void {
    this.groupsState.update(groups =>
      groups.filter(group => group.id !== groupId)
    );
  }

  addTicket(groupId: number, ticket: Ticket): void {
    this.groupsState.update(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, tickets: [...group.tickets, ticket] }
          : group
      )
    );
  }

  updateTicket(groupId: number, updatedTicket: Ticket): void {
    this.groupsState.update(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              tickets: group.tickets.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
              ),
            }
          : group
      )
    );
  }

  reorderTickets(groupId: number, tickets: Ticket[]): void {
    this.groupsState.update(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, tickets }
          : group
      )
    );
  }

  getNextTicketId(groupId: number): number {
    const group = this.getGroupById(groupId);
    if (!group || group.tickets.length === 0) return 1;
    return Math.max(...group.tickets.map(ticket => ticket.id)) + 1;
  }
}