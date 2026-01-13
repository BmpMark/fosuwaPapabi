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

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

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

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });

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

export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true });

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

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });

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

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });


// Messages for Chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id"), // Null for broadcast or specific roles
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
