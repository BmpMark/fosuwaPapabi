"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.errorSchemas = void 0;
exports.buildUrl = buildUrl;
const zod_1 = require("zod");
const schema_1 = require("./schema");
exports.errorSchemas = {
    validation: zod_1.z.object({
        message: zod_1.z.string(),
        field: zod_1.z.string().optional(),
    }),
    notFound: zod_1.z.object({
        message: zod_1.z.string(),
    }),
    internal: zod_1.z.object({
        message: zod_1.z.string(),
    }),
    unauthorized: zod_1.z.object({
        message: zod_1.z.string(),
    })
};
exports.api = {
    auth: {
        register: {
            method: 'POST',
            path: '/api/register',
            input: schema_1.insertUserSchema,
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        login: {
            method: 'POST',
            path: '/api/login',
            input: zod_1.z.object({ username: zod_1.z.string(), password: zod_1.z.string() }),
            responses: {
                200: zod_1.z.custom(),
                401: exports.errorSchemas.unauthorized,
            },
        },
        logout: {
            method: 'POST',
            path: '/api/logout',
            responses: {
                200: zod_1.z.object({ message: zod_1.z.string() }),
            },
        },
        user: {
            method: 'GET',
            path: '/api/user',
            responses: {
                200: zod_1.z.custom(),
                401: exports.errorSchemas.unauthorized,
            },
        },
    },
    rooms: {
        list: {
            method: 'GET',
            path: '/api/rooms',
            responses: {
                200: zod_1.z.array(zod_1.z.custom()),
            },
        },
        get: {
            method: 'GET',
            path: '/api/rooms/:id',
            responses: {
                200: zod_1.z.custom(),
                404: exports.errorSchemas.notFound,
            },
        },
        create: {
            method: 'POST',
            path: '/api/rooms',
            input: schema_1.insertRoomSchema,
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        update: {
            method: 'PUT',
            path: '/api/rooms/:id',
            input: schema_1.insertRoomSchema.partial(),
            responses: {
                200: zod_1.z.custom(),
                404: exports.errorSchemas.notFound,
            },
        },
        delete: {
            method: 'DELETE',
            path: '/api/rooms/:id',
            responses: {
                200: zod_1.z.object({ message: zod_1.z.string() }),
                404: exports.errorSchemas.notFound,
            },
        },
    },
    reservations: {
        list: {
            method: 'GET',
            path: '/api/reservations',
            responses: {
                200: zod_1.z.array(zod_1.z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/reservations',
            input: schema_1.insertReservationSchema,
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        updateStatus: {
            method: 'PATCH',
            path: '/api/reservations/:id/status',
            input: zod_1.z.object({ status: zod_1.z.string() }),
            responses: {
                200: zod_1.z.custom(),
                404: exports.errorSchemas.notFound,
            },
        },
    },
    menu: {
        list: {
            method: 'GET',
            path: '/api/menu',
            responses: {
                200: zod_1.z.array(zod_1.z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/menu',
            input: schema_1.insertMenuItemSchema,
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        delete: {
            method: 'DELETE',
            path: '/api/menu/:id',
            responses: {
                200: zod_1.z.object({ message: zod_1.z.string() }),
                404: exports.errorSchemas.notFound,
            },
        },
        update: {
            method: 'PUT',
            path: '/api/menu/:id',
            input: schema_1.insertMenuItemSchema.partial(),
            responses: {
                200: zod_1.z.custom(),
                404: exports.errorSchemas.notFound,
            },
        },
    },
    orders: {
        list: {
            method: 'GET',
            path: '/api/orders',
            responses: {
                200: zod_1.z.array(zod_1.z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/orders',
            input: zod_1.z.object({
                order: schema_1.insertOrderSchema,
                items: zod_1.z.array(zod_1.z.object({ menuItemId: zod_1.z.number(), quantity: zod_1.z.number() })),
            }),
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        updateStatus: {
            method: 'PATCH',
            path: '/api/orders/:id/status',
            input: zod_1.z.object({ status: zod_1.z.string() }),
            responses: {
                200: zod_1.z.custom(),
                404: exports.errorSchemas.notFound,
            },
        },
    },
    chat: {
        list: {
            method: 'GET',
            path: '/api/chat',
            responses: {
                200: zod_1.z.array(zod_1.z.custom()),
            },
        },
        send: {
            method: 'POST',
            path: '/api/chat',
            input: zod_1.z.object({ content: zod_1.z.string() }),
            responses: {
                201: zod_1.z.custom(),
                401: exports.errorSchemas.unauthorized,
            },
        },
    },
};
function buildUrl(path, params) {
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
