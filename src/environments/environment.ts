// Runtime settings come from config.json; see CONFIG.md.

declare var require: any;
const packageJson = require('../../package.json');

export const environment: {[key: string]: any | any[]} = {
  angularVersion: packageJson.dependencies["@angular/common"].split('.')[0],
  isAppValidated: true,
  appName: 'Login',
};
