import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/* ===================== USERS ===================== */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("guest"),
  name: text("name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ===================== ROOMS ===================== */

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  capacity: integer("capacity").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });

/* ===================== RESERVATIONS ===================== */

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roomId: integer("room_id").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),

  status: text("status").notNull().default("pending"),
  totalPrice: integer("total_price").notNull(),

  // ✅ Payments (Paystack + optional Stripe)
  paymentMethod: text("payment_method").notNull().default("cash"),
  paymentReference: text("payment_reference"), // Paystack
  paymentStatus: text("payment_status").notNull().default("pending"),

  paymentIntentId: text("payment_intent_id"), // Stripe (optional)
});

export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true });

/* ===================== MENU ===================== */

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  available: boolean("available").notNull().default(true),
  image: text("image"),
  stockLevel: integer("stock_level").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });

/* ===================== ORDERS ===================== */

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  roomId: integer("room_id"),

  type: text("type").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  status: text("status").notNull().default("pending"),

  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // ✅ Payments
  paymentReference: text("payment_reference"), // Paystack
  paymentStatus: text("payment_status").notNull().default("pending"),

  paymentIntentId: text("payment_intent_id"), // Stripe (optional)
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

/* ===================== ORDER ITEMS ===================== */

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

/* ===================== MESSAGES ===================== */

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

/* ===================== NOTIFICATIONS ===================== */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});


// Housekeeping Tasks — one record per room, upserted on status changes
export const housekeepingTasks = pgTable("housekeeping_tasks", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().unique(), // one active task per room
  status: text("status").notNull().default("clean"), // clean | dirty | in_progress | inspected
  assignedTo: integer("assigned_to"),              // staff user id
  notes: text("notes"),
  scheduledFor: date("scheduled_for"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHousekeepingTaskSchema = createInsertSchema(housekeepingTasks)
  .extend({ id: z.undefined(), updatedAt: z.undefined() })
  .omit({ id: true, updatedAt: true });

export type HousekeepingTask = typeof housekeepingTasks.$inferSelect;
export type InsertHousekeepingTask = typeof housekeepingTasks.$inferInsert;

// Maintenance Requests
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id"),                      // nullable — covers common areas too
  reportedById: integer("reported_by_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low | medium | high | urgent
  status: text("status").notNull().default("open"),       // open | in_progress | resolved
  assignedTo: integer("assigned_to"),
  notes: text("notes"),                            // resolution / progress notes
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests)
  .omit({ id: true, createdAt: true, resolvedAt: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    reportedById: z.number().optional(), // you'll override it anyway
  });

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
/* ===================== TYPES ===================== */

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

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