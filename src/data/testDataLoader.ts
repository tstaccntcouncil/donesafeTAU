import * as fs from 'fs';
import * as path from 'path';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  manager: string;
  location: string;
  organization: string;
  userType: string;
}

export interface SearchData {
  users: UserRecord[];
  defaultUser: string;
  invalidEmails: string[];
}

export interface TestData {
  search: SearchData;
}

class TestDataLoader {
  private data: TestData;
  private readonly dataFilePath: string;

  constructor() {
    this.dataFilePath = path.resolve(__dirname, 'testData.json');
    this.data = this.load();
  }

  private load(): TestData {
    if (!fs.existsSync(this.dataFilePath)) {
      throw new Error(`Test data file not found: ${this.dataFilePath}`);
    }
    const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
    return JSON.parse(raw) as TestData;
  }

  // ── Search data helpers ──────────────────────────────────────────────────

  getDefaultUser(): UserRecord {
    const { users, defaultUser } = this.data.search;
    const user = users.find((u) => u.id === defaultUser);
    if (!user) throw new Error(`Default user "${defaultUser}" not found in testData.json`);
    return user;
  }

  getUserByEmail(email: string): UserRecord {
    const user = this.data.search.users.find((u) => u.email === email);
    if (!user) throw new Error(`User with email "${email}" not found in testData.json`);
    return user;
  }

  getUserById(id: string): UserRecord {
    const user = this.data.search.users.find((u) => u.id === id);
    if (!user) throw new Error(`User with id "${id}" not found in testData.json`);
    return user;
  }

  getAllUsers(): UserRecord[] {
    return this.data.search.users;
  }

  getInvalidEmails(): string[] {
    return this.data.search.invalidEmails;
  }

  // ── Raw access ───────────────────────────────────────────────────────────

  getRaw(): TestData {
    return this.data;
  }
}

// Export a singleton so the file is only read once per run
export const testData = new TestDataLoader();
