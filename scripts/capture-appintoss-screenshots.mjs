/**
 * App-in-Toss용 636×1048 PNG 스크린샷 재생성
 * - apps/client dev 서버(VITE_SCREENSHOT=1) 기동 후 ?shot= 픽스처로 캡처
 *
 * 사용: 리포 루트에서
 *   node scripts/capture-appintoss-screenshots.mjs
 *
 * 요구: apps/client에서 npm run dev 가능, puppeteer (루트 devDependency)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const clientDir = path.join(projectRoot, 'apps', 'client');
const outDir = path.join(projectRoot, 'assets', 'appintoss');
const CAPTURE_PORT = process.env.SCREENSHOT_PORT || '5029';
const BASE = `http://127.0.0.1:${CAPTURE_PORT}`;

const CAPTURES = [
  { shot: 'home-empty', filename: 'screenshot-01-home-empty-636x1048.png', scroll: 'top' },
  { shot: 'project-list', filename: 'screenshot-02-project-list-636x1048.png', scroll: 'top' },
  { shot: 'project-detail', filename: 'screenshot-03-project-detail-636x1048.png', scroll: 'detail' },
  { shot: 'celebration', filename: 'screenshot-04-celebration-636x1048.png', scroll: 'top' },
  { shot: 'next-stage-setup', filename: 'screenshot-05-next-stage-setup-636x1048.png', scroll: 'detail' },
];

function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server not ready: ${url}`));
        return;
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          resolve();
          return;
        }
      } catch {
        /* retry */
      }
      setTimeout(tick, 400);
    };
    tick();
  });
}

async function applyScroll(page, scroll) {
  if (scroll === 'top') {
    await page.evaluate(() => window.scrollTo(0, 0));
    return;
  }
  if (scroll === 'detail') {
    await page.evaluate(() => {
      const headings = [...document.querySelectorAll('h3')];
      const el = headings.find((e) => e.textContent?.includes('목표 상세'));
      el?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', CAPTURE_PORT, '--strictPort'], {
    cwd: clientDir,
    env: { ...process.env, VITE_SCREENSHOT: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let stderr = '';
  dev.stderr?.on('data', (c) => {
    stderr += c.toString();
  });

  try {
    await waitForServer(BASE);
  } catch (e) {
    dev.kill('SIGTERM');
    console.error(stderr.slice(-2000));
    throw e;
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 636, height: 1048, deviceScaleFactor: 2 });

  try {
    for (const { shot, filename, scroll } of CAPTURES) {
      const url = `${BASE}/?shot=${encodeURIComponent(shot)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForSelector('main', { timeout: 30000 });
      await new Promise((r) => setTimeout(r, shot === 'celebration' ? 1400 : 900));
      await applyScroll(page, scroll);
      await new Promise((r) => setTimeout(r, 200));
      const outPath = path.join(outDir, filename);
      await page.screenshot({ path: outPath, type: 'png' });
      console.log('saved', outPath);
    }
  } finally {
    await browser.close();
    dev.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
