# Firefox Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同一コードベースから `TARGET=firefox` で Firefox デスクトップ版をビルドし、AMO (listed) へ CI から提出できるようにする。

**Architecture:** `manifest.json` を唯一のソースとし、ビルド時に `build/manifest.ts` の純粋関数で Firefox 用 manifest を生成する。ブラウザ差分 (設定パネル・テーマ検出) は `src/platform/` の `chrome.ts` / `firefox.ts` に閉じ込め、webpack `DefinePlugin` の `__TARGET__` で切り替える。リリースは既存 `release.yml` に `continue-on-error` の Firefox ステップを追加する。

**Tech Stack:** TypeScript / React / Webpack 5 (ts-node ESM) / Jest (ts-jest, testEnvironment: node) / Fastlane / GitHub Actions / web-ext 10.6.0 (npx)

**Spec:** `docs/superpowers/specs/2026-09-12-firefox-support-design.md`

## Global Constraints

- パッケージ操作は pnpm。新規依存の追加は禁止。`web-ext` は `npx --yes web-ext@10.6.0` で実行する
- ソースコメントは英語・ブロックコメント (`/* */`) のみ (1 行でも)。Ruby / YAML / shell は `#` コメント可
- コミットメッセージに `Co-Authored-By` / AI 生成署名を含めない
- 作業ブランチ: `feat/firefox-support` (`develop` から作成。`develop` / `main` へ直接コミット禁止)
- UI の見た目 (レイアウト・色・フォント・余白) は変更しない
- gecko id: `free-ai-summarizer@futamura.dev`
- `strict_min_version`: `140.0`
- `data_collection_permissions`: `{ required: ['none'] }`
- `sidebar_action.default_title`: `Free AI Summarizer`、`open_at_install`: `false`
- 出力先: Chrome は `dist/dev` / `dist/prod` (変更なし)、Firefox は `dist/firefox-dev` / `dist/firefox-prod`
- `TARGET` 未指定時は `chrome`。`chrome` / `firefox` 以外はビルドエラー
- 各タスク完了時に `pnpm type-check` と `pnpm test` を通すこと

## Spec からの差分 (計画作成時に確定、spec にも反映済み)

1. `initThemeDetection` はコールバック `(isDarkMode: boolean) => void` を受け取る。platform から store への依存をなくし、テストしやすくするため
2. AMO 初回提出の手順は `README.md` に書く。`fastlane/README.md` は fastlane 実行のたびに自動生成で上書きされるため
3. Fastlane の `release` レーンではソース zip を作らない。bump コミット前の `HEAD` から作ると version がずれるため。ソース zip は単独レーン `create_source_package` と、CI (タグ時点) で作る
4. Chrome のリグレッション確認もユーザーの手動確認とする。Claude in Chrome では、ツールバーの popup・右クリックメニュー・unpacked 拡張の読み込みを操作できないため
5. `eslint.config.js` の `ignores` から `build/**` を外す (外さないと `build/*.ts` が TS パーサなしで解析されて失敗する)

---

### Task 1: manifest 変換関数 (`build/manifest.ts`)

**Files:**
- Create: `build/manifest.ts`
- Create: `build/__tests__/manifest.test.ts`
- Modify: `tsconfig.json` (`include`)
- Modify: `eslint.config.js:94` (`ignores` から `build/**` を削除)
- Modify: `package.json` (`eslint-*` / `prettier-*` スクリプトの対象に `build/**/*.ts` を追加)

**Interfaces:**
- Consumes: なし
- Produces:
  - `type Target = 'chrome' | 'firefox'`
  - `interface Manifest` (下記コード参照)
  - `FIREFOX_ADDON_ID = 'free-ai-summarizer@futamura.dev'`
  - `FIREFOX_STRICT_MIN_VERSION = '140.0'`
  - `toDevManifest(manifest: Manifest): Manifest`
  - `toFirefoxManifest(manifest: Manifest): Manifest`
  - `transformManifest(manifest: Manifest, options: { isDev: boolean; target: Target }): Manifest`

- [ ] **Step 1: 作業ブランチを作成**

```bash
git checkout develop
git checkout -b feat/firefox-support
```

- [ ] **Step 2: tsconfig / eslint / package.json を build/ に対応させる**

`tsconfig.json` の `include` を次にする:

```json
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "build/**/*.ts",
    "webpack.config.ts"
  ],
```

`eslint.config.js:94` の `ignores` から `'build/**', ` を削除する:

```js
    ignores: ['node_modules/**', '.pnp/**', '.pnp.js', 'dist/**', 'out/**', 'fastlane/**', 'log/**', 'public/**'],
```

`package.json` の scripts を次にする (該当 4 行のみ変更):

```json
    "prettier-check": "prettier --config prettier.config.js --check \"src/**/*.{js,jsx,ts,tsx,css,scss,json}\" \"build/**/*.ts\"",
    "prettier-fix": "prettier --config prettier.config.js --write \"src/**/*.{js,jsx,ts,tsx,css,scss,json}\" \"build/**/*.ts\"",
    "eslint-check": "eslint \"src/**/*.{ts,tsx,js,jsx}\" \"build/**/*.ts\"",
    "eslint-fix": "eslint --fix \"src/**/*.{ts,tsx,js,jsx}\" \"build/**/*.ts\"",
```

- [ ] **Step 3: 失敗するテストを書く**

`build/__tests__/manifest.test.ts`:

```ts
import manifestJson from '../../manifest.json';
import { FIREFOX_ADDON_ID, FIREFOX_STRICT_MIN_VERSION, Manifest, toDevManifest, toFirefoxManifest, transformManifest } from '../manifest';

/* Fresh deep copy of the real manifest so each test can mutate or compare freely */
const source = (): Manifest => JSON.parse(JSON.stringify(manifestJson)) as Manifest;

const toDevIcons = (icons: Record<string, string>) => Object.fromEntries(Object.entries(icons).map(([size, iconPath]) => [size, iconPath.replace(/\.png$/, '-dev.png')]));

describe('toDevManifest', () => {
  it('points icons and action icons at the DEV-badged variants', () => {
    const result = toDevManifest(source());
    expect(result.icons).toEqual(toDevIcons(source().icons!));
    expect(result.action?.default_icon).toEqual(toDevIcons(source().action!.default_icon!));
  });

  it('does not mutate the input', () => {
    const input = source();
    toDevManifest(input);
    expect(input).toEqual(source());
  });
});

describe('toFirefoxManifest', () => {
  it('replaces the service worker with background scripts', () => {
    expect(toFirefoxManifest(source()).background).toEqual({ scripts: ['service-worker.js'] });
  });

  it('removes permissions Firefox does not support', () => {
    const result = toFirefoxManifest(source());
    expect(result.permissions).toEqual(source().permissions!.filter(permission => permission !== 'offscreen' && permission !== 'sidePanel'));
  });

  it('replaces side_panel with a sidebar_action that does not open at install', () => {
    const result = toFirefoxManifest(source());
    expect(result.side_panel).toBeUndefined();
    expect(result.sidebar_action).toEqual({
      default_panel: 'options.html',
      default_title: 'Free AI Summarizer',
      default_icon: source().action!.default_icon,
      open_at_install: false,
    });
  });

  it('adds gecko settings', () => {
    expect(FIREFOX_ADDON_ID).toBe('free-ai-summarizer@futamura.dev');
    expect(FIREFOX_STRICT_MIN_VERSION).toBe('140.0');
    expect(toFirefoxManifest(source()).browser_specific_settings).toEqual({
      gecko: {
        id: 'free-ai-summarizer@futamura.dev',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] },
      },
    });
  });

  it('keeps unrelated keys', () => {
    const input = source();
    const result = toFirefoxManifest(input);
    for (const key of ['manifest_version', 'name', 'version', 'description', 'host_permissions', 'action', 'icons', 'content_scripts', 'options_page', 'web_accessible_resources']) {
      expect(result[key]).toEqual(input[key]);
    }
  });

  it('does not mutate the input', () => {
    const input = source();
    toFirefoxManifest(input);
    expect(input).toEqual(source());
  });

  it('throws when the service worker is missing', () => {
    const input = source();
    delete input.background;
    expect(() => toFirefoxManifest(input)).toThrow('manifest.background.service_worker');
  });

  it('throws when the side panel path is missing', () => {
    const input = source();
    delete input.side_panel;
    expect(() => toFirefoxManifest(input)).toThrow('manifest.side_panel.default_path');
  });
});

describe('transformManifest', () => {
  it('returns the manifest unchanged for chrome production builds', () => {
    expect(transformManifest(source(), { isDev: false, target: 'chrome' })).toEqual(source());
  });

  it('applies only the dev icons for chrome development builds', () => {
    expect(transformManifest(source(), { isDev: true, target: 'chrome' })).toEqual(toDevManifest(source()));
  });

  it('applies only the Firefox transform for firefox production builds', () => {
    expect(transformManifest(source(), { isDev: false, target: 'firefox' })).toEqual(toFirefoxManifest(source()));
  });

  it('uses the dev icons for the sidebar in firefox development builds', () => {
    const result = transformManifest(source(), { isDev: true, target: 'firefox' });
    expect(result.sidebar_action?.default_icon).toEqual(toDevIcons(source().action!.default_icon!));
    expect(result.background).toEqual({ scripts: ['service-worker.js'] });
  });
});
```

- [ ] **Step 4: テストが失敗することを確認**

Run: `pnpm test build/__tests__/manifest.test.ts`
Expected: FAIL (`Cannot find module '../manifest'`)

- [ ] **Step 5: 実装する**

`build/manifest.ts`:

```ts
/**
 * Build-time manifest transforms. manifest.json is the single source of truth;
 * the development and Firefox variants are derived from it by webpack.
 */

export type Target = 'chrome' | 'firefox';

type Icons = Record<string, string>;

export interface Manifest {
  name: string;
  version: string;
  permissions?: string[];
  icons?: Icons;
  action?: { default_icon?: Icons; [key: string]: unknown };
  background?: { service_worker?: string; type?: string; scripts?: string[] };
  side_panel?: { default_path?: string };
  sidebar_action?: { default_panel: string; default_title: string; default_icon?: Icons; open_at_install: boolean };
  browser_specific_settings?: {
    gecko: { id: string; strict_min_version: string; data_collection_permissions: { required: string[] } };
  };
  [key: string]: unknown;
}

export const FIREFOX_ADDON_ID = 'free-ai-summarizer@futamura.dev';

/* Minimum version that understands data_collection_permissions (also covers ESR 140) */
export const FIREFOX_STRICT_MIN_VERSION = '140.0';

/* Short label shown in Firefox's sidebar switcher; the manifest name is too long there */
const FIREFOX_SIDEBAR_TITLE = 'Free AI Summarizer';

const FIREFOX_UNSUPPORTED_PERMISSIONS = ['offscreen', 'sidePanel'];

const toDevIcons = (icons: Icons): Icons => Object.fromEntries(Object.entries(icons).map(([size, iconPath]) => [size, iconPath.replace(/\.png$/, '-dev.png')]));

/**
 * Point manifest icons at the DEV-badged variants for development builds
 */
export const toDevManifest = (manifest: Manifest): Manifest => ({
  ...manifest,
  ...(manifest.icons && { icons: toDevIcons(manifest.icons) }),
  ...(manifest.action && {
    action: {
      ...manifest.action,
      ...(manifest.action.default_icon && { default_icon: toDevIcons(manifest.action.default_icon) }),
    },
  }),
});

/**
 * Convert the Chrome manifest into a Firefox (desktop) manifest
 */
export const toFirefoxManifest = (manifest: Manifest): Manifest => {
  const serviceWorker = manifest.background?.service_worker;
  if (!serviceWorker) throw new Error('manifest.background.service_worker is required to build the Firefox manifest');
  const sidePanelPath = manifest.side_panel?.default_path;
  if (!sidePanelPath) throw new Error('manifest.side_panel.default_path is required to build the Firefox manifest');

  const { side_panel, ...rest } = manifest;
  return {
    ...rest,
    permissions: (manifest.permissions ?? []).filter(permission => !FIREFOX_UNSUPPORTED_PERMISSIONS.includes(permission)),
    background: { scripts: [serviceWorker] },
    sidebar_action: {
      default_panel: sidePanelPath,
      default_title: FIREFOX_SIDEBAR_TITLE,
      default_icon: manifest.action?.default_icon,
      open_at_install: false,
    },
    browser_specific_settings: {
      gecko: {
        id: FIREFOX_ADDON_ID,
        strict_min_version: FIREFOX_STRICT_MIN_VERSION,
        data_collection_permissions: { required: ['none'] },
      },
    },
  };
};

/**
 * Apply the transforms for the given build. Dev icons are applied first so the
 * Firefox sidebar icon inherits them.
 */
export const transformManifest = (manifest: Manifest, options: { isDev: boolean; target: Target }): Manifest => {
  const devApplied = options.isDev ? toDevManifest(manifest) : manifest;
  return options.target === 'firefox' ? toFirefoxManifest(devApplied) : devApplied;
};
```

- [ ] **Step 6: テストが通ることを確認**

Run: `pnpm test build/__tests__/manifest.test.ts`
Expected: PASS (14 tests)

- [ ] **Step 7: 静的チェック**

Run: `pnpm type-check`、`pnpm eslint-check`、`pnpm prettier-check`
Expected: すべてエラーなし。prettier で差分が出たら `pnpm prettier-fix` を実行して再確認する

- [ ] **Step 8: Commit**

```bash
git add build/manifest.ts build/__tests__/manifest.test.ts tsconfig.json eslint.config.js package.json
git commit -m "feat: add build-time manifest transforms for Firefox"
```

---

### Task 2: webpack の TARGET 切り替えと Firefox ビルドスクリプト

**Files:**
- Modify: `webpack.config.ts`
- Modify: `package.json` (scripts に `dev:firefox` / `build:firefox` を追加)
- Create: `src/types/Global.d.ts`
- Modify: `jest.config.js`

**Interfaces:**
- Consumes: `transformManifest(manifest, { isDev, target })`、`Target` (Task 1)
- Produces:
  - グローバル定数 `__TARGET__: 'chrome' | 'firefox'` (webpack では `DefinePlugin`、jest では `globals` で `'chrome'`)
  - `pnpm dev:firefox` → `dist/firefox-dev`、`pnpm build:firefox` → `dist/firefox-prod`

- [ ] **Step 1: 変更前の Chrome 本番ビルドを基準として保存**

```bash
pnpm build
rm -rf /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/baseline-prod
cp -R dist/prod /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/baseline-prod
```

(以下、このパスを `$BASELINE` と表記する。各コマンドは個別に実行する)

- [ ] **Step 2: `__TARGET__` の型宣言を追加**

`src/types/Global.d.ts`:

```ts
/**
 * Build target injected by webpack DefinePlugin (jest sets it to 'chrome' via globals)
 */
declare const __TARGET__: 'chrome' | 'firefox';
```

- [ ] **Step 3: jest に `__TARGET__` を設定**

`jest.config.js`:

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    __TARGET__: 'chrome',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};
```

- [ ] **Step 4: webpack.config.ts を TARGET 対応にする**

`webpack.config.ts` を次の内容にする (既存の日本語 `//` コメントはそのまま残してよいが、新規コメントは英語ブロックコメントにする):

```ts
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import type { Configuration } from 'webpack';

import { Manifest, Target, transformManifest } from './build/manifest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

/* Build target: chrome (default) or firefox */
const target = (process.env.TARGET ?? 'chrome') as Target;
if (target !== 'chrome' && target !== 'firefox') {
  throw new Error(`Unknown TARGET: ${process.env.TARGET} (expected "chrome" or "firefox")`);
}
const isFirefox = target === 'firefox';

/* Chrome keeps dist/dev and dist/prod; Firefox builds go to dist/firefox-dev and dist/firefox-prod */
const outputDir = `${isFirefox ? 'firefox-' : ''}${isDev ? 'dev' : 'prod'}`;

// pdf.worker.min.mjs の絶対パスを取得
const pdfWorkerPath = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');

const config: Configuration = {
  mode: isDev ? 'development' : 'production',
  entry: {
    popup: './src/pages/Popup.tsx',
    options: {
      import: './src/pages/Options.tsx',
      filename: 'options.js',
    },
    'service-worker': './src/pages/ServiceWorker.ts',
    /* Firefox has no offscreen API; theme detection runs in the background page instead */
    ...(!isFirefox && { offscreen: './src/pages/Offscreen.ts' }),
    content: './src/pages/Content.tsx',
  },
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'dist', outputDir),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      __TARGET__: JSON.stringify(target),
    }),
    new MiniCssExtractPlugin({
      filename: 'globals.css',
    }),
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './public/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    ...(isFirefox
      ? []
      : [
          new HtmlWebpackPlugin({
            template: './public/offscreen.html',
            filename: 'offscreen.html',
            chunks: ['offscreen'],
          }),
        ]),
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: {
            ignore: ['**/*.sketch', '**/*.html', '**/.DS_Store'],
          },
        },
        {
          from: 'manifest.json',
          to: '.',
          transform: (content: Buffer) => {
            /* Keep the Chrome production manifest byte-identical to the source */
            if (!isDev && !isFirefox) {
              return content;
            }
            const manifest = JSON.parse(content.toString()) as Manifest;
            return JSON.stringify(transformManifest(manifest, { isDev, target }), null, 2);
          },
        },
        // pdfjs worker を public ディレクトリにコピー
        {
          from: pdfWorkerPath,
          to: 'pdf.worker.min.mjs',
        },
      ],
    }),
  ],
  // devtool: isDev ? 'inline-source-map' : false,
  devtool: isDev ? 'source-map' : false,
  optimization: {
    minimize: !isDev,
  },
};

export default config;
```

- [ ] **Step 5: Firefox 用スクリプトを追加**

`package.json` の scripts の `"start"` の直後に追加する:

```json
    "dev:firefox": "TARGET=firefox NODE_ENV=development node --loader ts-node/esm node_modules/webpack/bin/webpack.js --config webpack.config.ts --mode=development --watch",
    "build:firefox": "TARGET=firefox NODE_ENV=production node --loader ts-node/esm node_modules/webpack/bin/webpack.js --config webpack.config.ts --mode=production",
```

- [ ] **Step 6: Chrome 本番ビルドが変わっていないことを確認**

Run: `pnpm build`
Expected: 成功。`ERR_MODULE_NOT_FOUND` などで `./build/manifest` を解決できない場合は、import パスを推測で変えずに作業を止めて報告する (ts-node ESM の解決設定に関わるため)

Run: `diff -r $BASELINE dist/prod`
Expected: 差分なし (この時点ではまだ `__TARGET__` をどこからも参照していないため、バンドルも manifest も同一になる)

- [ ] **Step 7: Firefox ビルドを確認**

Run: `pnpm build:firefox`
Expected: 成功し、`dist/firefox-prod` が作られる

Run: `ls dist/firefox-prod`
Expected: `offscreen.html` / `offscreen.js` が存在しない。`popup.html`、`options.html`、`service-worker.js`、`content.js`、`manifest.json`、`pdf.worker.min.mjs` が存在する

Run: `cat dist/firefox-prod/manifest.json`
Expected: `background.scripts`、`sidebar_action`、`browser_specific_settings.gecko` が含まれ、`side_panel`、`offscreen`、`sidePanel` が含まれない

Run: `TARGET=safari pnpm build`
Expected: `Unknown TARGET: safari` で失敗する

- [ ] **Step 8: 静的チェックとテスト**

Run: `pnpm type-check`、`pnpm test`、`pnpm eslint-check`、`pnpm prettier-check`
Expected: すべて成功

- [ ] **Step 9: Commit**

```bash
git add webpack.config.ts package.json src/types/Global.d.ts jest.config.js
git commit -m "feat: add Firefox build target to webpack"
```

---

### Task 3: platform モジュール (`src/platform/`)

**Files:**
- Create: `src/platform/types.ts`
- Create: `src/platform/chrome.ts`
- Create: `src/platform/firefox.ts`
- Create: `src/platform/index.ts`
- Create: `src/types/Firefox.d.ts`
- Test: `src/platform/__tests__/chrome.test.ts`
- Test: `src/platform/__tests__/firefox.test.ts`

**Interfaces:**
- Consumes: `__TARGET__` (Task 2)、`logger` from `@/utils`
- Produces (`@/platform` から import する):
  - `openSettingsPanel(windowId?: number): Promise<void>`
  - `closeSettingsPanel(): Promise<void>`
  - `initThemeDetection(onColorSchemeChange: (isDarkMode: boolean) => void): Promise<void>`
  - `interface Platform` (上記 3 メソッド)
  - `chromePlatform: Platform` (`@/platform/chrome`)、`firefoxPlatform: Platform` (`@/platform/firefox`)

- [ ] **Step 1: 失敗するテストを書く (Firefox)**

`src/platform/__tests__/firefox.test.ts`:

```ts
import { firefoxPlatform } from '@/platform/firefox';

describe('firefoxPlatform', () => {
  const open = jest.fn(() => Promise.resolve());
  const close = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    open.mockClear();
    close.mockClear();
    (globalThis as any).browser = { sidebarAction: { open, close } };
  });

  afterEach(() => {
    delete (globalThis as any).browser;
    delete (globalThis as any).matchMedia;
    delete (globalThis as any).chrome;
  });

  it('opens the sidebar synchronously so the user gesture is kept', () => {
    const promise = firefoxPlatform.openSettingsPanel(123);
    /* Must be called before the returned promise is awaited */
    expect(open).toHaveBeenCalledTimes(1);
    return promise;
  });

  it('closes the sidebar synchronously', () => {
    const promise = firefoxPlatform.closeSettingsPanel();
    expect(close).toHaveBeenCalledTimes(1);
    return promise;
  });

  it('reports the initial color scheme and later changes', async () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const mediaQuery = {
      matches: true,
      addEventListener: jest.fn((_type: string, callback: (event: { matches: boolean }) => void) => {
        listener = callback;
      }),
    };
    (globalThis as any).matchMedia = jest.fn(() => mediaQuery);
    const onChange = jest.fn();

    await firefoxPlatform.initThemeDetection(onChange);

    expect((globalThis as any).matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(onChange).toHaveBeenLastCalledWith(true);
    listener?.({ matches: false });
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('does not use runtime messaging for theme detection', async () => {
    const sendMessage = jest.fn();
    (globalThis as any).chrome = { runtime: { sendMessage } };
    (globalThis as any).matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn() }));

    await firefoxPlatform.initThemeDetection(jest.fn());

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 失敗するテストを書く (Chrome)**

`src/platform/__tests__/chrome.test.ts`:

```ts
import { chromePlatform } from '@/platform/chrome';

describe('chromePlatform', () => {
  let chromeMock: any;

  beforeEach(() => {
    chromeMock = {
      sidePanel: {
        setOptions: jest.fn(() => Promise.resolve()),
        open: jest.fn(() => Promise.resolve()),
      },
      tabs: {
        query: jest.fn(() => Promise.resolve([{ id: 1, windowId: 42 }])),
      },
      offscreen: {
        hasDocument: jest.fn(() => Promise.resolve(false)),
        closeDocument: jest.fn(() => Promise.resolve()),
        createDocument: jest.fn(() => Promise.resolve()),
      },
    };
    (globalThis as any).chrome = chromeMock;
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
  });

  it('opens the side panel synchronously when a window id is given', () => {
    const promise = chromePlatform.openSettingsPanel(7);
    /* Context menu callers rely on this staying synchronous to keep the user gesture */
    expect(chromeMock.sidePanel.setOptions).toHaveBeenCalledWith({ path: 'options.html', enabled: true });
    expect(chromeMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 7 });
    expect(chromeMock.tabs.query).not.toHaveBeenCalled();
    return promise;
  });

  it('resolves the active window when no window id is given', async () => {
    await chromePlatform.openSettingsPanel();
    expect(chromeMock.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(chromeMock.sidePanel.setOptions).toHaveBeenCalledWith({ path: 'options.html', enabled: true });
    expect(chromeMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 });
  });

  it('does nothing when no active window is found', async () => {
    chromeMock.tabs.query.mockResolvedValueOnce([]);
    await chromePlatform.openSettingsPanel();
    expect(chromeMock.sidePanel.open).not.toHaveBeenCalled();
  });

  it('disables the side panel on close', async () => {
    await chromePlatform.closeSettingsPanel();
    expect(chromeMock.sidePanel.setOptions).toHaveBeenCalledWith({ enabled: false });
  });

  it('recreates the offscreen document for theme detection', async () => {
    chromeMock.offscreen.hasDocument.mockResolvedValueOnce(true);
    await chromePlatform.initThemeDetection(jest.fn());
    expect(chromeMock.offscreen.closeDocument).toHaveBeenCalledTimes(1);
    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledWith({
      url: 'offscreen.html',
      reasons: ['MATCH_MEDIA'],
      justification: 'Detect system color scheme changes',
    });
  });

  it('creates the offscreen document without closing when none exists', async () => {
    await chromePlatform.initThemeDetection(jest.fn());
    expect(chromeMock.offscreen.closeDocument).not.toHaveBeenCalled();
    expect(chromeMock.offscreen.createDocument).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `pnpm test src/platform`
Expected: FAIL (`Cannot find module '@/platform/firefox'` / `'@/platform/chrome'`)

- [ ] **Step 4: Firefox API の型宣言を追加**

`src/types/Firefox.d.ts`:

```ts
/**
 * Minimal declarations for the Firefox-only WebExtension APIs used by src/platform/firefox.ts
 */
declare namespace browser.sidebarAction {
  /**
   * Open the sidebar. Must be called synchronously from a user input handler.
   */
  function open(): Promise<void>;

  /**
   * Close the sidebar. Must be called synchronously from a user input handler.
   */
  function close(): Promise<void>;
}
```

- [ ] **Step 5: platform の実装を書く**

`src/platform/types.ts`:

```ts
/**
 * Browser-specific operations. Everything else keeps using the chrome.* namespace,
 * which Firefox also provides.
 */
export interface Platform {
  /**
   * Open the settings panel (Chrome side panel / Firefox sidebar).
   * Call it before any await in a user gesture handler.
   */
  openSettingsPanel(windowId?: number): Promise<void>;

  /**
   * Close the settings panel
   */
  closeSettingsPanel(): Promise<void>;

  /**
   * Start detecting the OS color scheme
   * @param onColorSchemeChange - Called with the current scheme when the platform reports it directly
   */
  initThemeDetection(onColorSchemeChange: (isDarkMode: boolean) => void): Promise<void>;
}
```

`src/platform/chrome.ts`:

```ts
import { Platform } from '@/platform/types';
import { logger } from '@/utils';

const getActiveWindowId = async (): Promise<number | undefined> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.windowId;
};

export const chromePlatform: Platform = {
  openSettingsPanel: async (windowId?: number) => {
    /* Resolve the window only when none is given, so gesture-bound callers reach sidePanel.open() synchronously */
    const targetWindowId = windowId ?? (await getActiveWindowId());
    if (!targetWindowId) return;
    chrome.sidePanel.setOptions({ path: 'options.html', enabled: true });
    await chrome.sidePanel.open({ windowId: targetWindowId });
  },

  closeSettingsPanel: async () => {
    await chrome.sidePanel.setOptions({ enabled: false });
  },

  /* The offscreen document reports the scheme via COLOR_SCHEME_CHANGED messages, so the callback is not used here */
  initThemeDetection: async () => {
    /** Close existing document if it exists */
    if (await chrome.offscreen.hasDocument()) {
      await chrome.offscreen.closeDocument();
    }

    /** Create new document with error handling */
    try {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['MATCH_MEDIA' as chrome.offscreen.Reason],
        justification: 'Detect system color scheme changes',
      });
      logger.debug('🧑‍🍳🎨', '[platform/chrome.ts]', '[initThemeDetection]', 'Offscreen document created successfully');
    } catch (createError) {
      logger.error('🧑‍🍳🎨', '[platform/chrome.ts]', '[initThemeDetection]', 'Failed to create offscreen document', createError);
    }
  },
};
```

`src/platform/firefox.ts`:

```ts
import { Platform } from '@/platform/types';
import { logger } from '@/utils';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const firefoxPlatform: Platform = {
  /* Not async: sidebarAction.open() is rejected unless it runs synchronously inside the user gesture */
  openSettingsPanel: () => browser.sidebarAction.open(),

  closeSettingsPanel: () => browser.sidebarAction.close(),

  /**
   * Firefox background pages have a DOM, so matchMedia works here directly.
   * The offscreen flow (runtime.sendMessage to itself) has no receiver in Firefox and would retry forever.
   */
  initThemeDetection: async onColorSchemeChange => {
    const mediaQuery = globalThis.matchMedia(COLOR_SCHEME_QUERY);
    logger.debug('🧑‍🍳🎨', '[platform/firefox.ts]', '[initThemeDetection]', 'Initial media query state:', mediaQuery.matches);
    onColorSchemeChange(mediaQuery.matches);
    mediaQuery.addEventListener('change', event => onColorSchemeChange(event.matches));
  },
};
```

`src/platform/index.ts`:

```ts
import { chromePlatform } from '@/platform/chrome';
import { firefoxPlatform } from '@/platform/firefox';
import { Platform } from '@/platform/types';

/* __TARGET__ is replaced at build time, so the unused implementation is dropped by the minifier */
const platform: Platform = __TARGET__ === 'firefox' ? firefoxPlatform : chromePlatform;

/* Plain wrappers keep each call synchronous up to the underlying browser API */
export const openSettingsPanel = (windowId?: number): Promise<void> => platform.openSettingsPanel(windowId);
export const closeSettingsPanel = (): Promise<void> => platform.closeSettingsPanel();
export const initThemeDetection = (onColorSchemeChange: (isDarkMode: boolean) => void): Promise<void> => platform.initThemeDetection(onColorSchemeChange);

export type { Platform };
```

- [ ] **Step 6: テストが通ることを確認**

Run: `pnpm test src/platform`
Expected: PASS (10 tests)

- [ ] **Step 7: 静的チェックとテスト全体**

Run: `pnpm type-check`、`pnpm test`、`pnpm eslint-check`、`pnpm prettier-check`
Expected: すべて成功 (差分が出たら `pnpm prettier-fix`)

- [ ] **Step 8: Commit**

```bash
git add src/platform src/types/Firefox.d.ts
git commit -m "feat: add platform module for browser-specific APIs"
```

---

### Task 4: 呼び出し側を platform に切り替える

**Files:**
- Modify: `src/features/popup/components/main/PopupMain.tsx:136-172` (Settings ボタン 2 箇所)
- Modify: `src/features/options/components/main/OptionsMain.tsx:274-285` (閉じるボタン)
- Modify: `src/pages/ServiceWorker.ts:148-160` (`OPEN_SETTINGS`)、`:178-181` (右クリックメニュー)
- Modify: `src/features/serviceworker/services/ServiceWorkerThemeService.ts:11-32` (`initialize`)

**Interfaces:**
- Consumes: `openSettingsPanel`、`closeSettingsPanel`、`initThemeDetection` from `@/platform` (Task 3)
- Produces: なし (`src/platform/` の外に `chrome.sidePanel` / `chrome.offscreen` の直接呼び出しが残らない状態)

- [ ] **Step 1: PopupMain の Settings ボタンを置き換える**

`PopupMain.tsx` の import に追加 (prettier の import 並び順に従う):

```ts
import { openSettingsPanel } from '@/platform';
```

Settings ボタンの `onClick` (136-145 行目と 157-169 行目の 2 箇所) を、どちらも次の内容にする:

```tsx
            onClick={async () => {
              logger.debug('📦🍿', '[PopupMain.tsx]', '[render]', 'Settings clicked');
              /* Open the panel before any await: Firefox rejects sidebarAction.open() outside the synchronous part of a user gesture */
              await openSettingsPanel();

              /** Close the popup */
              window.close();
            }}
```

- [ ] **Step 2: OptionsMain の閉じるボタンを置き換える**

`OptionsMain.tsx` の import に追加:

```ts
import { closeSettingsPanel } from '@/platform';
```

274-285 行目の `onClick` を次にする:

```tsx
              onClick={async () => {
                try {
                  await closeSettingsPanel();
                } catch (error) {
                  logger.error('📦⌥', '[OptionsMain.tsx]', '[render]', 'Failed to close side panel', error);
                }
              }}
```

- [ ] **Step 3: ServiceWorker の設定パネル呼び出しを置き換える**

`ServiceWorker.ts` の import に追加:

```ts
import { openSettingsPanel } from '@/platform';
```

`OPEN_SETTINGS` の分岐 (155-158 行目) を次にする:

```ts
          if (tab.id && tab.windowId) {
            openSettingsPanel(tab.windowId);
          }
```

`handleContextMenuClicked` の先頭 (174-181 行目) を次にする:

```ts
    /**
     * openSettingsPanel() must be called before any await in this handler,
     * otherwise the user gesture context is lost and the call is rejected
     */
    if (info.menuItemId === MENU_ITEMS.SETTINGS.id) {
      if (tab?.windowId) openSettingsPanel(tab.windowId);
      return;
    }
```

(Chrome ではこの経路でも `sidePanel.setOptions({ enabled: true })` が open の直前に呼ばれるようになる。閉じるボタンで無効化された後でも右クリックメニューから開ける方向の変化で、既存の popup 経路と同じ挙動)

- [ ] **Step 4: ServiceWorkerThemeService.initialize を置き換える**

`ServiceWorkerThemeService.ts` の import を次にする:

```ts
import { initThemeDetection } from '@/platform';
import { useThemeStore } from '@/stores/ThemeStore';
import { Message, MessageAction, MessageResponse } from '@/types';
import { logger } from '@/utils';
```

`initialize()` (11-32 行目) を次にする。`handleMessage` は Chrome の offscreen からの `COLOR_SCHEME_CHANGED` を受けるので変更しない:

```ts
  async initialize() {
    try {
      /** Chrome reports through the offscreen document (handleMessage); Firefox calls back directly */
      await initThemeDetection(isDarkMode => useThemeStore.getState().setDarkMode(isDarkMode));
    } catch (error) {
      logger.error('🧑‍🍳🎨', '[ServiceWorkerThemeService.tsx]', '[initialize]', 'Error in theme service initialization', error);
    }
  }
```

- [ ] **Step 5: platform の外に直接呼び出しが残っていないことを確認**

Run: `grep -rnE "chrome\.(sidePanel|offscreen)\." src --include='*.ts' --include='*.tsx'`
Expected: `src/platform/chrome.ts` の行のみ (`src/types/Chrome.d.ts` の namespace 宣言は `chrome.offscreen {` なのでヒットしない)

- [ ] **Step 6: 両ターゲットのビルドと lint**

Run: `pnpm build`
Run: `diff $BASELINE/manifest.json dist/prod/manifest.json`
Expected: 差分なし

Run: `pnpm build:firefox`
Run: `npx --yes web-ext@10.6.0 lint --source-dir dist/firefox-prod`
Expected: `errors 0`。エラーが出た場合は修正せずに作業を止め、内容を報告する (チェックポイント)。警告は件数と内容を記録して、Task 6 の報告に含める

- [ ] **Step 7: 静的チェックとテスト**

Run: `pnpm type-check`、`pnpm test`、`pnpm eslint-check`、`pnpm prettier-check`
Expected: すべて成功

- [ ] **Step 8: Commit**

```bash
git add src/features/popup/components/main/PopupMain.tsx src/features/options/components/main/OptionsMain.tsx src/pages/ServiceWorker.ts src/features/serviceworker/services/ServiceWorkerThemeService.ts
git commit -m "feat: route settings panel and theme detection through platform"
```

---

### Task 5: リリースの仕組み (Fastlane / GitHub Actions)

**Files:**
- Modify: `fastlane/Fastfile` (レーン 3 つを追加、`release` レーンに 2 行追加)
- Modify: `.github/workflows/release.yml` (workflow 名、Firefox ステップ 4 つを末尾に追加)

**Interfaces:**
- Consumes: `pnpm run build:firefox` (Task 2)
- Produces:
  - レーン `build_firefox` / `create_firefox_package` / `create_source_package`
  - 成果物名 `free-ai-summarizer-firefox-<version>.zip` / `free-ai-summarizer-source-<version>.zip`
  - GitHub secrets 名 `AMO_JWT_ISSUER` / `AMO_JWT_SECRET`

- [ ] **Step 1: Fastfile にレーンを追加**

`lane :create_package` の `end` (181 行目) の直後に追加する:

```ruby

desc "Build extension for Firefox"
lane :build_firefox do
  ensure_develop_branch
  sh("pnpm run build:firefox")
end

desc "Create Firefox extension package"
lane :create_firefox_package do
  ensure_develop_branch

  # Check if dist/firefox-prod directory exists
  unless File.directory?("../dist/firefox-prod")
    UI.user_error!("dist/firefox-prod directory not found. Please run build_firefox first.")
  end

  version = JSON.parse(File.read("../package.json"))["version"]
  zip_file_name = "free-ai-summarizer-firefox-#{version}.zip"

  sh("rm -f ../free-ai-summarizer-firefox-*.zip")

  Dir.chdir("../dist/firefox-prod") do
    sh("zip -r ../../#{zip_file_name} .", log: false)
  end
  UI.success("Successfully created #{zip_file_name}")
end

desc "Create source code package for AMO review"
lane :create_source_package do
  ensure_develop_branch

  # git archive only includes committed files, so warn about local changes
  unless sh("git status --porcelain", log: false).strip.empty?
    UI.important("Working tree has uncommitted changes. They are NOT included in the source package.")
  end

  version = JSON.parse(File.read("../package.json"))["version"]
  zip_file_name = "free-ai-summarizer-source-#{version}.zip"

  sh("rm -f ../free-ai-summarizer-source-*.zip")

  Dir.chdir("..") do
    sh("git archive --format=zip -o #{zip_file_name} HEAD")
  end
  UI.success("Successfully created #{zip_file_name}")
end
```

`lane :release` の `create_package` の直後 (236 行目の後) に追加する:

```ruby

  # Build and package for Firefox to catch Firefox-only build failures before tagging
  build_firefox
  create_firefox_package
```

- [ ] **Step 2: Fastfile の構文を確認**

Run: `ruby -c fastlane/Fastfile`
Expected: `Syntax OK`

- [ ] **Step 3: release.yml を更新**

1 行目を次にする:

```yaml
name: Release Extension
```

ファイル末尾 (「Check Chrome Web Store upload result」ステップの後) に追加する:

```yaml

      - name: Build Firefox extension
        id: firefox_build
        continue-on-error: true
        run: |
          pnpm run build:firefox

          cd dist/firefox-prod
          zip -r "../../free-ai-summarizer-firefox-${{ env.VERSION }}.zip" .
          cd ../..

          # Source package for AMO review (tag checkout, so the version matches)
          git archive --format=zip -o "free-ai-summarizer-source-${{ env.VERSION }}.zip" HEAD

          ls -la free-ai-summarizer-firefox-*.zip free-ai-summarizer-source-*.zip

      - name: Lint Firefox extension
        id: firefox_lint
        if: steps.firefox_build.outcome == 'success'
        continue-on-error: true
        run: npx --yes web-ext@10.6.0 lint --source-dir dist/firefox-prod

      - name: Upload to Firefox Add-ons
        id: amo_upload
        if: steps.firefox_build.outcome == 'success' && steps.firefox_lint.outcome == 'success'
        continue-on-error: true
        env:
          AMO_JWT_ISSUER: ${{ secrets.AMO_JWT_ISSUER }}
          AMO_JWT_SECRET: ${{ secrets.AMO_JWT_SECRET }}
        run: |
          # Secrets are registered after the first manual submission; skip until then
          if [ -z "$AMO_JWT_ISSUER" ] || [ -z "$AMO_JWT_SECRET" ]; then
            echo "::warning::AMO_JWT_ISSUER / AMO_JWT_SECRET are not set — skipping Firefox Add-ons submission"
            exit 0
          fi

          # Listed versions are signed only after AMO review, so do not wait for approval
          npx --yes web-ext@10.6.0 sign \
            --channel=listed \
            --source-dir dist/firefox-prod \
            --upload-source-code "free-ai-summarizer-source-${{ env.VERSION }}.zip" \
            --approval-timeout 0 \
            --api-key "$AMO_JWT_ISSUER" \
            --api-secret "$AMO_JWT_SECRET"

      - name: Check Firefox Add-ons upload result
        if: always()
        run: |
          # continue-on-error keeps the job green, so inspect each Firefox step outcome instead
          if [ "${{ steps.firefox_build.outcome }}" == "success" ] && [ "${{ steps.firefox_lint.outcome }}" == "success" ] && [ "${{ steps.amo_upload.outcome }}" == "success" ]; then
            echo "✅ Firefox Add-ons steps completed (check the upload step log for a skipped submission)"
          else
            echo "::warning::Firefox Add-ons submission failed — build: ${{ steps.firefox_build.outcome }}, lint: ${{ steps.firefox_lint.outcome }}, upload: ${{ steps.amo_upload.outcome }}"
            echo "  - 'Version already exists' means this version was already submitted to AMO"
            echo "  - Re-issue API keys at https://addons.mozilla.org/developers/addon/api/key/ and update AMO_JWT_ISSUER / AMO_JWT_SECRET"
          fi
```

- [ ] **Step 4: YAML の構文を確認**

Run: `ruby -ryaml -e 'YAML.load_file(".github/workflows/release.yml"); puts "YAML OK"'`
Expected: `YAML OK`

- [ ] **Step 5: CI の Firefox ステップをローカルで再現する**

Run: `pnpm run build:firefox`
Run: `git archive --format=zip -o /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/source-test.zip HEAD`
Run: `npx --yes web-ext@10.6.0 lint --source-dir dist/firefox-prod`
Expected: ビルド・アーカイブ成功、lint `errors 0`

(`web-ext sign` は AMO への外部提出になるため、ここでは実行しない)

- [ ] **Step 6: Commit**

```bash
git add fastlane/Fastfile .github/workflows/release.yml
git commit -m "ci: build and submit Firefox extension on release"
```

---

### Task 6: ドキュメントとビルドの決定性確認

**Files:**
- Modify: `README.md` (`### Building` の後に `### Firefox` 節を追加)
- Modify: `DIRECTORYSTRUCTURE.md`

**Interfaces:**
- Consumes: Task 2 のスクリプト名、Task 5 のレーン名・secret 名
- Produces: なし

- [ ] **Step 1: 本番ビルドが決定的であることを確認**

```bash
pnpm build:firefox
rm -rf /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/firefox-prod-1
cp -R dist/firefox-prod /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/firefox-prod-1
pnpm build:firefox
diff -r /private/tmp/claude-501/-Users-kojirof-Documents-Workspace-Projects-pj-github-AISummarizer-AISummarizer/61b47458-9f27-4282-948d-848a50f79a78/scratchpad/firefox-prod-1 dist/firefox-prod
```

(各コマンドは個別に実行する)
Expected: 差分なし。差分が出た場合は作業を止めて、差分のあるファイルを報告する (AMO 審査で再現性が求められるため、チェックポイント扱い)

- [ ] **Step 2: README に Firefox 節を追加**

`README.md` の `### Building` 節のコードブロックの後 (`## 🔒 Privacy` の前) に追加する:

````md
### Firefox

The same codebase also builds a Firefox (desktop) version. Browser-specific code lives in `src/platform/`.

```bash
# Development build for Firefox (watch mode, output: dist/firefox-dev)
pnpm dev:firefox

# Production build for Firefox (output: dist/firefox-prod)
pnpm build:firefox
```

To load the development build:

1. Open `about:debugging#/runtime/this-firefox` in Firefox
2. Click "Load Temporary Add-on..."
3. Select `dist/firefox-dev/manifest.json`

> **Private tabs:** the "New private tab" option only works after allowing the extension in private windows: `about:addons` → Free AI Summarizer → "Run in Private Windows" → Allow.

#### Building for Firefox (AMO reviewers)

The submitted package is built from this repository with webpack. To reproduce it:

1. Install Node.js 20 and pnpm (the exact pnpm version is pinned in the `packageManager` field of `package.json`; `corepack enable` picks it up)
2. Run `pnpm install --frozen-lockfile`
3. Run `pnpm build:firefox`
4. The build output is in `dist/firefox-prod`

#### Releasing to Firefox Add-ons (AMO)

`.github/workflows/release.yml` submits each release to AMO when a `v*.*.*` tag is pushed. The first submission is manual:

1. Create a developer account on [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. On `develop`, run `bundle exec fastlane build_firefox`, `bundle exec fastlane create_firefox_package`, and `bundle exec fastlane create_source_package`
3. In the AMO Developer Hub, submit `free-ai-summarizer-firefox-<version>.zip` as a new add-on ("On this site"), upload `free-ai-summarizer-source-<version>.zip` as the source code, and fill in the listing (description, screenshots, categories, privacy policy)
4. Generate API credentials at <https://addons.mozilla.org/developers/addon/api/key/>
5. Add them to the GitHub repository secrets as `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`

Until the secrets are set, the workflow skips the AMO submission with a warning. AMO rejects re-uploads of an existing version, so re-releasing the same version only fails the Firefox steps; the Chrome release is unaffected.
````

- [ ] **Step 3: DIRECTORYSTRUCTURE.md を更新**

ツリーの `│   ├── pages/ ...` ブロック (`ServiceWorker.ts` の行) の直後に追加する:

```
│   ├── platform/                 # Browser-specific implementations (Chrome / Firefox)
```

ツリーの `├── public/` の直前に追加する:

```
├── build/                        # Build-time scripts (manifest transforms)
```

ツリーの `├── dist/                         # Output directory` を次にする:

```
├── dist/                         # Output directory (dev/prod: Chrome, firefox-dev/firefox-prod: Firefox)
```

「Source Code (`src/`)」の説明リストの `- `pages/`: Page implementations` ブロックの後に追加する:

```
- `platform/`: Browser-specific implementations selected at build time by `__TARGET__` (settings panel, theme detection)
```

「Build and Dependencies」の説明リストの先頭に追加する:

```
- `build/`: Build-time scripts used by webpack (manifest transforms for development and Firefox builds)
```

同リストの `- `dist/`: Compiled output files` を次にする:

```
- `dist/`: Compiled output files (`dev` / `prod` for Chrome, `firefox-dev` / `firefox-prod` for Firefox)
```

- [ ] **Step 4: Commit**

```bash
git add README.md DIRECTORYSTRUCTURE.md
git commit -m "docs: document Firefox build and AMO release"
```

---

### Task 7: 最終確認と手動確認の依頼 (チェックポイント②)

**Files:** なし (確認のみ)

- [ ] **Step 1: 全体の静的チェックとテスト**

Run: `pnpm type-check`、`pnpm test`、`pnpm eslint-check`、`pnpm prettier-check`
Expected: すべて成功

- [ ] **Step 2: 手動確認用に両ターゲットの dev ビルドを作る**

Run: `NODE_ENV=development node --loader ts-node/esm node_modules/webpack/bin/webpack.js --config webpack.config.ts --mode=development`
Run: `TARGET=firefox NODE_ENV=development node --loader ts-node/esm node_modules/webpack/bin/webpack.js --config webpack.config.ts --mode=development`
Expected: `dist/dev` と `dist/firefox-dev` が作られる (watch なしの 1 回ビルド)

- [ ] **Step 3: ユーザーに手動確認を依頼する (ここで停止)**

以下のチェックリストを提示し、結果の報告を待つ。PDF・注入の不具合が報告された場合は、spec の「既知のリスク」に従って対応方針を相談する (チェックポイント③)。

Firefox (`about:debugging` から `dist/firefox-dev/manifest.json` を一時読み込み。普段のプロファイルならログイン状態を使える):

1. インストール直後にサイドバーが自動で開かないこと。任意の記事ページで content script が動作すること (自動抽出のトーストなど)
2. 記事抽出: Web 記事 / YouTube 字幕 / PDF
3. 注入: ChatGPT / Claude / Gemini / AI Studio / Grok / Perplexity / DeepSeek / Kimi / Qwen
4. 右クリックメニュー、popup、sidebar の開閉 (popup の Settings / 右クリックメニューの Settings / 設定画面の閉じるボタン)
5. OS のダーク/ライト切り替えがツールバーアイコンと UI に反映されること
6. バッジ、タブの開き方 (現在のタブ / 新しいタブ / プライベートタブ)、クリップボードへのコピー

Chrome (`chrome://extensions` で `dist/dev` を再読み込み):

1. popup の Settings と右クリックメニューの Settings でサイドパネルが開き、閉じるボタンで閉じること
2. OS のテーマ切り替えが反映されること
3. 1 サービス以上で、抽出から注入までの一連の流れが動くこと
