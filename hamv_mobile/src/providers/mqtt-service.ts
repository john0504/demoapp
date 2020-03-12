import { Injectable } from '@angular/core';
import { AppEngine } from 'app-engine';
import {
  AlertOptions,
  AlertController,
  Toast,
} from 'ionic-angular';
import {
  connect,
  IClientOptions,
  MqttClient
} from 'mqtt';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../providers/popup-service';
import { TranslateService } from '@ngx-translate/core';
import { FCM } from '@ionic-native/fcm';
import { AppVersion } from '@ionic-native/app-version';

const USER_LIST = 'userList';
const CLIENT_ID = 'clientId';
const ACTIVE_USER_TOKEN = 'activeUserToken';

@Injectable()
export class MqttService {

  private accountToken = "";
  private _userList = [];
  private _deviceListDate = 0;
  private _deviceList = [];
  private client: MqttClient;
  private noNetworkToast: Toast;
  private topicC = "";
  private topicD = "";
  private topicG = "";
  private topicM = "";
  private topicVersion = "WAWA2/AppVersion";
  private _timestamp = 0;
  private needLogout = false;
  private isPaused: number = 0;
  private isChange = false;
  private opts: IClientOptions = {
    port: 9001,
    host: this.appEngine.getBaseUrl(),
    clientId: 'CECTCO-ionic',
    // protocol: 'mqtt',
    protocol: 'mqtts',
    username: 'ZWN0Y28uY29tMCAXDTE5MDcxODAzMzUyMVoYDzIxMTkwNjI0MDMzNTIxWjBlMQsw',
    password: 'CQYDVQQGEwJUVzEPMA0GA1UECAwGVGFpd2FuMRAwDgYDVQQHDAdIc2luY2h1MQ8w',
    key: "",
    cert: "",
    ca: "",
    rejectUnauthorized: false,
  };

  constructor(
    private popupService: PopupService,
    private appEngine: AppEngine,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private storage: Storage,
    private translate: TranslateService,
    private fcm: FCM,
    public appVersion: AppVersion,
  ) {
    this.fcm.subscribeToTopic('marketing');
    this.http.get('./assets/ca/ca_bundle.crt', { responseType: "text" })
      .subscribe(cafile => this.opts.ca = cafile);
    // this.http.get('./assets/ca/ca.crt', { responseType: "text" })
    //   .subscribe(cafile => this.opts.ca = cafile);
    // this.http.get('./assets/ca/client.crt', { responseType: "text" })
    //   .subscribe(certfile => this.opts.cert = certfile);
    // this.http.get('./assets/ca/client.key', { responseType: "text" })
    //   .subscribe(keyfile => this.opts.key = keyfile);
  }

  public setUserToken(token) {
    this.accountToken = token;
    // if (this.accountToken.length != 0) {
    //   this.fcm.subscribeToTopic(this.accountToken);
    // }
  }

  public create() {
    if (this.accountToken.length != 0) {
      this.loadUserList();
    } else {
      this.unsubscribeAllService();
    }
  }

  public pause() {
    this.isPaused++;
    this.destroy();
  }

  public resume() {
    const next = this.isPaused - 1;
    this.isPaused = next >= 0 ? next : 0;
    this.create();
  }

  private loadUserList() {
    this.storage.get(USER_LIST)
      .then(userList => {
        this._userList = userList ? userList : [];
        var tokenFound = false;
        this._userList.forEach(user => {
          if (user.token == this.accountToken) {
            this._deviceListDate = user.date;
            this._deviceList = user.list; 
            tokenFound = true;
            this.isChange = true;
          }
        });
        if (tokenFound == false) {
          this._deviceListDate = 0;
          this._userList.push({
            token: this.accountToken,
            list: this._deviceList,
            date: this._deviceListDate
          });
          this.storage.set(USER_LIST, this._userList);
        }
        this.storage.set(ACTIVE_USER_TOKEN, this.accountToken);
        this.connectMqtt();
      });
  }

  private connectMqtt() {
    if (!this.client) {
      var timestamp = Date.now();
      this.storage.get(CLIENT_ID)
        .then(clientId => {
          if (clientId) {
            this.opts.clientId = clientId;
          } else {
            this.opts.clientId = `CECTCO-ionic-${Math.random().toString(16).substr(2, 8)}-${timestamp}`;
            this.storage.set(CLIENT_ID, this.opts.clientId);
          }
          this.opts.host = this.appEngine.getBaseUrl();
          this.client = connect('', this.opts);
          this.toggleToast(true);

          this.client.on('connect', () => {
            this.subscribeTopic();
            this.toggleToast(false);
          });

          this.client.on('offline', () => {
            this.toggleToast(true);
          });

          this.client.on('message', (topic, message) => {
            this.getMessage(topic, message);
          });

          this.client.on('error', (err) => {
            console.log("Log Here - " + JSON.stringify(err));
          });
        });
    } else {
      this.subscribeTopic();
    }
  }

  public publish(topic, paylod, opts) {
    if (this.client) {
      this.client.publish(topic, paylod, opts);
    }
  }

  private subscribeTopic() {
    // 檢查App版本
    this.client.subscribe(this.topicVersion, { qos: 1 });
    this.topicD = `WAWA/${this.accountToken}/D`;
    this.client.subscribe(this.topicD, { qos: 1 });
    // 更新裝置列表
    var topic = `WAWA/${this.accountToken}/U`;
    var paylod = JSON.stringify({ action: "list" });
    this.client.publish(topic, paylod, { qos: 1, retain: false });

    // 將重複登入者剔除機制
    this.topicC = `WAWA/${this.accountToken}/C`;
    this.client.subscribe(this.topicC, { qos: 1 });
    this._timestamp = Date.now();
    var paylodC = { time: this._timestamp };
    this.client.publish(this.topicC, JSON.stringify(paylodC), { qos: 1, retain: false });

    // 收取最後3筆禮品出獎時間記錄
    this.topicG = `WAWA/${this.accountToken}/G`;
    this.client.subscribe(this.topicG, { qos: 1 });

    // 收取伺服器訊息
    this.topicM = `WAWA/${this.accountToken}/M`;
    this.client.subscribe(this.topicM, { qos: 1 });
  }

  private getMessage(topic, message) {
    if (topic == this.topicVersion) {
      var versionStr = message.toString();
      this.appVersion.getVersionNumber()
        .then(appVer => {
          if (appVer != versionStr) {
            let options: AlertOptions = {
              title: "App版本更新通知",
              message: "請立即更新App版本",
              buttons: ["確定"],
            };
            const alert = this.alertCtrl.create(options);
            alert.present();
          }
        })
        .catch(() => {
          console.log("Get AppVersion error!");
        });

    } else if (topic == this.topicC) {
      var obj = JSON.parse(message.toString());
      if (obj && obj.time && this.accountToken != "0005") {
        if (obj.time > this._timestamp) {
          this.unsubscribeAllService();
          this.needLogout = true;
        }
      }
    } else if (topic == this.topicD) {
      obj = JSON.parse(message.toString());
      console.log("topic: " + topic + " & message: " + message.toString());
      if (obj && obj.data) {
        var newDeviceList = this._deviceList;
        this._deviceList.forEach(device => {
          // FCM unsubscribe
          this.FcmService(`${device.DevNo}-Money`, false);
          this.FcmService(`${device.DevNo}-Gift`, false);
        });
        this._deviceList = [];
        obj.data.forEach(data => {
          data.topicC = `WAWA/${data.D}/C`;
          data.topicU = `WAWA/${data.D}/U`;
          data.topicS = `WAWA/${data.D}/S`;
          data.DevNo = data.D;
          data.ExpireDate = data.E;
          data.UpdateDate = data.U;
          data.ExpireTime = this.getDate(data.E);
          if (Date.now() / 1000 <= data.E) {
            this.client.subscribe(data.topicU, { qos: 1 });
          }
          this.client.subscribe(data.topicC, { qos: 1 });
          this.client.subscribe(data.topicS, { qos: 1 });
          newDeviceList.forEach(device => {
            if (device.DevNo == data.D) {
              data = Object.assign(device, data);
              // FCM subscribe
              if (device.isMoneyFcm) {
                this.FcmService(`${device.DevNo}-Money`, true);
              }
              if (device.isGiftFcm) {
                this.FcmService(`${device.DevNo}-Gift`, true);
              }
            }
          });
          if (data.isGiftFcm == null) {
            data.isGiftFcm = true;
            this.FcmService(`${data.DevNo}-Gift`, true);
          }
          this._deviceList.push(data);
        });
        this.saveUserList();
        this.isChange = true;
      }
    } else if (topic == this.topicG) {
      obj = JSON.parse(message.toString());
      var timeList = obj.T;
      var moneyList = obj.M;
      var alertMessage = "查無紀錄";
      var count = 0;
      timeList.forEach(time => {
        count++;
        if (count == 1) {
          alertMessage = `<table border="1"><tr><td align="center"></td><td align="center">出貨時間</td><td align="center">累保金額</td></tr>`;
          alertMessage += `<tr><td align="center">${count}</td><td>${this.getShortTime(time)}</td><td align="right">${moneyList[count - 1] * 10}</td></tr>`;
        } else {
          alertMessage += `<tr><td align="center">${count}</td><td>${this.getShortTime(time)}</td><td align="right">${moneyList[count - 1] * 10}</td></tr>`;
        }
      });
      if (timeList.length != 0) {
        alertMessage += `</table>`;
      }
      let options: AlertOptions = {
        title: "禮品近期出獎記錄查詢",
        message: alertMessage,
        buttons: ["確定"],
      };
      const alert = this.alertCtrl.create(options);
      alert.present();
    } else if (topic == this.topicM) {
      alertMessage = message.toString();
      let options: AlertOptions = {
        title: "系統提示",
        subTitle: alertMessage,
        buttons: ["確定"],
      };
      const alert = this.alertCtrl.create(options);
      alert.present();
    } else {
      // device topic
      for (var i = 0; i < this._deviceList.length; i++) {
        if (topic == this._deviceList[i].topicC) {
          if (message != "") {
            obj = JSON.parse(message.toString());
            Object.assign(this._deviceList[i], obj);
            console.log("topic: " + topic + " & message:" + message.toString());
            this.saveUserList();
            this.isChange = true;
          }
        } else if (topic == this._deviceList[i].topicU) {
          var arrayBuffer: ArrayBuffer = new ArrayBuffer(message.length);
          var view = new Uint8Array(arrayBuffer);
          for (var j = 0; j < message.length; j++) {
            view[j] = message[j];
          }
          var dataView = new DataView(arrayBuffer);
          obj = {};
          var timestamp = dataView.getUint32(0);
          for (j = 4; j < message.length; j += 3) {
            var service = dataView.getUint8(j);
            var value = dataView.getUint16(j + 1);
            obj["H" + service.toString(16).toUpperCase()] = value;
          }
          Object.assign(this._deviceList[i], obj);
          if (this._deviceList[i].UpdateDate < timestamp) {
            this._deviceList[i].UpdateDate = timestamp;
          }
          this._deviceList[i].UpdateTimestamp = timestamp;
          console.log("topic: " + topic + " & timestamp:" + timestamp);
          this.saveUserList();
          this.isChange = true;
        } else if (topic == this._deviceList[i].topicS) {
          timestamp = parseInt((Date.now() / 1000).toString(), 10);
          this._deviceList[i].UpdateDate = timestamp;
          console.log("topic: " + topic + " & timestamp:" + timestamp);
          this.saveUserList();
        }
      }
    }
  }

  public getAccountToken() {
    return this.accountToken;
  }

  public isListChange(): boolean {
    var status = this.isChange;
    this.isChange = false;
    return status;
  }

  public getDeviceList() {
    return this._deviceList;
  }

  public canLogout() {
    if (this.needLogout) {
      this.needLogout = false;
      this.logoutService();
      return true;
    }
    return false;
  }

  public logoutService() {
    this._deviceList.forEach(device => {
      this.FcmService(`${device.DevNo}-Money`, false);
      this.FcmService(`${device.DevNo}-Gift`, false);
    });
    // this.fcm.unsubscribeFromTopic(this.accountToken);
  }

  public FcmService(topic, isSubscribe) {
    if (isSubscribe) {
      this.fcm.subscribeToTopic(`${this.accountToken}-${topic}`);
    } else {
      this.fcm.unsubscribeFromTopic(`${this.accountToken}-${topic}`);
    }
  }

  public saveUserList() {
    var timestamp = Date.now() / 1000;
    this._deviceListDate = parseInt(timestamp.toString(), 10);
    var saveList = JSON.parse(JSON.stringify(this._deviceList));
    saveList.forEach(device => {
      device.testLock = false;
      device.stopUpdate = false;
    });
    this._userList.forEach(user => {
      if (user.token == this.accountToken) {
        user.date = this._deviceListDate;
        user.list = saveList;
      }
    });
    this.storage.set(USER_LIST, this._userList);
  }

  private toggleToast(show: boolean) {
    if (show && !this.noNetworkToast && this.isPaused === 0) {
      const notFoundMsg = this.translate.instant('CHECK_NETWORKS.NOT_FOUND');
      this.noNetworkToast = this.popupService.makeToast({
        message: notFoundMsg,
        position: 'top',
        showCloseButton: true,
        closeButtonText: 'X',
      });
    } else if (!show && this.noNetworkToast) {
      this.noNetworkToast.dismiss();
      this.noNetworkToast = null;
    }
  }

  public getDate(timestamp) {
    var date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
    return `${date.getFullYear()}-${month}-${day}`;
  }

  public getTime(timestamp) {
    var date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
    const hour = date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`;
    const minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`;
    const second = date.getSeconds() < 10 ? `0${date.getSeconds()}` : `${date.getSeconds()}`;

    return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  public getShortTime(timestamp) {
    var date = new Date(timestamp * 1000);
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
    const hour = date.getHours() < 10 ? `0${date.getHours()}` : `${date.getHours()}`;
    const minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : `${date.getMinutes()}`;
    const second = date.getSeconds() < 10 ? `0${date.getSeconds()}` : `${date.getSeconds()}`;

    return `${month}/${day} ${hour}:${minute}:${second}`;
  }

  private unsubscribeAllService() {
    if (this.client) {
      this.client.unsubscribe(this.topicC);
      this.client.unsubscribe(this.topicD);
      this.client.unsubscribe(this.topicG);
      this.client.unsubscribe(this.topicM);
      this._deviceList.forEach(device => {
        this.client.unsubscribe(device.topicC);
        this.client.unsubscribe(device.topicU);
        this.client.unsubscribe(device.topicS);
      });
    }
  }

  public destroy() {
    if (this.client) {
      this.unsubscribeAllService();
      this.client.end();
      this.client = null;
    }
    this._deviceList = [];
    this.toggleToast(false);
  }
}
