// import {
//   pgTable,
//   text,
//   serial,
//   integer,
//   boolean,
//   timestamp,
//   date,
// } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";

// /* =======================
//    USERS
// ======================= */

// export const users = pgTable("users", {
//   id: serial("id").primaryKey(),
//   username: text("username").notNull().unique(),
//   password: text("password").notNull(),
//   role: text("role").notNull().default("guest"),
//   name: text("name").notNull(),
//   email: text("email"),
//   phoneNumber: text("phone_number"),
// });

// export const insertUserSchema = createInsertSchema(users).omit({ id: true });
// export type User = typeof users.$inferSelect;
//  export type InsertUser = z.infer<typeof insertUserSchema>;

// /* =======================
//    ROOMS
// ======================= */

// export const rooms = pgTable("rooms", {
//   id: serial("id").primaryKey(),
//   number: text("number").notNull().unique(),
//   type: text("type").notNull(),
//   price: integer("price").notNull(),
//   description: text("description").notNull(),
//   capacity: integer("capacity").notNull(),
//   isAvailable: boolean("is_available").notNull().default(true),
// });

// export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
// export type Room = typeof rooms.$inferSelect;
// export type InsertRoom = z.infer<typeof insertRoomSchema>;

// /* =======================
//    RESERVATIONS
// ======================= */

// export const reservations = pgTable("reservations", {
//   id: serial("id").primaryKey(),
//   userId: integer("user_id").notNull(),
//   roomId: integer("room_id").notNull(),
//   checkIn: date("check_in").notNull(),
//   checkOut: date("check_out").notNull(),
//   status: text("status").notNull().default("confirmed"),
//   totalPrice: integer("total_price").notNull(),
// });

// export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true });
// export type Reservation = typeof reservations.$inferSelect;
//  export type InsertReservation = z.infer<typeof insertReservationSchema>;

// /* =======================
//    MENU ITEMS
// ======================= */

// export const menuItems = pgTable("menu_items", {
//   id: serial("id").primaryKey(),
//   name: text("name").notNull(),
//   description: text("description").notNull(),
//   price: integer("price").notNull(),
//   category: text("category").notNull(),
//   available: boolean("available").notNull().default(true),
//   image: text("image"),
//   stockLevel: integer("stock_level").notNull().default(0),
//   lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
// });

// export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
// export type MenuItem = typeof menuItems.$inferSelect;
//  export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

// /* =======================
//    ORDERS
// ======================= */

// export const orders = pgTable("orders", {
//   id: serial("id").primaryKey(),
//   userId: integer("user_id"),
//   roomId: integer("room_id"),
//   type: text("type").notNull(),
//   paymentMethod: text("payment_method").notNull().default("cash"),
//   status: text("status").notNull().default("pending"),
//   totalAmount: integer("total_amount").notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });

// export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
// export type Order = typeof orders.$inferSelect;
// export type InsertOrder = z.infer<typeof insertOrderSchema>;

// /* =======================
//    ORDER ITEMS
// ======================= */

// export const orderItems = pgTable("order_items", {
//   id: serial("id").primaryKey(),
//   orderId: integer("order_id").notNull(),
//   menuItemId: integer("menu_item_id").notNull(),
//   quantity: integer("quantity").notNull(),
//   priceAtTime: integer("price_at_time").notNull(),
// });

// export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
// export type OrderItem = typeof orderItems.$inferSelect;
// export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// /* =======================
//    MESSAGES
// ======================= */

// export const messages = pgTable("messages", {
//   id: serial("id").primaryKey(),
//   senderId: integer("sender_id").notNull(),
//   receiverId: integer("receiver_id"),
//   content: text("content").notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   isAdmin: boolean("is_admin").notNull().default(false),
// });

// export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
// export type Message = typeof messages.$inferSelect;
//  export type InsertMessage = z.infer<typeof insertMessageSchema>;

// /* =======================
//    RELATIONS
// ======================= */


// export const messagesRelations = relations(messages, ({ one }) => ({
//   sender: one(users, {
//     fields: [messages.senderId],
//     references: [users.id],
//   }),
// }));





import { pgTable, text, serial, integer, boolean, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("guest"), // guest, staff, admin
  name: text("name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
});

// export const insertUserSchema = createInsertSchema(users, {
//   id: (schema) => schema.id.optional(),
// }).omit({ id: true });
 export const insertUserSchema = createInsertSchema(users).extend({ id: z.undefined() }).omit({ id: true });
export type InsertUser = typeof users.$inferInsert;


// Rooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(), // executive, standard, apartment
  price: integer("price").notNull(), // in cedis
  description: text("description").notNull(),
  capacity: integer("capacity").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

// export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertRoomSchema = createInsertSchema(rooms).extend({ id: z.undefined() }).omit({ id: true });
// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roomId: integer("room_id").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, checked_in, checked_out, cancelled
  totalPrice: integer("total_price").notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).extend({ id: z.undefined() }).omit({ id: true });

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cedis
  category: text("category").notNull(), // starter, main, dessert, drink
  available: boolean("available").notNull().default(true),
  image: text("image"), // image URL
  stockLevel: integer("stock_level").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).extend({ id: z.undefined() }).omit({ id: true });

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Nullable for walk-in? Let's say required for now or handled by staff
  roomId: integer("room_id"), // Optional: if room service
  type: text("type").notNull(), // dine_in, room_service, take_away
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, room_folio
  status: text("status").notNull().default("pending"), // pending, preparing, delivered, completed, billed
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).extend({ id: z.undefined(), createdAt: z.undefined() }).omit({ id: true, createdAt: true });

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).extend({ id: z.undefined() }).omit({ id: true });


// Messages for Chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"), // Null for broadcast or specific roles
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).extend({ id: z.undefined(), createdAt: z.undefined() }).omit({ id: true, createdAt: true });

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "reservation" | "order"
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).extend({ id: z.undefined(), createdAt: z.undefined() }).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Message = typeof messages.$inferSelect;