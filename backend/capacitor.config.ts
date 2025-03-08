import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ma.volo.app',
  appName: 'Volo',
  webDir: 'build',
  server: {
    cleartext: true,
    allowNavigation: ['*.volo.ma']
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    scheme: 'https',
    contentInset: 'always',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  },
  loggingBehavior: 'debug' // Enable detailed logging
}

export default config
