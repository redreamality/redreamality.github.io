import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'visual-kit.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4175',
  },
  webServer: {
    command: 'uv run --no-project python -B -m http.server 4175 --directory dist/visual-kit',
    cwd: '../..',
    url: 'http://127.0.0.1:4175/full/en/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
