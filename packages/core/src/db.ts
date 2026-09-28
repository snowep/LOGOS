import fs from 'fs';
import path from 'path';

export class SimpleSqliteDatabase {
  private dbPath: string;
  private memoryStore: Map<string, Map<string, any>> = new Map();

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.init();
  }

  private init() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(data);
        for (const [table, records] of Object.entries(parsed)) {
          this.memoryStore.set(table, new Map(Object.entries(records as any)));
        }
      } catch (e) {
        // Empty or new DB
      }
    }
  }

  private save() {
    const obj: any = {};
    for (const [table, records] of this.memoryStore.entries()) {
      obj[table] = Object.fromEntries(records.entries());
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(obj, null, 2), 'utf8');
  }

  async insert(table: string, id: string, record: any): Promise<void> {
    if (!this.memoryStore.has(table)) {
      this.memoryStore.set(table, new Map());
    }
    this.memoryStore.get(table)!.set(id, { ...record, id, createdAt: new Date().toISOString() });
    this.save();
  }

  async findById(table: string, id: string): Promise<any | null> {
    return this.memoryStore.get(table)?.get(id) || null;
  }

  async findAll(table: string): Promise<any[]> {
    if (!this.memoryStore.has(table)) return [];
    return Array.from(this.memoryStore.get(table)!.values());
  }

  async update(table: string, id: string, patch: any): Promise<any> {
    const existing = await this.findById(table, id);
    if (!existing) throw new Error(`Record ${id} not found in ${table}`);
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.memoryStore.get(table)!.set(id, updated);
    this.save();
    return updated;
  }

  async delete(table: string, id: string): Promise<void> {
    this.memoryStore.get(table)?.delete(id);
    this.save();
  }
}
