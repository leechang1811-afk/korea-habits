/**
 * 홈 + 기록&순위 스크린샷을 636x1048 PNG로 저장
 * 실행 전에 dev 서버가 떠 있어야 함: npm run dev:client
 * 저장 위치: 프로젝트 루트 / screenshot-combo-636x1048.png
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outPath = path.join(projectRoot, 'screenshot-combo-636x1048.png');

const DEV_URL = 'http://127.0.0.1:5010/screenshot';

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 636, height: 1048 });
  try {
    await page.goto(DEV_URL, { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (err) {
    console.error('Dev 서버에 연결할 수 없습니다. 먼저 다음을 실행하세요:\n  npm run dev:client');
    process.exitCode = 1;
    await browser.close();
    return;
  }
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log('저장됨:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
