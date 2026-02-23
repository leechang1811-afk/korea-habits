import { db } from "./db";
import { contacts, type InsertContact, type Contact } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
}

export class DatabaseStorage implements IStorage {
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }
  
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }
}

export const storage = new DatabaseStorage();
