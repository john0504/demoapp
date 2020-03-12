export interface AppConfig {
  appEngine: {
    // solutionId: string,
    // productId: string,
    baseUrl: string,
  };
  // mixpanel: {
  //   token: string,
  // };
  hockeyApp: {
    ids: {
      android: string,
      ios: string,
    }
  };
  app: {
    group: {
      max: number,
      devices: number,
    },
    schedule: {
      max: number,
    },
    support: {
      email: string,
    },
    disableLog?: boolean;
    logConfig: {
      recordLimit?: number,
    }
    theme: {
      primaryColor: string,
      productName: string,
      wifiName: string,
    },
    amazonAlexa: {
      skillName: string,
    },
    ifttt: {
      actionName: string,
    },
    googleHome: {
      ghName: string,
    },
  };
}

export const appConfig: AppConfig = {
  appEngine: {
    // solutionId: 'hamv-tenx',
    // productId: 'g30qvzkqcoki00000',
    baseUrl: 'cectco.homeip.net' // com.cect.wawa // CECE-WAWA
    // baseUrl: 'cectwawa.homeip.net' // com.cect.cectwawa // WAWA-HONGKONG
    // baseUrl: '192.168.1.13' // com.smarthome.aliyun // WAWA-LOCAL
  },
  // mixpanel: {
  //   token: 'YOUR_TOKEN',
  // },
  hockeyApp: {
    ids: {
      android: '',
      ios: '',
    }
  },
  app: {
    group: {
      max: 10, // Max group per user
      devices: 10, //Max device number per group
    },
    schedule: {
      max: 10, // Max schedule number per device
    },
    support: {
      email: 'service@cectco.com',
    },
    disableLog: false,
    logConfig: {
      recordLimit: 10000,
    },
    theme: {
      primaryColor: '#00baff',
      productName: '智慧型雲端模組',
      wifiName: 'CECTCO-XXXX',
    },
    amazonAlexa: {
      skillName: 'skill-name',
    },
    ifttt: {
      actionName: 'ifttt_name',
    },
    googleHome: {
      ghName: 'gh_name',
    },
  }
};
