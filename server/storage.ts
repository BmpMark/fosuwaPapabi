import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db.js";
import {
  users, rooms, reservations, menuItems, orders,
  orderItems, messages, notifications, housekeepingTasks, maintenanceRequests,
  type User, type InsertUser, type Room, type Reservation,
  type MenuItem, type Order, type OrderItem, type Message,
  type Notification, type HousekeepingTask, type MaintenanceRequest,
} from "../shared/schema.js";


const PostgresSessionStore = connectPg(session);

// =================== Status Types ===================

type ReservationStatus = "pending" | "confirmed" | "cancelled";
type OrderStatus = "pending" | "preparing" | "completed";

// =================== Interface ===================

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: typeof rooms.$inferInsert): Promise<Room>;
  updateRoom(id: number, updates: Partial<typeof rooms.$inferInsert>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;

  getReservations(): Promise<Reservation[]>;
  createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation>;
  updateReservationStatus(id: number, status: ReservationStatus): Promise<Reservation | undefined>;

  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<boolean>;
  updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined>;

  getOrders(): Promise<Order[]>;
  createOrder(order: typeof orders.$inferInsert, items: { menuItemId: number; quantity: number }[]): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;

  getMessages(): Promise<Message[]>;
  createMessage(message: typeof messages.$inferInsert): Promise<Message>;

  getNotifications(): Promise<Notification[]>;
  createNotification(notification: typeof notifications.$inferInsert): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(): Promise<void>;

  // Housekeeping
getHousekeepingTasks(): Promise<HousekeepingTask[]>;
upsertHousekeepingTask(roomId: number, data: Partial<typeof housekeepingTasks.$inferInsert>): Promise<HousekeepingTask>;

// Maintenance
getMaintenanceRequests(): Promise<MaintenanceRequest[]>;
getMaintenanceRequestsByUser(userId: number): Promise<MaintenanceRequest[]>;
createMaintenanceRequest(data: typeof maintenanceRequests.$inferInsert): Promise<MaintenanceRequest>;
updateMaintenanceRequest(id: number, updates: Partial<typeof maintenanceRequests.$inferInsert>): Promise<MaintenanceRequest | undefined>;

  sessionStore: session.Store;
}

// =================== Implementation ===================

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  db = db;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // =================== Users ===================

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // =================== Rooms ===================

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: typeof rooms.$inferInsert): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, updates: Partial<typeof rooms.$inferInsert>): Promise<Room | undefined> {
    const [updatedRoom] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id)).returning();
    return result.length > 0;
  }

  // =================== Reservations ===================

  async getReservations(): Promise<(Reservation & { guestName?: string; guestPhone?: string })[]> {
    const allReservations = await db.select().from(reservations);

    return await Promise.all(
      allReservations.map(async (res) => {
        const user = await this.getUser(res.userId);
        return {
          ...res,
          guestName: user?.name,
          guestPhone: user?.phoneNumber || undefined,
        };
      })
    );
  }

  async getReservation(id: number) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation> {
    const existing = await db
      .select()
      .from(reservations)
      .where(eq(reservations.roomId, reservation.roomId));

    const overlap = existing.some((r) => {
      if (r.status === "cancelled") return false;

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

  async updateReservationStatus(id: number, status: ReservationStatus): Promise<Reservation | undefined> {
    const [updated] = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return updated;
  }

  async updateReservationPayment(id: number, data: { paymentIntentId?: string; paymentStatus?: string }) {
    const [updated] = await db
      .update(reservations)
      .set(data)
      .where(eq(reservations.id, id))
      .returning();
    return updated;
  }

  // =================== Menu ===================

  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    return result.length > 0;
  }

  async updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(updates).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  // =================== Orders ===================

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(
    order: typeof orders.$inferInsert,
    items: { menuItemId: number; quantity: number }[]
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();

      for (const item of items) {
        const [menuItem] = await tx
          .select()
          .from(menuItems)
          .where(eq(menuItems.id, item.menuItemId));

        if (!menuItem) continue;

        await tx
          .update(menuItems)
          .set({
            stockLevel: Math.max(0, menuItem.stockLevel - item.quantity),
          })
          .where(eq(menuItems.id, menuItem.id));

        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtTime: menuItem.price,
        });
      }

      return newOrder;
    });
  }

  // ── Housekeeping ─────────────────────────────────────────────────────────────

async getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  return await db.select().from(housekeepingTasks).orderBy(housekeepingTasks.updatedAt);
}

async upsertHousekeepingTask(
  roomId: number,
  data: Partial<typeof housekeepingTasks.$inferInsert>
): Promise<HousekeepingTask> {
  const existing = await db
    .select()
    .from(housekeepingTasks)
    .where(eq(housekeepingTasks.roomId, roomId));

  if (existing.length > 0) {
    const [updated] = await db
      .update(housekeepingTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(housekeepingTasks.roomId, roomId))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(housekeepingTasks)
      .values({ roomId, ...data, updatedAt: new Date() })
      .returning();
    return created;
  }
}

// ── Maintenance ───────────────────────────────────────────────────────────────

async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  return await db
    .select()
    .from(maintenanceRequests)
    .orderBy(maintenanceRequests.createdAt);
}

async getMaintenanceRequestsByUser(userId: number): Promise<MaintenanceRequest[]> {
  return await db
    .select()
    .from(maintenanceRequests)
    .where(eq(maintenanceRequests.reportedById, userId))
    .orderBy(maintenanceRequests.createdAt);
}

async createMaintenanceRequest(
  data: typeof maintenanceRequests.$inferInsert
): Promise<MaintenanceRequest> {
  const [created] = await db.insert(maintenanceRequests).values(data).returning();
  return created;
}

async updateMaintenanceRequest(
  id: number,
  updates: Partial<typeof maintenanceRequests.$inferInsert>
): Promise<MaintenanceRequest | undefined> {
  const [updated] = await db
    .update(maintenanceRequests)
    .set(updates)
    .where(eq(maintenanceRequests.id, id))
    .returning();
  return updated;
}

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPayment(id: number, data: { paymentIntentId?: string; paymentStatus?: string }) {
    const [updated] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // =================== Messages ===================

  async getMessages(): Promise<(Message & { sender?: { name: string } })[]> {
    const allMessages = await db.select().from(messages);

    return await Promise.all(
      allMessages.map(async (msg) => {
        const user = await this.getUser(msg.senderId);
        return {
          ...msg,
          sender: user ? { name: user.name } : undefined,
        };
      })
    );
  }

  async createMessage(message: typeof messages.$inferInsert): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // =================== Notifications ===================

  async getNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: typeof notifications.$inferInsert): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ isRead: true });
  }
}

export const storage = new DatabaseStorage();