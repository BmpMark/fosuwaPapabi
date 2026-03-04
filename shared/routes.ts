// import express, { Request, Response } from "express";
// import bcrypt from "bcryptjs";
// import * as storage from "../server/storage.js";


// import {
//   insertUserSchema,
//   insertRoomSchema,
//   insertReservationSchema,
//   insertMenuItemSchema,
//   insertOrderSchema,
//   insertOrderItemSchema,
//   insertMessageSchema,
//   users, rooms, orders, messages
// } from "../shared/schema.js";

// const router = express.Router();

// // ------------------- User Routes -------------------
// router.post("/users", async (req: Request, res: Response) => {
//   try {
//     const parsed = insertUserSchema.parse(req.body);
//     const hashedPassword = await bcrypt.hash(parsed.password, 10);
//     const user = await storage.createUser({ ...parsed, password: hashedPassword });
//     res.status(201).json(user);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- Room Routes -------------------
// router.post("/rooms", async (req: Request, res: Response) => {
//   try {
//     const room = insertRoomSchema.parse(req.body);
//     const newRoom = await storage.createRoom(room);
//     res.status(201).json(newRoom);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- Reservation Routes -------------------
// router.post("/reservations", async (req: Request, res: Response) => {
//   try {
//     const reservation = insertReservationSchema.parse(req.body);
//     const newReservation = await storage.createReservation(reservation);
//     res.status(201).json(newReservation);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- MenuItem Routes -------------------
// router.post("/menu-items", async (req: Request, res: Response) => {
//   try {
//     const item = insertMenuItemSchema.parse(req.body);
//     const newItem = await storage.createMenuItem(item);
//     res.status(201).json(newItem);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- Order Routes -------------------
// router.post("/orders", async (req: Request, res: Response) => {
//   try {
//     const order = insertOrderSchema.parse(req.body);
//     const newOrder = await storage.createOrder(order);
//     res.status(201).json(newOrder);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- OrderItem Routes -------------------
// router.post("/order-items", async (req: Request, res: Response) => {
//   try {
//     const orderItem = insertOrderItemSchema.parse(req.body);
//     const newOrderItem = await storage.createOrderItem(orderItem);
//     res.status(201).json(newOrderItem);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// // ------------------- Message Routes -------------------
// router.post("/messages", async (req: Request, res: Response) => {
//   try {
//     const user = (req as any).user as { id: number; role: string };

//     const parsed = insertMessageSchema.parse({
//       ...req.body,
//       senderId: user.id,
//       isAdmin: user.role !== "guest",
//     });

//     const newMessage = await storage.createMessage(parsed);
//     res.status(201).json(newMessage);
//   } catch (err) {
//     res.status(400).json({ error: (err as Error).message });
//   }
// });

// export const api = router;


import { z } from 'zod';
import { insertUserSchema, insertRoomSchema, insertReservationSchema, insertMenuItemSchema, insertOrderSchema, insertOrderItemSchema, users, rooms, reservations, menuItems, orders, messages } from './schema.js';


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
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
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
    delete: {
      method: 'DELETE' as const,
      path: '/api/rooms/:id',
      responses: {
        200: z.object({ message: z.string() }),
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
    delete: {
      method: 'DELETE' as const,
      path: '/api/menu/:id',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/menu/:id',
      input: insertMenuItemSchema.partial(),
      responses: {
        200: z.custom<typeof menuItems.$inferSelect>(),
        404: errorSchemas.notFound,
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
      // Wrap the schema to help TypeScript's inference engine
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
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/chat',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/chat',
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        401: errorSchemas.unauthorized,
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
