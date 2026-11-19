import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Angulartics2 } from 'angulartics2';
import {DeviceDetectorService} from 'ngx-device-detector';
import {MatDialog} from "@angular/material/dialog";
import {InfoModalComponent} from "./info-modal/info-modal.component";
import {uiStore} from "@open-dcp/services";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-login-root',
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent implements OnInit, OnDestroy {

  subscription = new Subscription();

  constructor(
    public translate: TranslateService,
    public angulartics2: Angulartics2,
    public deviceService: DeviceDetectorService,
    private readonly dialog: MatDialog,
    private readonly ngZone: NgZone
  ) {
    translate.addLangs(['en', 'de']);
    translate.setDefaultLang('de');
    translate.setDefaultLang('en');
    const lang = uiStore.getState().language || 'en'
    translate.use(lang);

    this.subscription.add(
      uiStore.subscribe('language', (language) => {
        this.ngZone.run(() => {
          if (language) {
            translate.use(language);
          }
        })
      })
    );
  }

  ngOnInit() {
        
    try {
      document.getElementById('loader').style.display = 'none';
    } catch (e) {}

    const browserInfo = this.deviceService.getDeviceInfo();
    if (browserInfo.browser.toLowerCase() !== 'chrome') {
      this.translate.get('VALIDATIONS.CHROME_BROWSER_NOTIFICATION').subscribe(err => {
        const browserInfoText = err;
        this.openInfoModal(browserInfoText);
      });
    }   
  }

  ngOnDestroy() {
    try {
      // Fix for Angular 9 + SingleSpa. Remove when the issue is fixed: https://github.com/single-spa/single-spa-angular/issues/130
      // Solution (seems to work for now): Cleanup the DOM manually on destroy.
      const appName = '@dcp/login';
      const element = document.getElementById(`single-spa-application:${appName}`);
      element.innerHTML = '';
      document.getElementById('loader').style.display = 'flex';
    } catch (e) {}
  }

  private openInfoModal(browserInfoText: string) {
    const dialogRef = this.dialog.open(InfoModalComponent, {
      width: '400px',
      minWidth: '300px',
      panelClass: 'model-preview',
      data: { infoText: browserInfoText } // This replaces @Input()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If we need to make some action after close Info modal for wrong browser here is the place
      }
    });
  }
  
}
