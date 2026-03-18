export interface EnvConfig {
  baseUrl: string;
  browserType: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  slowMo: number;
}

export const getEnvConfig = (): EnvConfig => ({
  baseUrl: process.env.BASE_URL ?? 'https://aucklandcounciltest.pb1.donesafe.com/users/sign_in',
  browserType: (process.env.BROWSER as EnvConfig['browserType']) ?? 'chromium',
  headless: process.env.HEADLESS !== 'false',
  timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 30000,
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
});
