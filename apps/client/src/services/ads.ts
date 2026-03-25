/**
 * 앱인토스 통합 광고 (인앱 광고 2.0 ver2) 연동
 *
 * - 첫 호출 시에만 @apps-in-toss/web-framework 동적 import
 * - 실제 연동 여부는 ReactNativeWebView가 아니라 loadFullScreenAd.isSupported()로 판별
 *   (앱인토스 WebView에 RN WebView 객체가 없어도 브릿지가 동작하는 경우가 있음)
 * - 샌드박스/내부 테스트: VITE_AIT_USE_TEST_AD_IDS=true 시 공식 테스트용 광고 ID 사용
 */

export interface AdsService {
  loadInterstitial(): Promise<void>;
  showInterstitial(): Promise<boolean>;
  loadRewarded(): Promise<void>;
  showRewarded(type: 'revive' | 'result'): Promise<boolean>;
}

const USE_TEST_AD_IDS = import.meta.env.VITE_AIT_USE_TEST_AD_IDS === 'true';

/** 앱인토스 문서의 샌드박스용 테스트 ID (ADS_INAPPTOSS.md) */
const TEST_AD = {
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
  banner: 'ait-ad-test-banner-id',
} as const;

const AD_GROUP_INTERSTITIAL =
  import.meta.env.VITE_AD_GROUP_INTERSTITIAL ??
  (USE_TEST_AD_IDS ? TEST_AD.interstitial : 'ait.v2.live.ec8754e569b4450ce');
const AD_GROUP_REWARDED =
  import.meta.env.VITE_AD_GROUP_REWARDED ??
  (USE_TEST_AD_IDS ? TEST_AD.rewarded : 'ait.v2.live.aa19920554fe4121');
export const AD_GROUP_BANNER =
  import.meta.env.VITE_AD_GROUP_BANNER ??
  (USE_TEST_AD_IDS ? TEST_AD.banner : 'ait.v2.live.2c66bc8b68cc4562');

function safeIsFullScreenAdsSupported(
  sdk: typeof import('@apps-in-toss/web-framework')
): boolean {
  try {
    return sdk.loadFullScreenAd?.isSupported?.() === true;
  } catch {
    return false;
  }
}

let adsSdkPromise: Promise<typeof import('@apps-in-toss/web-framework')> | null = null;
function getAdsSdk() {
  if (!adsSdkPromise) {
    adsSdkPromise = import('@apps-in-toss/web-framework');
  }
  return adsSdkPromise;
}

let resolvedImplPromise: Promise<AdsService> | null = null;

function resolveAdsImpl(): Promise<AdsService> {
  if (!resolvedImplPromise) {
    resolvedImplPromise = (async () => {
      if (!AD_GROUP_INTERSTITIAL || !AD_GROUP_REWARDED) {
        return new MockAdsService();
      }
      if (typeof window === 'undefined') {
        return new MockAdsService();
      }
      try {
        const sdk = await getAdsSdk();
        if (safeIsFullScreenAdsSupported(sdk)) {
          return new AppsInTossAdsService();
        }
      } catch {
        /* 번들 로드 실패 등 */
      }
      return new MockAdsService();
    })();
  }
  return resolvedImplPromise;
}

/** 앱인토스 실제 연동 */
class AppsInTossAdsService implements AdsService {
  private _interstitialLoaded = false;
  private _rewardedLoaded = false;
  private _lastInterstitialAt = 0;
  private readonly COOLDOWN_MS = 30_000;

  async loadInterstitial(): Promise<void> {
    const sdk = await getAdsSdk();
    if (!safeIsFullScreenAdsSupported(sdk)) throw new Error('ads not supported');
    return new Promise((resolve, reject) => {
      sdk.loadFullScreenAd({
        options: { adGroupId: AD_GROUP_INTERSTITIAL },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            this._interstitialLoaded = true;
            resolve();
          }
        },
        onError: (err) => {
          this._interstitialLoaded = false;
          reject(err);
        },
      });
    });
  }

  async showInterstitial(): Promise<boolean> {
    const sdk = await getAdsSdk();
    try {
      if (sdk.showFullScreenAd?.isSupported?.() !== true) return false;
    } catch {
      return false;
    }
    if (Date.now() - this._lastInterstitialAt < this.COOLDOWN_MS) return false;
    if (!this._interstitialLoaded) {
      try {
        await this.loadInterstitial();
      } catch {
        return false;
      }
    }

    return new Promise((resolve) => {
      let shown = false;
      sdk.showFullScreenAd({
        options: { adGroupId: AD_GROUP_INTERSTITIAL },
        onEvent: (event) => {
          if (event.type === 'show' || event.type === 'impression') {
            shown = true;
            this._lastInterstitialAt = Date.now();
          }
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            this._interstitialLoaded = false;
            resolve(shown);
            sdk.loadFullScreenAd({
              options: { adGroupId: AD_GROUP_INTERSTITIAL },
              onEvent: (e) => {
                if (e.type === 'loaded') this._interstitialLoaded = true;
              },
              onError: () => {},
            });
          }
        },
        onError: () => {
          this._interstitialLoaded = false;
          resolve(false);
        },
      });
    });
  }

  async loadRewarded(): Promise<void> {
    const sdk = await getAdsSdk();
    if (!safeIsFullScreenAdsSupported(sdk)) throw new Error('ads not supported');
    return new Promise((resolve, reject) => {
      sdk.loadFullScreenAd({
        options: { adGroupId: AD_GROUP_REWARDED },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            this._rewardedLoaded = true;
            resolve();
          }
        },
        onError: (err) => {
          this._rewardedLoaded = false;
          reject(err);
        },
      });
    });
  }

  async showRewarded(_type: 'revive' | 'result'): Promise<boolean> {
    const sdk = await getAdsSdk();
    try {
      if (sdk.showFullScreenAd?.isSupported?.() !== true) return false;
    } catch {
      return false;
    }
    if (!this._rewardedLoaded) {
      try {
        await this.loadRewarded();
      } catch {
        return false;
      }
    }

    return new Promise((resolve) => {
      let earned = false;
      sdk.showFullScreenAd({
        options: { adGroupId: AD_GROUP_REWARDED },
        onEvent: (event) => {
          if (event.type === 'userEarnedReward') earned = true;
          if (event.type === 'dismissed' || event.type === 'failedToShow') {
            this._rewardedLoaded = false;
            resolve(earned);
            sdk.loadFullScreenAd({
              options: { adGroupId: AD_GROUP_REWARDED },
              onEvent: (e) => {
                if (e.type === 'loaded') this._rewardedLoaded = true;
              },
              onError: () => {},
            });
          }
        },
        onError: () => {
          this._rewardedLoaded = false;
          resolve(false);
        },
      });
    });
  }
}

/** Mock 구현 - 브라우저·미지원 WebView */
class MockAdsService implements AdsService {
  private _interstitialLoaded = false;
  private _rewardedLoaded = false;
  private _lastAdShownAt = 0;
  private readonly COOLDOWN_MS = 30_000;

  async loadInterstitial(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    this._interstitialLoaded = true;
  }

  async showInterstitial(): Promise<boolean> {
    if (Date.now() - this._lastAdShownAt < this.COOLDOWN_MS) return false;
    if (!this._interstitialLoaded) await this.loadInterstitial();
    if (import.meta.env.DEV) console.log('[Mock] Interstitial ad shown');
    this._lastAdShownAt = Date.now();
    this._interstitialLoaded = false;
    return true;
  }

  async loadRewarded(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    this._rewardedLoaded = true;
  }

  async showRewarded(_type: 'revive' | 'result'): Promise<boolean> {
    if (!this._rewardedLoaded) await this.loadRewarded();
    if (import.meta.env.DEV) console.log('[Mock] Rewarded ad shown');
    this._lastAdShownAt = Date.now();
    this._rewardedLoaded = false;
    return true;
  }
}

export const adsService: AdsService = {
  loadInterstitial: () => resolveAdsImpl().then((s) => s.loadInterstitial()),
  showInterstitial: () => resolveAdsImpl().then((s) => s.showInterstitial()),
  loadRewarded: () => resolveAdsImpl().then((s) => s.loadRewarded()),
  showRewarded: (type) => resolveAdsImpl().then((s) => s.showRewarded(type)),
};
