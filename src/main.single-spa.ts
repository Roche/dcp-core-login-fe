import './single-spa/set-public-path';
import { enableProdMode, NgZone } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';
import { AppModule } from './app/app.module';
import { appConfigLoader } from './app/shared/config/app-config';
import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import {environment} from './environments/environment';
import '@angular/localize/init';
import { gxpStoreRegistration, StoreRegistrationResult, uiStore, uiStoreRegistration, userStoreRegistration } from '@open-dcp/services';
import { applyRuntimeTheme } from '@open-dcp/angular-services';

applyRuntimeTheme({ logPrefix: '[Login]' });

type RegistrationEnvelope = {
  registration: StoreRegistrationResult;
};

const GLOBAL_ERROR = {
  "en": {
    "store-initialization-failed": "Failed to initialize store. Please reload the app or contact support.",
    "config-load-failed": "Failed to load app configuration. Please reload the app or contact support."
  },
  "de": {
    "store-initialization-failed": "Failed to initialize store. Please reload the app or contact support.",
    "config-load-failed": "Die App-Konfiguration konnte nicht geladen werden. Bitte laden Sie die App neu oder wenden Sie sich an den Support."
  }
};

function showError(message: string) {
  const style = document.createElement("style");
  style.textContent = `
    #login-store-initialization-failed {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      background: #fff;
      text-align: center;
    }
  `;

  const box = document.createElement("div");
  box.id = "login-store-initialization-failed";

  const detail = document.createElement("p");
  detail.textContent = message;

  box.append(detail);
  document.head.appendChild(style);
  document.body.appendChild(box);
}

export async function initializeRegistrationState(
  registrationPromise: Promise<RegistrationEnvelope>
): Promise<void> {
    const { registration } = await registrationPromise;

    if (registration.status === 'rejected-incompatible-downgrade' ||
        registration.status === 'rejected-incompatible-upgrade') {
      const uiState = uiStore.getState();
      showError(GLOBAL_ERROR[uiState.language]["store-initialization-failed"]);
      throw new Error(`[Login] Incompatible registration (${registration.status})`);
    }
}

async function registrationInitializerFactory() {
  await initializeRegistrationState(uiStoreRegistration);
  await initializeRegistrationState(userStoreRegistration);
  await initializeRegistrationState(gxpStoreRegistration);
}

async function appConfigInitializerFactory() {
  try {
    const config = await appConfigLoader.load();
    if (config.production) {
      enableProdMode();
    }
  } catch (error) {
    const messages = GLOBAL_ERROR[uiStore.getState().language] ?? GLOBAL_ERROR.en;
    uiStore.setMessage('error', messages['config-load-failed']);
    throw error;
  }
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: async singleSpaProps => {
    applyRuntimeTheme({ logPrefix: '[Login]' });
    singleSpaPropsSubject.next(singleSpaProps);
    await appConfigLoader.load(); // ensures APP_CONFIG is available
    return platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule);
  },
  template: `<app-login-root data-angular="${environment.angularVersion}" class="dc-app-root">
    </app-login-root>`,
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = [].concat(appConfigInitializerFactory, registrationInitializerFactory, lifecycles.bootstrap);
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
