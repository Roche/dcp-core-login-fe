import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, lastValueFrom, Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {DcHttp, OdcpPermissionsService} from "@open-dcp/angular-services";
import {NgxPermissionsService} from "ngx-permissions";
import {AdUserModel, TokenResponse, UserInfoResponse} from "../shared/user.model";
import {SharedConstants} from "../shared/shared-constant";
import {uiStore, userStore} from "@open-dcp/services";
import * as momentTZ from "moment-timezone";

export const PLATFORM_GUEST = 'PLATFORMGUEST';
export const PLATFORM_ADMIN = 'PLATFORMADMIN';

export interface RVersion {
  'R'?: string;
  'R-Package'?: string;
  BaseUrl?: string;
  Modules?: any;
}

export interface IBEVersions {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginAppService implements OnDestroy {

  public readonly beVersions: BehaviorSubject<IBEVersions> = new BehaviorSubject({});
  public readonly rVersions: BehaviorSubject<RVersion[]> = new BehaviorSubject([]);

  constructor(
    private readonly http: DcHttp,
    private readonly httpClient: HttpClient,
    private readonly router: Router,
    private readonly permissionsService: NgxPermissionsService,
    private readonly dcPermissionsService: OdcpPermissionsService
  ) { }

  ngOnDestroy() {
    this.beVersions.complete();
    this.rVersions.complete();
  }

  private getBEVersionsCall(): Observable<IBEVersions> {
    return this.http.get(
      `${this.http.gatewayModuleUrl('modules')}/version`
    );
  }

  getFEVersions(): Observable<IBEVersions> {
    return this.http.get(
      `${this.http.gatewayModuleUrl('registry')}/microfrontends/versions`
    );
  }

  private getRVersionPackageCall(): Observable<RVersion[]> {
    return this.http.get(
      `${this.http.gatewayModuleUrl('core')}/v2/version/calculation-node/get`
    );
  }


  getSSOLink(): Observable<string> {
    const options = {
      headers: new HttpHeaders().set( 'Content-Type', 'application/json'),
      responseType: 'text'
    };
    return this.http.get(`${this.http.gatewayModuleUrl('core')}/v2/resource`, options);
  }

  login(token: string): Observable<TokenResponse> {
    const options = {
      headers: new HttpHeaders().append('Authorization', 'Bearer ' + token)
    };
    return this.httpClient.get(
      `${this.http.gatewayModuleUrl('core')}/v2/token/collect`,
      options
    ) as Observable<TokenResponse>;
  }

  validate(token: string): Observable<TokenResponse> {
    const options = {
      headers: new HttpHeaders().append('Authorization', 'Bearer ' + token)
    };
    return this.httpClient.get(
      `${this.http.gatewayModuleUrl('core')}/v2/token/validate`,
      options
    ) as Observable<TokenResponse>;
  }

  userInfo(token: string): Observable<UserInfoResponse> {
    const options = {
      headers: new HttpHeaders().append('Authorization', 'Bearer ' + token)
    };
    return this.httpClient.get(
      `${this.http.gatewayModuleUrl('core')}/v2/user/info`,
      options
    ) as Observable<UserInfoResponse>;
  }

  readonly decodeAccessToken = (accessToken: string) => {
    let decodedToken: AdUserModel = this.parseJwt(accessToken) as AdUserModel;

    if (Object.keys(decodedToken).length > 0) {
      decodedToken = {
        ...decodedToken,
        permissions: decodedToken?.permissions.map( item => typeof item === 'string' ? JSON.parse(item) : item)
      };
    }

    return decodedToken;
  }

  private readonly parseJwt = (token: string) =>  {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  async redirectGuest() {
    const sideMenuSettings = this.getSideMenuSettings();
    const sideMenu = sideMenuSettings.filter(el => Array.isArray(el?.ngxPermissionsOnly) && el.ngxPermissionsOnly.includes(PLATFORM_GUEST));

    for (const menu of sideMenu) {
      if (menu.globalScope && menu.isModule) {
        if (!Array.isArray(menu?.subMenu)) {
          console.warn('Redirecting GUEST skipped menu without valid subMenu array:', menu);
          continue;
        }

        for (const subMenuEl of menu.subMenu) {
          if (Array.isArray(subMenuEl?.ngxPermissionsOnly) && subMenuEl.ngxPermissionsOnly.includes(PLATFORM_GUEST)) {
            const rawUrl = subMenuEl?.url;
            if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
              console.error('Redirecting GUEST found invalid submenu url:', rawUrl, subMenuEl);
              continue;
            }

            const targetUrl = `${SharedConstants.appUrlSection}global${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
            return this.router.navigate([targetUrl]);
          }
        }
      }
    }

    console.error('Redirect GUEST is not implemented for current menu configuration.');
    return new Error('Redirect GUEST is not implemennted yet.');
  }

  private getSideMenuSettings(): any[] {
    const rawMainMenu = localStorage.getItem('mainMenu');
    if (!rawMainMenu) {
      console.warn('mainMenu is missing in localStorage while trying to redirect GUEST user.');
      return [];
    }

    try {
      const parsedMainMenu = JSON.parse(rawMainMenu);
      if (!Array.isArray(parsedMainMenu)) {
        console.warn('mainMenu is not an array. Redirect GUEST cannot resolve side menu.', parsedMainMenu);
        return [];
      }
      return parsedMainMenu;
    } catch (error) {
      console.error('Failed to parse mainMenu from localStorage.', error);
      return [];
    }
  }

  logout(): Observable<string> {
    return this.http.get(`${this.http.gatewayModuleUrl('core')}/v2/sign-out`);
  }

  getBeVersions() {
    this.beVersions.next({});
    uiStore.setLoading('getBEVersions');
    lastValueFrom(this.getBEVersionsCall())
      .then(res => {
        this.beVersions.next(res);
      })
      .finally(() => {
        uiStore.removeLoading('getBEVersions');
      });
  }

  getRVersions() {
    this.rVersions.next([]);
    uiStore.setLoading('getRVersions');
    lastValueFrom(this.getRVersionPackageCall())
      .then(res => {
        this.rVersions.next(res);
      })
      .finally(() => {
        uiStore.removeLoading('getRVersions');
      });
  }

  triggerChangeSite(selectedSite: { Id: number; Name: string; TimeZone: string;}) {
    const siteTimeZone = typeof selectedSite?.TimeZone === 'string' ? selectedSite.TimeZone.trim() : '';
    const utcOffset = siteTimeZone && momentTZ.tz.zone(siteTimeZone)
      ? momentTZ.tz(siteTimeZone).utcOffset() / 60
      : 0;

    const uiStateRaw = localStorage.getItem('ui');
    const uiState = uiStateRaw ? JSON.parse(uiStateRaw) : {};
    localStorage.setItem('ui', JSON.stringify({
      ...uiState,
      siteContext: selectedSite.Id,
      siteTimeZoneName: siteTimeZone,
      siteUTCOffset: utcOffset,
      siteShortName: selectedSite.Name
    }));
    uiStore.setCurrentSite({
      id: selectedSite.Id,
      name: selectedSite.Name,
      timeZone: siteTimeZone,
      utcOffset
    });
  }

  redirectAfterLogin(): void {
    const noSites = userStore.getState().sites.length === 0;
    const siteContext = uiStore.getState().site.id;
    const effectiveSiteContext = noSites ? 0 : siteContext;
    this.dcPermissionsService.initPermissions(effectiveSiteContext);

    const permissionsObj = this.permissionsService.getPermissions();
    const permissions = Object.keys(permissionsObj);
    // Check if there is a redirectTo url saved
    const redirectUrl = uiStore.getState().redirectTo || '';
    uiStore.setRedirectTo('');

    // If no sites available and user is GLOBAL ADMIN redirect to Administration
    if (noSites && permissions.some(el => el === PLATFORM_ADMIN)) {
      this.router.navigate([SharedConstants.appUrlSection + 0 + '/administration']);
      return;
    }

    if (noSites && permissions.some(el => el === PLATFORM_GUEST)) {
      this.redirectGuest();
      return;
    }

    if (this.triggerSpecialRedirects(siteContext, permissions)) {
      return;
    }

    if (!redirectUrl) {
      this.router.navigate([SharedConstants.appUrlSection + siteContext + SharedConstants.homeUrlSection]);
      return;
    }

    // If Redirect URL include '/app/' then this is URL with siteContext in it
    if (
      redirectUrl.includes(SharedConstants.appUrlSection)
      && !redirectUrl.includes(`/${siteContext.toString()}/`)
      && !redirectUrl.includes(SharedConstants.globalUrl)
    ) {
      const redirectSite = this.getRedirectSiteContext(redirectUrl);
      const site = userStore.getState().sites.find(el => el.SiteId === redirectSite);
      if (site) {
        this.triggerChangeSite({...site, Id: site.SiteId});
        this.router.navigate([redirectUrl.split('?')[0]], { queryParams: this.sortParams(redirectUrl)});
        return;
      }
      this.router.navigate([SharedConstants.appUrlSection + siteContext + SharedConstants.homeUrlSection]);
      return;
    }

    uiStore.setRedirectTo('');
    this.router.navigate([redirectUrl.split('?')[0]], { queryParams: this.sortParams(redirectUrl)});
  }

  private getRedirectSiteContext(redirectUrl: string) {
    return parseInt(redirectUrl.split('/')[2]);
  }

  private sortParams(url) {
    const queryParams = url.split('?')[1] || '';
    const params = queryParams.split('&');
    let pair = null;
    const data = {};
    params.forEach((d) => {
      pair = d.split('=');
      data[`${pair[0]}`] = pair[1];
    });
    return data;
  }

  private triggerSpecialRedirects(siteContext: number, permissions: string[]) {
    if (permissions.length === 1 && permissions[0] === 'VIEWER') {
      this.router.navigate([SharedConstants.appUrlSection + siteContext + '/continuous-data-monitoring']);
      return true;
    } else if (permissions.length === 1 && permissions[0] === PLATFORM_ADMIN) {
      this.router.navigate([SharedConstants.appUrlSection + siteContext + '/administration']);
      return true;
    } else if (permissions.length === 1 && permissions[0] === PLATFORM_GUEST) {
      this.redirectGuest();
      return true;
    }
    return false;
  }
}
