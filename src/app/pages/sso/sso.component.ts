import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, lastValueFrom, Subscription} from 'rxjs';
import {LoginAppService} from '../login-app.service';
import {uiStore, userStore} from '@open-dcp/services';
import {
  AdUserModel,
  TokenResponse,
  UserInfoResponse,
  UserSettingsModel
} from '../../shared/user.model';

@Component({
  selector: 'app-sso',
  templateUrl: './sso.component.html',
  styleUrls: ['./sso.component.scss']
})
export class SsoComponent implements OnInit, OnDestroy {

  public subscription: Subscription = new Subscription();

  noGuid = false;
  tokenExchanged = new BehaviorSubject(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loginAppService: LoginAppService,
    private readonly ngZone: NgZone
  ) { }

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParams.token;
    if (accessToken === 'notauthorized') {
      this.noGuid = true;
    } else {
      this.login(accessToken);

      this.subscription.add(
        userStore.subscribe('token', token => {
          this.ngZone.run(() => {
            if (!token || !this.tokenExchanged.getValue()) {
              return;
            }

            setTimeout(() => {
              this.loginAppService.redirectAfterLogin();
            }, 200);
          });
        })
      );
    }

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  goToLogin(): void {
    this.clearSessionSiteArtifacts();
    uiStore.setLoading('logout');
    lastValueFrom(this.loginAppService.logout())
      .then(res => {
        if (res) {
          window.location.href = res;
        }
      })
      .catch(() => {
        this.router.navigate(['/login']);
      })
      .finally(() => {
        uiStore.removeLoading('logout');
      });
  }

  private login(accessToken: string) {
    if (!accessToken) {
      this.goToLogin();
      return;
    }
    uiStore.setLoading('Login');
    lastValueFrom(this.loginAppService.login(accessToken))
      .then(async token => {
        const userInfo = await this.getUserInfo(token.access_token);
        if (!userInfo) {
          return;
        }
        const user: AdUserModel = {
          ...this.convertUserInfo(token, userInfo as UserInfoResponse)
        };

        const loggedUserData: AdUserModel = {
          ...user,
          ...{...this.loginAppService.decodeAccessToken(user?.access_token)}
        };

        this.tokenExchanged.next(true);

        userStore.setSetting('dateFormat', user.dateFormat);
        userStore.setSetting('timeFormat', user.timeFormat);
        const localStorageUser: {current: AdUserModel, settings: UserSettingsModel, isAuthenticated: boolean} = {
          current: {
            ...loggedUserData
          },
          // Persist the user settings alongside `current`. The userStore rehydrates
          // these from `user.settings` (camelCase) on load, so they must be written
          // here; otherwise this setItem would overwrite the values previously stored
          // by the setSetting calls above and the settings dialog would stay empty.
          settings: {
            dateFormat: user.dateFormat,
            timeFormat: user.timeFormat,
          },
          isAuthenticated: true,
        };
        localStorage.setItem('user', JSON.stringify(localStorageUser));
      })
      .catch(error => {
        this.goToLogin();
        uiStore.setMessage('error', error.error.error_description);
      })
      .finally(() => {
        uiStore.removeLoading('Login');
      });
  }

  private async getUserInfo(token: string) {
    return new Promise(resolve => {
      uiStore.setLoading('getUserInfo');
      lastValueFrom(this.loginAppService.userInfo(token))
        .then(res => {
          this.setSelectedSite(res);
          resolve(res);
        })
        .catch(() => {
          resolve(false);
          this.goToLogin();
        })
        .finally(() => {
          uiStore.removeLoading('getUserInfo');
        });
    });
  }

  private convertUserInfo(token: TokenResponse, userInfo: UserInfoResponse): AdUserModel {
    const decodedToken = this.loginAppService.decodeAccessToken(token.access_token);

    return {
      ...token,
      uid: userInfo.UnixId,
      userName: userInfo.DisplayName,
      displayName: userInfo.DisplayName,
      sites: userInfo.Sites.map(el => ({
        Name: el.Name,
        SiteId: el.Id,
        TimeZone: el.TimeZone,
        IsEnable: el.IsEnabled
      })),
      permissions: decodedToken.permissions,
      dateFormat: userInfo.Settings.DateFormat,
      timeFormat: userInfo.Settings.TimeFormat,
      isGlobalApiUser: decodedToken.isGlobalAdmin,
      isGlobalAdmin: decodedToken.isGlobalApiUser,
      currentLoggedUserId: decodedToken.currentLoggedUserId,
      userId: decodedToken.userId,
    };
  }

  private setSelectedSite(res: UserInfoResponse) {
    if (res.Sites.length === 0) {
      this.loginAppService.triggerChangeSite({Id: 0, Name: '', TimeZone: ''});
      return;
    }

    const siteId = res.LastSessionSiteId;

    const selectedSite = res.Sites.find((el) => el.Id === siteId) || res.Sites[0];

    if (selectedSite) {
      this.loginAppService.triggerChangeSite(selectedSite);
    }
  }

  private clearSessionSiteArtifacts() {
    localStorage.removeItem('mainMenu');
    sessionStorage.removeItem('permissionsGridList');
  }
}
