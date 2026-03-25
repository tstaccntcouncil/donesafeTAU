module.exports = {
  default: {
    require: ['dotenv/config','src/hooks/*.ts', 'src/steps/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    //tags: '@smoke or @regression and not @wip',
    paths: ['features/**/*.feature'],
  },
};
