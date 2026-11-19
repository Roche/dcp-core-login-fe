import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { SsoComponent } from './sso/sso.component';
import { VersionsComponent } from './versions/versions.component';
import {LoginAppService} from "./login-app.service";
import {CubeLoaderComponent} from "../cube-loader/cube-loader.component";
import {TopLoadingBarComponent} from "../top-loading-bar/top-loading-bar.component";
import {TranslateModule} from "@ngx-translate/core";
import {DcSharedModule} from "../shared/shared-login.module";
export { LoginComponent } from './login/login.component';
export { SsoComponent } from './sso/sso.component';

@NgModule({
  imports: [
    CommonModule,
    DcSharedModule,
    CubeLoaderComponent,
    TopLoadingBarComponent,
    TranslateModule
  ],
  declarations: [
    LoginComponent,
    SsoComponent,
    VersionsComponent,
  ],
  exports: [
    LoginComponent,
    SsoComponent,
    VersionsComponent,
  ],
  providers: [LoginAppService]
})
export class PagesLoginModule {}
