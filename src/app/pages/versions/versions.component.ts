import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {lastValueFrom, Subscription} from 'rxjs';

import {LoginAppService, RVersion} from "../login-app.service";
import {uiStore} from "@open-dcp/services";

@Component({
  selector: 'app-digital-clone-fe-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.scss']
})
export class VersionsComponent implements OnInit, OnDestroy {

  subscription: Subscription = new Subscription();

  rVersions: RVersion[] = [];

  BEVersions: any = [];

  currentVersions: {
    [key: string]: string;
  } = {};

  currentModules = Object.keys(this.currentVersions);

  constructor(
    public readonly translate: TranslateService,
    private readonly versionsService: LoginAppService
  ) { }

  ngOnInit(): void {
    this.synchronizeWithStore();
    this.getFeVersions();

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private getFeVersions() {
    uiStore.setLoading('getFEVersions');
    lastValueFrom(this.versionsService.getFEVersions())
      .then(res => {
        this.currentVersions = res;
        this.currentModules = Object.keys({...this.currentVersions}).sort((a, b) => {
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        });
      })
      .finally(() => {
        uiStore.removeLoading('getFEVersions');
      });
  }

  synchronizeWithStore() {
    this.subscription.add(
      this.versionsService.rVersions.asObservable().subscribe( rVersion => {
        this.rVersions = rVersion;
      })
    );

    this.subscription.add(
      this.versionsService.beVersions.asObservable().subscribe( BEVersions => {
        this.BEVersions = Object.keys(BEVersions).map( key => {
          return {
            Name: key,
            Version: BEVersions[key]
          };
        }).sort((a, b) => {
          if (a.Name < b.Name) {
            return -1;
          }
          if (a.Name > b.Name) {
            return 1;
          }
          return 0;
        });
      })
    );
  }
}
