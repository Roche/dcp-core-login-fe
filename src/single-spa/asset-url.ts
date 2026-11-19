// In single-spa, the assets need to be loaded from a dynamic location,
// instead of hard coded to `/assets`. We use webpack public path for this.
// See https://webpack.js.org/guides/public-path/#root
import { assetUrl as joinAssetUrl, publicPathUrl as joinPublicPathUrl } from '@open-dcp/angular-services';

function webpackPublicPath(): string {
  // @ts-ignore
  return __webpack_public_path__;
}

export function publicPathUrl(url: string): string {
  return joinPublicPathUrl(webpackPublicPath(), url);
}

export function assetUrl(url: string): string {
  return joinAssetUrl(webpackPublicPath(), url);
}
