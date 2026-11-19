import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatButtonModule} from '@angular/material/button';
import {Angulartics2Module} from 'angulartics2';
import {LottieComponent} from "ngx-lottie";

const imports = [
  RouterModule,
  TranslateModule,
  MatMenuModule,
  MatIconModule,
  MatProgressBarModule,
  MatButtonModule,
  MatBottomSheetModule,
  Angulartics2Module,
  LottieComponent
];

@NgModule({
  imports: [CommonModule, ...imports],
  exports: imports,
})
export class DcSharedModule {}
