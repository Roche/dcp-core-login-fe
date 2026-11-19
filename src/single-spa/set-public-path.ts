// Sets the webpack public path at runtime to the folder main.js was loaded from, so lazy chunks, assets and
// config.json are loaded next to the bundle in every environment without a build-time deployUrl.
// Must be the first import of src/main.single-spa.ts.
import { resolvePublicPath, SystemJsLike } from '@open-dcp/angular-services';

/** Import-map name of this app (see module-settings/app-data.json). */
const IMPORT_MAP_NAME = '@dcp/login';

// @ts-ignore
__webpack_public_path__ = resolvePublicPath((globalThis as { System?: SystemJsLike }).System, IMPORT_MAP_NAME);
