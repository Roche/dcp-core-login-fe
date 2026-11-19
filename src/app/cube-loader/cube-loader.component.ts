import {Component} from '@angular/core';
import {AnimationOptions, LottieComponent} from "ngx-lottie";
import {assetUrl} from "../../single-spa/asset-url";

@Component({
  selector: 'app-cube-loader',
  standalone: true,
  templateUrl: './cube-loader.component.html',
  imports: [
    LottieComponent
  ]
})
export class CubeLoaderComponent {
  options: AnimationOptions = {
    path: assetUrl('images/lf20_u6sacwn6.json'),
  };

  changeSpeed($event: import("lottie-web").AnimationItem) {
    $event.setSpeed(3);
  }
}
