import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {EmptyRouteComponent} from './empty-route/empty-route.component';
import {NgxPermissionsModule} from 'ngx-permissions';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {Angulartics2Module} from 'angulartics2';
import {MultiTranslateHttpLoader} from 'ngx-translate-multi-http-loader';
import {environment} from '../environments/environment';
import player from 'lottie-web/build/player/lottie_svg';
import {PagesLoginModule} from "./pages/pages.module";
import {provideLottieOptions} from "ngx-lottie";
import {InfoModalComponent} from "./info-modal/info-modal.component";
import {GxpApp, provideRuntimeConfig} from "@open-dcp/angular-services";
import {appConfigLoader} from './shared/config/app-config';
import {assetUrl} from '../single-spa/asset-url';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new MultiTranslateHttpLoader(http, [
    {prefix: assetUrl('i18n/'), suffix: '.json'},
    {prefix: assetUrl('translations/'), suffix: '-login.json'},
  ]);
}

@NgModule({
  declarations: [
    AppComponent,
    EmptyRouteComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    PagesLoginModule,
    AppRoutingModule,
    InfoModalComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    NgxPermissionsModule.forRoot(),
    Angulartics2Module.forRoot()
  ],
  providers: [
    // APP_CONFIG and HttpConfig (gatewayUrl) from the config.json loaded during bootstrap
    provideRuntimeConfig(appConfigLoader),
    {
      provide: GxpApp,
      useValue: {
        name: environment.appName,
        isValidated: environment.isAppValidated
      }
    },
    provideLottieOptions({
      player: () => player,
    }),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
