"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRelations = exports.insertMessageSchema = exports.messages = exports.insertOrderItemSchema = exports.orderItems = exports.insertOrderSchema = exports.orders = exports.insertMenuItemSchema = exports.menuItems = exports.insertReservationSchema = exports.reservations = exports.insertRoomSchema = exports.rooms = exports.insertUserSchema = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const drizzle_orm_1 = require("drizzle-orm");
// Users
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    role: (0, pg_core_1.text)("role").notNull().default("guest"), // guest, staff, admin
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email"),
    phoneNumber: (0, pg_core_1.text)("phone_number"),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({ id: true });
// Rooms
exports.rooms = (0, pg_core_1.pgTable)("rooms", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    number: (0, pg_core_1.text)("number").notNull().unique(),
    type: (0, pg_core_1.text)("type").notNull(), // executive, standard, apartment
    price: (0, pg_core_1.integer)("price").notNull(), // in cedis
    description: (0, pg_core_1.text)("description").notNull(),
    capacity: (0, pg_core_1.integer)("capacity").notNull(),
    isAvailable: (0, pg_core_1.boolean)("is_available").notNull().default(true),
});
exports.insertRoomSchema = (0, drizzle_zod_1.createInsertSchema)(exports.rooms).omit({ id: true });
// Reservations
exports.reservations = (0, pg_core_1.pgTable)("reservations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    roomId: (0, pg_core_1.integer)("room_id").notNull(),
    checkIn: (0, pg_core_1.date)("check_in").notNull(),
    checkOut: (0, pg_core_1.date)("check_out").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("confirmed"), // confirmed, checked_in, checked_out, cancelled
    totalPrice: (0, pg_core_1.integer)("total_price").notNull(),
});
exports.insertReservationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.reservations).omit({ id: true });
// Menu Items
exports.menuItems = (0, pg_core_1.pgTable)("menu_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.integer)("price").notNull(), // in cedis
    category: (0, pg_core_1.text)("category").notNull(), // starter, main, dessert, drink
    available: (0, pg_core_1.boolean)("available").notNull().default(true),
    image: (0, pg_core_1.text)("image"), // image URL
    stockLevel: (0, pg_core_1.integer)("stock_level").notNull().default(0),
    lowStockThreshold: (0, pg_core_1.integer)("low_stock_threshold").notNull().default(5),
});
exports.insertMenuItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.menuItems).omit({ id: true });
// Orders
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id"), // Nullable for walk-in? Let's say required for now or handled by staff
    roomId: (0, pg_core_1.integer)("room_id"), // Optional: if room service
    type: (0, pg_core_1.text)("type").notNull(), // dine_in, room_service, take_away
    paymentMethod: (0, pg_core_1.text)("payment_method").notNull().default("cash"), // cash, room_folio
    status: (0, pg_core_1.text)("status").notNull().default("pending"), // pending, preparing, delivered, completed, billed
    totalAmount: (0, pg_core_1.integer)("total_amount").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.insertOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orders).omit({ id: true, createdAt: true });
// Order Items
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    orderId: (0, pg_core_1.integer)("order_id").notNull(),
    menuItemId: (0, pg_core_1.integer)("menu_item_id").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    priceAtTime: (0, pg_core_1.integer)("price_at_time").notNull(),
});
exports.insertOrderItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orderItems).omit({ id: true });
// Messages for Chat
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    senderId: (0, pg_core_1.integer)("sender_id").notNull(),
    receiverId: (0, pg_core_1.integer)("receiver_id"), // Null for broadcast or specific roles
    content: (0, pg_core_1.text)("content").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    isAdmin: (0, pg_core_1.boolean)("is_admin").notNull().default(false),
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messages).omit({ id: true, createdAt: true });
// Relations
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one }) => ({
    sender: one(exports.users, { fields: [exports.messages.senderId], references: [exports.users.id] }),
}));
