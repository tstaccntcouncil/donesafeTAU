import { IConfiguration } from '@cucumber/cucumber/api';


dotenv.config();

const config: Partial<IConfiguration> = {
  require: ['src/hooks/*.ts', 'src/steps/*.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  publishQuiet: true,
};

export default config;
