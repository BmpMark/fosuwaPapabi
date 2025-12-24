import { z } from 'zod';
import { insertRoomSchema, insertReservationSchema, insertMenuItemSchema, insertOrderSchema, insertOrderItemSchema, rooms, reservations, menuItems, orders } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  rooms: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms',
      responses: {
        200: z.array(z.custom<typeof rooms.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:id',
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: insertRoomSchema,
      responses: {
        201: z.custom<typeof rooms.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/rooms/:id',
      input: insertRoomSchema.partial(),
      responses: {
        200: z.custom<typeof rooms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  reservations: {
    list: {
      method: 'GET' as const,
      path: '/api/reservations',
      responses: {
        200: z.array(z.custom<typeof reservations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reservations',
      input: insertReservationSchema,
      responses: {
        201: z.custom<typeof reservations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/reservations/:id/status',
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof reservations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  menu: {
    list: {
      method: 'GET' as const,
      path: '/api/menu',
      responses: {
        200: z.array(z.custom<typeof menuItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/menu',
      input: insertMenuItemSchema,
      responses: {
        201: z.custom<typeof menuItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: z.object({
        order: insertOrderSchema,
        items: z.array(z.object({ menuItemId: z.number(), quantity: z.number() })),
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status',
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
