import * as fs from 'fs';
import * as path from 'path';

export interface OrganizationRecord {
  name: string;
  level: string;
  parent: string;
  hoursWorked: string;
  externalUuid: string;
}

/*

        "name": "Auckland Council Group",
        "level": "",
        "parent": "",
        "hoursWorked": "1",
        "externalUuid": "60000001"

*/

export interface SearchOrganizationData {
  organizations: OrganizationRecord[];
  defaultOrganization: string;
}

export interface TestOrganizationData {
  search: SearchOrganizationData;
}

class TestOrganizationDataLoader {
  private data: TestOrganizationData;
  private readonly dataFilePath: string;

  constructor() {
    this.dataFilePath = path.resolve(__dirname, 'testOrganizationData.json');
    this.data = this.load();
  }

  private load(): TestOrganizationData {
    if (!fs.existsSync(this.dataFilePath)) {
      throw new Error(`Test organization data file not found: ${this.dataFilePath}`);
    }
    const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
    return JSON.parse(raw) as TestOrganizationData;
  }

  // ── Search data helpers ──────────────────────────────────────────────────

  getDefaultOrganization(): OrganizationRecord {

    const search = this.data?.search;
    if (!search) throw new Error('this.data.search is undefined');

    const { organizations, defaultOrganization } = search;
    if (!organizations) throw new Error('organizations is undefined in this.data.search');

    const organization = organizations.find((o) => o.externalUuid === defaultOrganization);
    if (!organization) throw new Error(`Default organization "${defaultOrganization}" not found in testOrganizationData.json`);
    return organization;

  }

  // ── Raw access ───────────────────────────────────────────────────────────
  getRaw(): TestOrganizationData {
    return this.data;
  }
}

// Export a singleton so the file is only read once per run
export const testOrganizationData = new TestOrganizationDataLoader();
