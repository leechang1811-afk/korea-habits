import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'assets', 'appintoss');
// App-in-Toss icon variant (used for v4 clean gray check)
const outPath = path.join(outDir, 'app-icon-1024-v4-clean-gray-check.png');

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 2 });

  await page.setContent(`
    <html>
      <body style="margin:0;background:#e5e7eb;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:900px;height:900px;border-radius:210px;position:relative;overflow:hidden;
          background:linear-gradient(180deg,#3674e8,#2360d8);font-family:Pretendard,system-ui,sans-serif;">

          <div style="position:absolute;left:132px;right:132px;bottom:190px;height:300px;display:flex;gap:26px;align-items:flex-end;">
            <div style="flex:1;height:85px;background:#10b981;border-radius:18px;"></div>
            <div style="flex:1;height:135px;background:#4ade80;border-radius:18px;"></div>
            <div style="flex:1;height:195px;background:#34d399;border-radius:18px;"></div>
            <div style="flex:1;height:255px;background:#e2e8f0;border-radius:18px;position:relative;">
              <div style="
                position:absolute;left:0;right:0;top:18px;display:flex;align-items:flex-start;justify-content:center;
                color:#ffffff;font-size:68px;font-weight:800;line-height:1;">✓</div>
            </div>
          </div>

          <div style="position:absolute;left:145px;bottom:115px;right:145px;height:20px;background:rgba(255,255,255,.72);border-radius:12px;"></div>

          <div style="
            position:absolute;left:0;right:0;top:320px;text-align:center;
            color:rgba(255,255,255,.96);font-size:68px;font-weight:900;letter-spacing:-0.8px;">
            좋은 습관 만들기
          </div>
        </div>
      </body>
    </html>
  `);

  await page.screenshot({ path: outPath });
  await browser.close();
  console.log('saved:', outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
