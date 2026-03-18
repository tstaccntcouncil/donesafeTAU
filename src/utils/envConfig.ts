export interface EnvConfig {
  baseUrl: string;
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  slowMo: number;
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const getEnvConfig = (): EnvConfig => ({
  baseUrl: requireEnv('BASE_URL'),
  browserType: (process.env.BROWSER as EnvConfig['browserType']) ?? 'chromium',
  headless: process.env.HEADLESS !== 'false',
  timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 30000,
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
});
