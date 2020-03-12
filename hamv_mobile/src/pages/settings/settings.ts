import { Component } from '@angular/core';
import { AppTasks } from 'app-engine';
import {
  IonicPage,
  NavController,
} from 'ionic-angular';

import { appConfig } from '../../app/app.config';
import { ViewStateService } from '../../providers/view-state-service';
import { MqttService } from '../../providers/mqtt-service';
import { Storage } from '@ionic/storage';

const USER_SETTING = 'userSetting';

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  appConfig;
  userSetting = { isGiftSound: true, isGiftVibration: true };

  constructor(
    private appTasks: AppTasks,
    public navCtrl: NavController,
    public viewStateService: ViewStateService,
    private storage: Storage,
    public mqttService: MqttService,
  ) {
    this.appConfig = appConfig;
    this.storage.get(USER_SETTING)
      .then(userSetting => {
        this.userSetting = userSetting ? userSetting : { isGiftSound: true, isGiftVibration: true };
      });
  }

  private goHomePage() {
    this.navCtrl.setRoot('HomePage');
  }

  goAmazonEchoPage() {
    this.navCtrl.push('AmazonEchoPage');
  }

  goIftttPage() {
    this.navCtrl.push('IftttPage');
  }

  goGoogleHomePage() {
    this.navCtrl.push('GoogleHomePage');
  }

  goMyAccountPage() {
    this.navCtrl.push('MyAccountPage');
  }

  setSetting() {
    this.storage.set(USER_SETTING, this.userSetting);
  }

  logout() {
    this.appTasks.logoutTask()
      .then(() => {
        this.viewStateService.clearAll();
        this.mqttService.logoutService();
        this.goHomePage();
      });
  }
}
