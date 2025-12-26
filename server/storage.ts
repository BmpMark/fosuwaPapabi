import { rooms, reservations, menuItems, orders, orderItems, type Room, type Reservation, type MenuItem, type Order, type OrderItem } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: typeof rooms.$inferInsert): Promise<Room>;
  updateRoom(id: number, updates: Partial<typeof rooms.$inferInsert>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;

  getReservations(): Promise<Reservation[]>;
  createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;

  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem>;
  updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  getOrders(): Promise<Order[]>;
  createOrder(order: typeof orders.$inferInsert, items: { menuItemId: number; quantity: number }[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {

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

  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async createReservation(reservation: typeof reservations.$inferInsert): Promise<Reservation> {
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation | undefined> {
    const [updated] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    return updated;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async createMenuItem(item: typeof menuItems.$inferInsert): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: number, updates: Partial<typeof menuItems.$inferInsert>): Promise<MenuItem | undefined> {
    const [updatedItem] = await db.update(menuItems).set(updates).where(eq(menuItems.id, id)).returning();
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    return result.length > 0;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async createOrder(order: typeof orders.$inferInsert, items: { menuItemId: number; quantity: number }[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Fetch menu item prices to record priceAtTime
    const menuItemIds = items.map(i => i.menuItemId);
    // Note: In a real app we'd fetch prices. For MVP assuming prices are stable or fetching one by one. 
    // Let's do a simple loop or assumed passed prices? No, best to fetch.
    // For MVP, let's assume we can get them.
    for (const item of items) {
       const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, item.menuItemId));
       if (menuItem) {
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

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
