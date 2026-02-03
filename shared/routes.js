import { z } from 'zod';
import { insertUserSchema, insertRoomSchema, insertReservationSchema, insertMenuItemSchema, insertOrderSchema } from './schema';
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
    auth: {
        register: {
            method: 'POST',
            path: '/api/register',
            input: insertUserSchema,
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
        login: {
            method: 'POST',
            path: '/api/login',
            input: z.object({ username: z.string(), password: z.string() }),
            responses: {
                200: z.custom(),
                401: errorSchemas.unauthorized,
            },
        },
        logout: {
            method: 'POST',
            path: '/api/logout',
            responses: {
                200: z.object({ message: z.string() }),
            },
        },
        user: {
            method: 'GET',
            path: '/api/user',
            responses: {
                200: z.custom(),
                401: errorSchemas.unauthorized,
            },
        },
    },
    rooms: {
        list: {
            method: 'GET',
            path: '/api/rooms',
            responses: {
                200: z.array(z.custom()),
            },
        },
        get: {
            method: 'GET',
            path: '/api/rooms/:id',
            responses: {
                200: z.custom(),
                404: errorSchemas.notFound,
            },
        },
        create: {
            method: 'POST',
            path: '/api/rooms',
            input: insertRoomSchema,
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
        update: {
            method: 'PUT',
            path: '/api/rooms/:id',
            input: insertRoomSchema.partial(),
            responses: {
                200: z.custom(),
                404: errorSchemas.notFound,
            },
        },
        delete: {
            method: 'DELETE',
            path: '/api/rooms/:id',
            responses: {
                200: z.object({ message: z.string() }),
                404: errorSchemas.notFound,
            },
        },
    },
    reservations: {
        list: {
            method: 'GET',
            path: '/api/reservations',
            responses: {
                200: z.array(z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/reservations',
            input: insertReservationSchema,
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
        updateStatus: {
            method: 'PATCH',
            path: '/api/reservations/:id/status',
            input: z.object({ status: z.string() }),
            responses: {
                200: z.custom(),
                404: errorSchemas.notFound,
            },
        },
    },
    menu: {
        list: {
            method: 'GET',
            path: '/api/menu',
            responses: {
                200: z.array(z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/menu',
            input: insertMenuItemSchema,
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
        delete: {
            method: 'DELETE',
            path: '/api/menu/:id',
            responses: {
                200: z.object({ message: z.string() }),
                404: errorSchemas.notFound,
            },
        },
        update: {
            method: 'PUT',
            path: '/api/menu/:id',
            input: insertMenuItemSchema.partial(),
            responses: {
                200: z.custom(),
                404: errorSchemas.notFound,
            },
        },
    },
    orders: {
        list: {
            method: 'GET',
            path: '/api/orders',
            responses: {
                200: z.array(z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/orders',
            input: z.object({
                order: insertOrderSchema,
                items: z.array(z.object({ menuItemId: z.number(), quantity: z.number() })),
            }),
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
        updateStatus: {
            method: 'PATCH',
            path: '/api/orders/:id/status',
            input: z.object({ status: z.string() }),
            responses: {
                200: z.custom(),
                404: errorSchemas.notFound,
            },
        },
    },
    chat: {
        list: {
            method: 'GET',
            path: '/api/chat',
            responses: {
                200: z.array(z.custom()),
            },
        },
        send: {
            method: 'POST',
            path: '/api/chat',
            input: z.object({ content: z.string() }),
            responses: {
                201: z.custom(),
                401: errorSchemas.unauthorized,
            },
        },
    },
};
export function buildUrl(path, params) {
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
//# sourceMappingURL=routes.js.map