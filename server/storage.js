import { users, rooms, reservations, menuItems, orders, orderItems, messages } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
const PostgresSessionStore = connectPg(session);
export class DatabaseStorage {
    sessionStore;
    db = db; // Expose db for direct operations in routes if needed
    constructor() {
        this.sessionStore = new PostgresSessionStore({
            pool,
            createTableIfMissing: true,
        });
    }
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }
    async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }
    async getRooms() {
        return await db.select().from(rooms);
    }
    async getRoom(id) {
        const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
        return room;
    }
    async createRoom(room) {
        const [newRoom] = await db.insert(rooms).values(room).returning();
        return newRoom;
    }
    async updateRoom(id, updates) {
        const [updatedRoom] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
        return updatedRoom;
    }
    async deleteRoom(id) {
        const result = await db.delete(rooms).where(eq(rooms.id, id));
        return true;
    }
    async getReservations() {
        const allReservations = await db.select().from(reservations);
        const reservationsWithUsers = await Promise.all(allReservations.map(async (res) => {
            const user = await this.getUser(res.userId);
            return {
                ...res,
                guestName: user?.name,
                guestPhone: user?.phoneNumber || undefined,
            };
        }));
        return reservationsWithUsers;
    }
    async createReservation(reservation) {
        // Prevent double booking
        const existing = await db.select().from(reservations).where(eq(reservations.roomId, reservation.roomId));
        const overlap = existing.some(r => {
            if (r.status === 'cancelled')
                return false;
            const start = new Date(r.checkIn);
            const end = new Date(r.checkOut);
            const newStart = new Date(reservation.checkIn);
            const newEnd = new Date(reservation.checkOut);
            return newStart < end && newEnd > start;
        });
        if (overlap) {
            throw new Error("Room is already booked for these dates");
        }
        const [newReservation] = await db.insert(reservations).values(reservation).returning();
        return newReservation;
    }
    async updateReservationStatus(id, status) {
        const [updated] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
        return updated;
    }
    async getMenuItems() {
        return await db.select().from(menuItems);
    }
    async createMenuItem(item) {
        const [newItem] = await db.insert(menuItems).values(item).returning();
        return newItem;
    }
    async deleteMenuItem(id) {
        await db.delete(menuItems).where(eq(menuItems.id, id));
        return true;
    }
    async updateMenuItem(id, updates) {
        const [updated] = await db.update(menuItems).set(updates).where(eq(menuItems.id, id)).returning();
        return updated;
    }
    async getOrders() {
        return await db.select().from(orders);
    }
    async createOrder(order, items) {
        const [newOrder] = await db.insert(orders).values(order).returning();
        for (const item of items) {
            const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId));
            if (menuItem) {
                // Decrease stock level
                await db.update(menuItems)
                    .set({ stockLevel: Math.max(0, menuItem.stockLevel - item.quantity) })
                    .where(eq(menuItems.id, menuItem.id));
                await db.insert(orderItems).values({
                    orderId: newOrder.id,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    priceAtTime: menuItem.price
                });
            }
        }
        return newOrder;
    }
    async updateOrderStatus(id, status) {
        const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
        return updated;
    }
    async getMessages() {
        const allMessages = await db.select().from(messages);
        return await Promise.all(allMessages.map(async (msg) => {
            const user = await this.getUser(msg.senderId);
            return {
                ...msg,
                sender: user ? { name: user.name } : undefined,
            };
        }));
    }
    async createMessage(message) {
        const [newMessage] = await db.insert(messages).values(message).returning();
        return newMessage;
    }
}
export const storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map