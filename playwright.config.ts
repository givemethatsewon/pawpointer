import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e', fullyParallel:true, workers:2, timeout:30000,
 expect:{timeout:10000}, reporter:'list',
 use:{baseURL:'http://127.0.0.1:5174',launchOptions:process.env.PLAYWRIGHT_CHROME_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE} : undefined,headless:true,viewport:{width:1440,height:900}},
 webServer:{command:'npm run dev -- --port 5174 --strictPort',url:'http://127.0.0.1:5174',reuseExistingServer:!process.env.CI},
});
