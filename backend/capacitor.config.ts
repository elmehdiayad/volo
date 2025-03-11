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
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#121212'
    },
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
}

export default config
