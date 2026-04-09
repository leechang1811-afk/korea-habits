/**
 * 배너 광고 - 홈/기록/결과 하단에 노출 (게임 중 X)
 * TossAds.initialize → attachBanner (앱인토스 WebView 전용)
 */
import { useEffect, useRef } from 'react';
import { AD_GROUP_BANNER } from '../services/ads';

let initPromise: Promise<boolean> | null = null;
let sdkPromise: Promise<typeof import('@apps-in-toss/web-framework')> | null = null;

function getBannerSdk() {
  if (!sdkPromise) sdkPromise = import('@apps-in-toss/web-framework');
  return sdkPromise;
}

function tossBannerSupported(sdk: typeof import('@apps-in-toss/web-framework')): boolean {
  try {
    return sdk.TossAds?.attachBanner?.isSupported?.() === true;
  } catch {
    return false;
  }
}

function ensureTossAdsInit(sdk: typeof import('@apps-in-toss/web-framework')): Promise<boolean> {
  if (initPromise) return initPromise;
  try {
    if (sdk.TossAds?.initialize?.isSupported?.() !== true) return Promise.resolve(false);
  } catch {
    return Promise.resolve(false);
  }
  initPromise = new Promise((resolve) => {
    sdk.TossAds.initialize({
      callbacks: {
        onInitialized: () => resolve(true),
        onInitializationFailed: () => {
          initPromise = null;
          resolve(false);
        },
      },
    });
  });
  return initPromise;
}

function tryAttach(
  sdk: typeof import('@apps-in-toss/web-framework'),
  container: HTMLDivElement,
  onDestroy: (fn: () => void) => void,
  isAborted: () => boolean
) {
  if (!tossBannerSupported(sdk)) return;
  ensureTossAdsInit(sdk).then((ok) => {
    if (isAborted() || !ok || !container.isConnected) return;
    try {
      // 이전 슬롯 DOM 잔존 시 attach가 실패하거나 레이아웃이 틀어질 수 있어 초기화
      container.replaceChildren();
      const result = sdk.TossAds.attachBanner(AD_GROUP_BANNER, container, {
        theme: 'light',
        tone: 'grey',
        variant: 'card',
      });
      if (isAborted()) {
        result?.destroy?.();
        return;
      }
      if (result?.destroy) onDestroy(result.destroy);
    } catch {
      // SDK/네트워크 이슈 — 아래 지연 재시도에 맡김
    }
  });
}

export type BannerAdProps = {
  /** 값이 바뀔 때마다 기존 배너를 제거하고 슬롯에 다시 붙입니다 (목표 전환·화면 전환 등). */
  refreshKey?: string;
};

export default function BannerAd({ refreshKey = '0' }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const destroyRef = useRef<(() => void) | null>(null);
  const BANNER_HEIGHT_PX = 96;

  useEffect(() => {
    if (!AD_GROUP_BANNER) return;

    let cancelled = false;
    const isAborted = () => cancelled;

    const timer = setTimeout(() => {
      if (cancelled) return;
      destroyRef.current?.();
      destroyRef.current = null;
      const container = containerRef.current;
      if (!container) return;
      getBannerSdk()
        .then((sdk) => {
          if (cancelled) return;
          tryAttach(sdk, container, (destroy) => {
            destroyRef.current = destroy;
          }, isAborted);
          // 첫 attach가 네트워크/SDK 타이밍으로 누락될 때를 대비해 1회 보수 재시도
          window.setTimeout(() => {
            if (cancelled || destroyRef.current) return;
            tryAttach(sdk, container, (destroy) => {
              destroyRef.current = destroy;
            }, isAborted);
          }, 1200);
        })
        .catch(() => {});
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      destroyRef.current?.();
      destroyRef.current = null;
    };
  }, [refreshKey]);

  if (!AD_GROUP_BANNER) return null;

  return (
    <>
      <div style={{ height: `calc(${BANNER_HEIGHT_PX}px + env(safe-area-inset-bottom))` }} aria-hidden="true" />
      <div className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-md px-4 sm:px-6 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
          <div
            ref={containerRef}
            className="w-full min-h-[96px] rounded-t-xl border border-slate-200 bg-slate-50/90"
            aria-label="광고"
          />
        </div>
      </div>
    </>
  );
}
