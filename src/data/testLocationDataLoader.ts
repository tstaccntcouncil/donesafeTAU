import * as fs from 'fs';
import * as path from 'path';

export interface LocationRecord {
  parentLocation: string;
  name: string;
  addressLn1: string;
  addressLn2: string;
  suburb: string;
  state: string;
  country: string;
  postCode: string;
  hoursWorked: string;
  externalId: string;
}

export interface SearchLocationData {
  locations: LocationRecord[];
  defaultLocation: string;
}

export interface TestLocationData {
  search: SearchLocationData;
}

class TestLocationDataLoader {
  private data: TestLocationData;
  private readonly dataFilePath: string;

  constructor() {
    this.dataFilePath = path.resolve(__dirname, 'testLocationData.json');
    this.data = this.load();
  }

  private load(): TestLocationData {
    if (!fs.existsSync(this.dataFilePath)) {
      throw new Error(`Test location data file not found: ${this.dataFilePath}`);
    }
    const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
    return JSON.parse(raw) as TestLocationData;
  }

  // ── Search data helpers ──────────────────────────────────────────────────

  getDefaultLocation(): LocationRecord {
    /*
    const { locations, defaultLocation } = this.data.search;
    const location = locations.find((l) => l.externalId === defaultLocation);
    if (!location) throw new Error(`Default location "${defaultLocation}" not found in testLocationData.json`);
    return location;
    */
    const search = this.data?.search;
    if (!search) throw new Error('this.data.search is undefined');

    const { locations, defaultLocation } = search;
    if (!locations) throw new Error('locations is undefined in this.data.search');

    const location = locations.find((l) => l.externalId === defaultLocation);
    if (!location) throw new Error(`Default location "${defaultLocation}" not found in testLocationData.json`);
    return location;

  }

  // ── Raw access ───────────────────────────────────────────────────────────
  getRaw(): TestLocationData {
    return this.data;
  }
}

// Export a singleton so the file is only read once per run
export const testLocationData = new TestLocationDataLoader();
