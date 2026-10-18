import process from 'node:process';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', timeout:240000, expect:{timeout:15000}, workers:1,
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:960,height:540},screenshot:'only-on-failure',trace:process.env.PLAYWRIGHT_TRACE==='1'?'retain-on-failure':'off',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']}},
  webServer:{command:'bun run preview --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000},
});
