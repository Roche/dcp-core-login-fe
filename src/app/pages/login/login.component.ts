import {Component, Inject, NgZone, OnDestroy, OnInit} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import {Subscription, lastValueFrom, BehaviorSubject} from 'rxjs';
import { VersionsComponent } from '../versions/versions.component';
import {LoginAppService} from "../login-app.service";
import {uiStore, userStore} from "@open-dcp/services";
import {APP_CONFIG, DcpRuntimeConfig} from '@open-dcp/angular-services';
import {assetUrl} from '../../../single-spa/asset-url';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  privacyPolicyUrl: string;
  public subscription: Subscription = new Subscription();
  baseAppPath: string;
  readonly loginLogoBackground = `url("${assetUrl('images/login_logo.png')}")`;

  isLoading$ = new BehaviorSubject(false);

  ssoLink = '';

  constructor(
    public translate: TranslateService,
    private readonly permissionsService: NgxPermissionsService,
    private readonly _bottomSheet: MatBottomSheet,
    private readonly loginAppService: LoginAppService,
    private readonly ngZone: NgZone,
    @Inject(APP_CONFIG) config: DcpRuntimeConfig
  ) {
    this.privacyPolicyUrl = config.privacyPolicyUrl ?? '';
    this.baseAppPath = config.baseAppUrl;

    this.subscription.add(
      uiStore.subscribe('language', lang => {
        this.ngZone.run(() => {
          if (lang) {
            this.langChange(lang);
          } else {
            this.langChange('en');
          }
        });
      })
    );
  }

  ngOnInit() {
    this.loginAppService.getRVersions();
    this.loginAppService.getBeVersions();
    this.getSSOLink();

    this.subscription.add(
      uiStore.subscribe('loading', loading => {
        this.ngZone.run(() => {
          this.isLoading$.next(Object.keys(loading).length > 0);
        })
      })
    );

    this.permissionsService.flushPermissions();
    const accessToken = userStore.getState().token;
    this.checkAccessToken(accessToken);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async checkAccessToken(accessToken: string) {
    if (accessToken) {
      const tokenIsValid = await this.validateToken(accessToken);
      if (!tokenIsValid) {
        localStorage.removeItem('user');
        this.clearInitialUserData()
        return;
      }
      const siteId = uiStore.getState().site.id;
      if (siteId > 0) {
        this.loginAppService.redirectAfterLogin();
      } else {
        const sites = userStore.getState().sites;
        if (sites[0]?.SiteId) {
          const newSite = sites[0];
          this.loginAppService.triggerChangeSite({...newSite, Id: newSite.SiteId});
        }
        this.loginAppService.redirectAfterLogin();
      }
    } else {
      this.clearInitialUserData()
    }
  }

  private clearInitialUserData() {
    uiStore.setActiveModules([]);
    this.loginAppService.triggerChangeSite({Id: 0, Name: '', TimeZone: ''});
    localStorage.removeItem('mainMenu');
    sessionStorage.removeItem('permissionsGridList');
    this.clearLocalStorageIdle();
  }


  langChange(e) {
    uiStore.setLanguage(e);
  }

  signInSSO() {
    window.location.href = this.ssoLink;
  }

  openBottomSheet(): void {
    this._bottomSheet.open(VersionsComponent);
  }

  private getSSOLink() {
    uiStore.setLoading('getSSOLink');
    lastValueFrom(this.loginAppService.getSSOLink())
      .then(res => {
        this.ssoLink = res;
      })
      .finally(() => {
        uiStore.removeLoading('getSSOLink');
      });
  }

  private clearLocalStorageIdle() {
    const allItems = {...localStorage}
    const ngIdleElements = Object.keys(allItems).filter(el => el.startsWith('ng2Idle.'));
    ngIdleElements.forEach(el => {
      localStorage.removeItem(el);
    });
  }

  private async validateToken(accessToken: string) {
    return new Promise(resolve => {
      lastValueFrom(this.loginAppService.validate(accessToken))
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        })
    });
  }
}
