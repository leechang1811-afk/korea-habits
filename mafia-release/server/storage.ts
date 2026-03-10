import { db } from "./db";
import { contacts, type InsertContact, type Contact } from "@shared/schema";

export interface IStorage {
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
}

export class MemStorage implements IStorage {
  private contacts: Contact[] = [];
  private nextId = 1;

  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact: Contact = { id: this.nextId++, ...contact } as Contact;
    this.contacts.push(newContact);
    return newContact;
  }

  async getContacts(): Promise<Contact[]> {
    return this.contacts;
  }
}

export class DatabaseStorage implements IStorage {
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db!.insert(contacts).values(contact).returning();
    return newContact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db!.select().from(contacts);
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemStorage();
