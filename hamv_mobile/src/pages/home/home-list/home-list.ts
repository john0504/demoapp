import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  Platform,
  AlertOptions,
  AlertController,
} from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import {
  StateStore,
  AppTasks,
} from 'app-engine';

import { ThemeService } from '../../../providers/theme-service';
import { HomePageBase } from '../home-page-base';
import { ListGroupItemComponent } from "../../../components/list-group-item/list-group-item";
import { LargeListItemComponent } from '../../../components/large-list-item/large-list-item';
import { MqttService } from '../../../providers/mqtt-service';
import { PopupService } from '../../../providers/popup-service';
import { NativeAudio } from '@ionic-native/native-audio';
import { Vibration } from '@ionic-native/vibration';

@IonicPage()
@Component({
  selector: 'page-home-list',
  templateUrl: 'home-list.html'
})
export class HomeListPage extends HomePageBase {

  constructor(
    navCtrl: NavController,
    public navCtrl2: NavController,
    platform: Platform,
    stateStore: StateStore,
    translate: TranslateService,
    public translate2: TranslateService,
    public appTasks: AppTasks,
    storage: Storage,
    themeService: ThemeService,
    public alertCtrl: AlertController,
    public stateStore2: StateStore,
    public mqttService: MqttService,
    public nativeAudio: NativeAudio,
    public popupService: PopupService,
    public vibration: Vibration
  ) {
    super(
      navCtrl,
      platform,
      stateStore,
      translate,
      storage,
      themeService,
      appTasks,
      alertCtrl,
      mqttService,
      nativeAudio,
      popupService,
      vibration
    );

    this.deviceComponent = LargeListItemComponent;
    this.groupComponent = ListGroupItemComponent;
  }

  deleteDeviceConfirm(deviceItem) {
    const alertTitle = this.translate2.instant('DEVICE_SETTINGS.DELETE_ALERT_TITLE', { deviceName: deviceItem.DevName });
    const alertCancel = this.translate2.instant('DEVICE_SETTINGS.CANCEL');
    const alertDelete = this.translate2.instant('DEVICE_SETTINGS.DELETE');

    let options: AlertOptions = {
      title: alertTitle,
      buttons: [
        {
          text: alertCancel,
          role: 'cancel',
        },
        {
          text: alertDelete,
          handler: () => {

            let options: AlertOptions = {
              subTitle: "測試App無法刪除裝置",
              buttons: ["確定"],
            };

            const alert = this.alertCtrl.create(options);
            alert.present();
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  toggleDetails(deviceItem) {
    if (deviceItem.showDetails) {
      deviceItem.showDetails = false;
    } else {
      deviceItem.showDetails = true;
      deviceItem.showTestDetails = false;
    }
    this.mqttService.saveUserList();
  }

  toggleTestDetails(deviceItem) {
    if (deviceItem.showTestDetails) {
      deviceItem.showTestDetails = false;
    } else {
      deviceItem.showTestDetails = true;
      deviceItem.showDetails = false;
    }
    this.mqttService.saveUserList();
  }

  clearConfirm(name, deviceItem, callback) {
    const alertTitle = this.translate2.instant(name);
    const alertSubTitle = this.translate2.instant('確定要清除嗎?');
    const alertCancel = this.translate2.instant('DEVICE_SETTINGS.CANCEL');
    const alertDelete = this.translate2.instant('DEVICE_SETTINGS.OK');

    let options: AlertOptions = {
      title: alertTitle,
      subTitle: alertSubTitle,
      buttons: [
        {
          text: alertCancel,
          role: 'cancel',
        },
        {
          text: alertDelete,
          handler: () => {
            callback(deviceItem);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  setMoneyFcm(deviceItem) {
    this.mqttService.FcmService(`${deviceItem.DevNo}-Money`, deviceItem.isMoneyFcm);
    this.mqttService.saveUserList();
  }

  setGiftFcm(deviceItem) {
    this.mqttService.FcmService(`${deviceItem.DevNo}-Gift`, deviceItem.isGiftFcm);
    this.mqttService.saveUserList();
  }

  clearBank() {
    let options: AlertOptions = {
      subTitle: "巡檢正常已傳送",
      buttons: ["確定"],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  clearMoney(deviceItem) {    
    deviceItem.H61 = "2020-03-11 09:29:59";
    deviceItem.H62 = "2020-03-11 09:29:59";
    deviceItem.H63 = "0311_0929";
    var alertMessage = `<table border="1"><tr><td align="center">測試集名稱</td><td align="center">${deviceItem.DevName} ${deviceItem.H63}</td></tr>` +
      `<tr><td align="center">偵測異常比例</td><td align="center">10.047%</td></tr>` +
      `<tr><td align="center">異常偵測警告預設值</td><td align="center">65%</td></tr>` +
      `<tr><td align="center">上傳時間</td><td align="center">${deviceItem.H62}</td></tr></table><img src="assets/img/test1.jpg">`;

    let options: AlertOptions = {
      title: '即時檢測結果',
      message: alertMessage,
      buttons: ["確定"],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  clearGift(deviceItem) {
    this.clearConfirm("禮品出獎次數", deviceItem, () => {
      deviceItem.H62 = 0;
      var message = {
        H62: 0
      };
      this.sendData(deviceItem, message);
    });
  }

  getGiftTimeList(deviceItem) {
    var alertMessage = `<table border="1"><tr><td align="center">測試集名稱</td><td align="center">${deviceItem.DevName} ${deviceItem.H63}</td></tr>` +
      `<tr><td align="center">偵測異常比例</td><td align="center">10.047%</td></tr>` +
      `<tr><td align="center">異常偵測警告預設值</td><td align="center">65%</td></tr>` +
      `<tr><td align="center">上傳時間</td><td align="center">${deviceItem.H62}</td></tr></table><img src="assets/img/test2.jpg">`;

    let options: AlertOptions = {
      title: '前次檢測結果',
      message: alertMessage,
      buttons: ["確定"],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  sendData(deviceItem, message) {
    var topic = `WAWA/${deviceItem.DevNo}/D`;
    message.CmdTimeStamp = Date.now() / 1000;
    this.mqttService.publish(topic, JSON.stringify(message), { qos: 2, retain: false });
  }

  goPayment(deviceItem) {
    this.navCtrl2.push('DevicePaymentPage', { serial: deviceItem.DevNo });
  }

  getExpire(date) {
    return date - Date.now() / 1000;
  }

  showInfo() {
    let options: AlertOptions = {
      subTitle: "版本資訊",
      buttons: ["確定"],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  returnTest(deviceItem) {
    let options: AlertOptions = {
      title: "提示",
      subTitle: "電眼測試約耗時30秒,是否確認執行?",
      buttons: [
        {
          text: "取消",
          role: 'cancel',
        },
        {
          text: "是",
          handler: () => {
            var message = {
              H64: 0x0001
            };
            if (deviceItem.testLock) {
              return;
            }
            this.sendData(deviceItem, message);
            deviceItem.stopUpdate = true;
            var stopInterval = setInterval(() => {
              clearInterval(stopInterval);
              deviceItem.stopUpdate = false;
            }, 10 * 1000);
            deviceItem.testLock = true;
            var lockInterval = setInterval(() => {
              clearInterval(lockInterval);
              deviceItem.testLock = false;
            }, 30 * 1000);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  addBank(deviceItem, times) {
    let options: AlertOptions = {
      title: "提示",
      subTitle: "投幣測試約耗時" + times * 5 + "秒,是否確認執行?",
      buttons: [
        {
          text: "取消",
          role: 'cancel',
        },
        {
          text: "是",
          handler: () => {
            var cmd = 0x0100 * times + 0x0002;
            var message = {
              H64: cmd
            };
            if (deviceItem.testLock) {
              return;
            }
            this.sendData(deviceItem, message);
            deviceItem.stopUpdate = true;
            var stopInterval = setInterval(() => {
              clearInterval(stopInterval);
              deviceItem.stopUpdate = false;
            }, 10 * 1000);
            deviceItem.testLock = true;
            var lockInterval = setInterval(() => {
              clearInterval(lockInterval);
              deviceItem.testLock = false;
            }, times * 5 * 1000);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  addCoin(deviceItem) {
    let options: AlertOptions = {
      title: "提示",
      subTitle: "贈局約耗時3秒,是否確認執行?",
      buttons: [
        {
          text: "取消",
          role: 'cancel',
        },
        {
          text: "是",
          handler: () => {
            var cmd = 0x0100 + 0x0004;
            var message = {
              H64: cmd
            };
            if (deviceItem.testLock) {
              return;
            }
            this.sendData(deviceItem, message);
            deviceItem.stopUpdate = true;
            var stopInterval = setInterval(() => {
              clearInterval(stopInterval);
              deviceItem.stopUpdate = false;
            }, 10 * 1000);
            deviceItem.testLock = true;
            var lockInterval = setInterval(() => {
              clearInterval(lockInterval);
              deviceItem.testLock = false;
            }, 3 * 1000);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  removeCoin(deviceItem) {
    let options: AlertOptions = {
      title: "提示",
      subTitle: "搖桿測試約耗時5秒,是否確認執行?",
      buttons: [
        {
          text: "取消",
          role: 'cancel',
        },
        {
          text: "是",
          handler: () => {
            var cmd = 0x0100 + 0x0003;
            var message = {
              H64: cmd
            };
            if (deviceItem.testLock) {
              return;
            }
            this.sendData(deviceItem, message);
            deviceItem.stopUpdate = true;
            var stopInterval = setInterval(() => {
              clearInterval(stopInterval);
              deviceItem.stopUpdate = false;
            }, 10 * 1000);
            deviceItem.testLock = true;
            var lockInterval = setInterval(() => {
              clearInterval(lockInterval);
              deviceItem.testLock = false;
            }, 5 * 1000);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }

  reboot(deviceItem) {
    let options: AlertOptions = {
      title: "提示",
      subTitle: "重開機測試約耗時30秒,是否確認執行?",
      buttons: [
        {
          text: "取消",
          role: 'cancel',
        },
        {
          text: "是",
          handler: () => {
            var message = {
              H65: 0x0001
            };
            if (deviceItem.testLock) {
              return;
            }
            this.sendData(deviceItem, message);
            deviceItem.stopUpdate = true;
            var stopInterval = setInterval(() => {
              clearInterval(stopInterval);
              deviceItem.stopUpdate = false;
            }, 10 * 1000);
            deviceItem.testLock = true;
            var lockInterval = setInterval(() => {
              clearInterval(lockInterval);
              deviceItem.testLock = false;
            }, 30 * 1000);
          },
        }
      ],
    };

    const alert = this.alertCtrl.create(options);
    alert.present();
  }
}
