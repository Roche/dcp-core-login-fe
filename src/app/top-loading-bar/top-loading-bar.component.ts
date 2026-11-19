import {Component, OnDestroy, OnInit} from '@angular/core';
import {uiStore} from "@open-dcp/services";
import {BehaviorSubject, Subscription} from "rxjs";
import {MatProgressBar} from "@angular/material/progress-bar";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'app-top-loading-bar',
  standalone: true,
  templateUrl: './top-loading-bar.component.html',
  imports: [
    MatProgressBar,
    AsyncPipe
  ],
  styleUrls: ['./top-loading-bar.component.scss']
})
export class TopLoadingBarComponent implements OnInit, OnDestroy {

  loading = new BehaviorSubject<boolean>(false);

  subscription = new Subscription();

  ngOnInit() {
    this.subscribeToLoading();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private subscribeToLoading() {
    this.subscription.add(
      uiStore.subscribe('loading', loading => {
        const result = Object.keys(loading).length > 0;
        this.loading.next(result)
      })
    );
  }
}
