const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (angularWebpackConfig, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(angularWebpackConfig, options);

  // Feel free to modify this webpack config however you'd like to
  // The public path is set at runtime by src/single-spa/set-public-path.ts (no build-time deployUrl). 'auto' does not
  // work here: the UMD bundle runs after its <script> finished (no document.currentScript) and has no import.meta.
  singleSpaWebpackConfig.output.publicPath = '';
  return singleSpaWebpackConfig;
}
