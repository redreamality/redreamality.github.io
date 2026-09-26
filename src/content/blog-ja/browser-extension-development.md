---
title: 'ブラウザ拡張機能開発ガイド'
pubDate: 2024-03-11T00:00:00.000Z
description: '本記事では、WXTツールチェーンの使用方法と開発フローを含む、モダンツールを使用したブラウザ拡張機能の開発方法を紹介します。'
author: 'Remy'
tags: ['ブラウザ拡張', 'フロントエンド開発', 'wxt', 'チュートリアル']
lang: 'ja'
translatedFrom: 'browser-extension-development'
---

## ブラウザ拡張機能とは

ブラウザ拡張機能は、ブラウザにインストールして機能を追加したり、Web ページの表示を変更したりするソフトウェアです。パスワード管理、ページ翻訳、あとで読むための保存ツールなどが例に挙げられます。通常の Web サイトと違い、許可された範囲で拡張機能 API を呼び出せます。コンテンツスクリプトは対象サイト内でも動作します。ただし、アクセス権限があることはデータ収集の理由にはなりません。機能の目的、アクセス範囲、データの送信先は別々に説明する必要があります。

既存の拡張機能を使いたいだけなら、ブラウザのストアで発行者、権限、プライバシー情報を確認してインストールすればよく、開発環境は不要です。自分で開発する場合は、以下で [WXT](https://wxt.dev/guide/installation) を使用します。WXT はエントリーポイントの検出、manifest の生成、ビルドを担当します。権限の付与、スクリプトの実行、バックグラウンドの寿命を管理するのはブラウザです。

## サンプルの範囲とバージョン

作成するのは `https://example.com/*` のリンクだけを強調表示する拡張機能です。ツールバーの popup でスイッチを保存し、対象ページを再読み込みすると content script が background に設定を問い合わせ、スタイルを追加するか判断します。無効化した場合も再読み込みが必要です。すべてのタブの監視、ネットワークへの送信、アカウントや秘密情報の処理、既に開いているページの即時更新は行いません。

2026-09-25 UTC の見直しでは **WXT 0.21.4**、**Vite 6.3.6**、**TypeScript 5.9.3** を固定しています。公開済み WXT パッケージは **Node >=22** を要求します。選択した Vite 側の Node 要件も満たす必要があります。検証環境は Windows、**Node 26.7.0**、**pnpm 10.28.2** でした。これは再現条件であり、すべてのプロジェクトへの Node メジャーバージョンの推奨ではありません。[アップグレードガイド](https://wxt.dev/guide/resources/upgrading)で依存関係の要件を確認できます。

WXT 0.21 では Vite が必須の peer dependency になったため、直接依存として宣言します。TypeScript はビルドとは別の型検査に使用します。ブラウザを自動起動する `web-ext` は任意依存で、この例ではインストールせず手動で読み込みます。自動でブラウザが開かないことはビルド失敗を意味しません。逆に、ビルド成功の表示も拡張機能が実行された証拠ではありません。

既存リポジトリの外に空の `link-marker` ディレクトリを作成し、以下の全ファイルを配置してください。テンプレートや依存範囲の変化を避けるため `@latest init` は使用しません。初回インストールで生成される `pnpm-lock.yaml` は再現のために保持します。直接依存の固定だけでは、推移的な依存すべてを固定できません。

```text
link-marker/
  package.json
  tsconfig.json
  wxt.config.ts
  entrypoints/
    background.ts
    content.ts
    popup/
      index.html
      main.ts
```

### package.json

以下がファイル全体です。`build:chrome` などはここで定義する scripts 名であり、WXT が自動で提供する pnpm コマンドではありません。`private` は npm への誤公開を防ぎますが、拡張機能のビルドは妨げません。全ファイルを作成してからインストールと検査を実行します。

```json
{
  "name": "link-marker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.28.2",
  "scripts": {
    "dev": "wxt",
    "typecheck": "wxt prepare && tsc --noEmit",
    "build": "wxt build -b chrome",
    "build:chrome": "wxt build -b chrome",
    "build:firefox": "wxt build -b firefox",
    "build:safari": "wxt build -b safari"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "vite": "6.3.6",
    "wxt": "0.21.4"
  }
}
```

### tsconfig.json

WXT の prepare が `.wxt/tsconfig.json` と import 宣言を生成し、プロジェクト側はそれを継承します。生成ファイルを手修正したり、エラーを消すために厳密な型検査を無効にしたりしないでください。最初にエディターが継承先を見つけられなくても、インストール後の typecheck で生成できます。

```json
{
  "extends": "./.wxt/tsconfig.json"
}
```

### wxt.config.ts

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Link Marker',
    description: 'Highlight links on example.com after a page reload.',
    permissions: ['storage'],
  },
  zip: {
    includeSources: [
      'entrypoints/**',
      'package.json',
      'pnpm-lock.yaml',
      'tsconfig.json',
      'wxt.config.ts',
    ],
  },
});
```

ここで指定する権限は `storage` だけです。サイトへのアクセス範囲は後述の `matches` で指定されており、権限の考慮が不要になったわけではありません。タブの検索や動的なスクリプト注入を行わないため、`tabs`、`activeTab`、`scripting` は追加しません。後からクリック時の注入機能を追加するなら、その時点で権限設計を見直します。

## Popup と設定の永続化

[エントリーポイントの説明](https://wxt.dev/guide/essentials/entrypoints)に従い、popup をディレクトリ形式にします。HTML は `entrypoints/popup/index.html`、補助スクリプトは同じディレクトリに置きます。入口として検出される `entrypoints/` 直下に補助用の `popup.ts` を置かないでください。HTML の相対パスも実際の配置と一致させます。

### entrypoints/popup/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Link Marker</title>
  </head>
  <body>
    <h1>Link Marker</h1>
    <label>
      <input id="enabled" type="checkbox" disabled />
      Highlight example.com links
    </label>
    <button id="save" type="button" disabled>Save</button>
    <p id="status" role="status">Loading...</p>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

### entrypoints/popup/main.ts

```typescript
import { storage } from '#imports';

const checkbox = document.querySelector<HTMLInputElement>('#enabled');
const save = document.querySelector<HTMLButtonElement>('#save');
const status = document.querySelector<HTMLParagraphElement>('#status');
if (!checkbox || !save || !status) {
  throw new Error('Popup markup is incomplete');
}
const ui = { checkbox, save, status };

async function load() {
  try {
    const enabled = await storage.getItem<boolean>('local:enabled', {
      fallback: false,
    });
    ui.checkbox.checked = enabled === true;
    ui.checkbox.disabled = false;
    ui.save.disabled = false;
    ui.status.textContent = 'Ready';
  } catch (error) {
    ui.status.textContent = 'Could not load settings. Reopen the popup.';
    console.error(error);
  }
}

ui.save.addEventListener('click', async () => {
  ui.save.disabled = true;
  ui.checkbox.disabled = true;
  try {
    await storage.setItem('local:enabled', ui.checkbox.checked);
    ui.status.textContent = 'Saved. Reload example.com to apply.';
  } catch (error) {
    ui.status.textContent = 'Save failed. Please try again.';
    console.error(error);
  } finally {
    ui.save.disabled = false;
    ui.checkbox.disabled = false;
  }
});

void load();
```

`#imports` は WXT が生成する import 入口です。以前の `wxt/storage` はこのバージョンの基準には適しません。`getItem` の第 2 引数は options オブジェクトなので、既定値は `false` ではなく `{ fallback: false }` と指定します。`local:` は拡張機能のローカル保存領域、`enabled` はキーです。Web ページの `localStorage` とは別物です。[Storage の文書](https://wxt.dev/storage)で名前空間と既定値を確認できます。

読み込みに失敗した場合は操作を無効のままにし、初期状態の UI が既存設定を上書きしないようにします。保存中も二つの操作を無効にして重複送信を避けます。成功表示は書き込みの完了だけを意味し、ページの再読み込みを明示します。型引数は保存済みデータの実行時検証にはならないため、`enabled === true` でも確認しています。将来オブジェクト形式へ変更する場合は構造検証と移行が必要です。

popup を閉じるとページは破棄されるので、継続的な処理の担当にはできません。開くたびに storage から復元します。また、設定の調査では関連するキーだけを削除し、将来の別設定まで失う全削除ボタンは設けません。

## Background とコンテンツスクリプト

通信はブラウザ標準の `runtime.sendMessage` と `runtime.onMessage` を使用します。WXT 内蔵の messaging wrapper ではありません。[WXT の通信ガイド](https://wxt.dev/guide/essentials/messaging)には標準 API と任意のライブラリが紹介されています。この例は設定を読む一種類の要求だけなので、追加ライブラリも外部拡張機能向けの受信処理も導入しません。

### entrypoints/background.ts

```typescript
import { browser, defineBackground, storage } from '#imports';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (
      sender.id !== browser.runtime.id ||
      typeof message !== 'object' ||
      message === null ||
      !('type' in message) ||
      message.type !== 'GET_ENABLED'
    ) {
      return;
    }

    storage.getItem<boolean>('local:enabled', { fallback: false }).then(
      (enabled) => sendResponse({ ok: true, enabled: enabled === true }),
      () => sendResponse({ ok: false }),
    );
    return true;
  });
});
```

リスナーは `defineBackground` のコールバック内で同期的に登録します。storage の読み込みは非同期なので、リスナーからリテラルの `true` を返して応答経路を保持し、後から `sendResponse` を呼び出します。リスナー全体を安易に `async` に変更しないでください。Promise の戻り値への対応は対象ブラウザとバージョンごとに確認が必要です。ここでは [MDN に記載された非同期コールバック応答](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)を使用しています。

background は設定のコピーをメモリに保持せず、要求ごとに永続化データを読みます。Chrome MV3 の service worker が停止して再起動する場合にも対応しやすい設計です。小さな設定に未検証のキャッシュを追加する必要はありません。要求頻度が増えたら実測してキャッシュと無効化を検討しますが、どちらが常に高速だとは主張しません。

### entrypoints/content.ts

```typescript
import { browser, defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['https://example.com/*'],
  async main(ctx) {
    try {
      const response: unknown = await browser.runtime.sendMessage({
        type: 'GET_ENABLED',
      });
      if (
        typeof response !== 'object' ||
        response === null ||
        !('ok' in response) ||
        response.ok !== true ||
        !('enabled' in response) ||
        typeof response.enabled !== 'boolean'
      ) {
        throw new Error('Invalid settings response');
      }
      if (!response.enabled || ctx.isInvalid) return;

      const style = document.createElement('style');
      style.textContent = `
        html.link-marker-enabled a[href] {
          background-color: #fff19c !important;
          color: #171717 !important;
          outline: 2px solid #8a5700 !important;
        }
      `;
      document.documentElement.append(style);
      document.documentElement.classList.add('link-marker-enabled');
      ctx.onInvalidated(() => {
        style.remove();
        document.documentElement.classList.remove('link-marker-enabled');
      });
    } catch (error) {
      console.error('Link Marker could not read settings:', error);
    }
  },
});
```

DOM 操作は `main` 内に置き、トップレベルには imports と入口の定義だけを残します。WXT がビルド中に入口設定を読む時点では、Web ページの `document` はありません。非同期応答後には context がまだ有効か確認し、無効化時には追加したスタイルと class を削除します。これは開発時の重複表示を防ぐ処理であり、ブラウザを閉じる際に必ず実行される永続化フックではありません。

リンクの inline style を個別に上書きせず、自分の class に限定したスタイルを追加するため、元の色を推測して復元する必要がありません。後から追加されたリンクにも CSS は一致できますが、複雑なサイト、iframe、Shadow DOM、強制カラー表示は検証していません。単純なページの選択は実験条件を減らすためで、すべてのサイトへの適合性を示すものではありません。

## インストール、型検査、ビルド

既存サイトのルートではなく `link-marker` 内で実行します。初回はロックファイルを生成し、その後の再現では空のコピー先で `pnpm install --frozen-lockfile` を使用します。依存パッケージのインストールスクリプトが保留されたら、パッケージ名と配布元を確認し、すべてを無条件で許可しないでください。

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm build:firefox
pnpm build:safari
```

`typecheck` は WXT の型を生成して `tsc --noEmit` を実行し、ビルドはコードを変換してまとめます。誤った storage 引数でも JavaScript として変換できる場合があるため、出力ができたことは API 契約を満たす証明ではありません。型検査を省略せず、新しいビルドが失敗した後に古い出力を確認して成功と判断しないようにします。

この例は manifest バージョンを上書きしていません。[WXT の対象指定](https://wxt.dev/guide/essentials/target-different-browsers)では、Chrome は `.output/chrome-mv3`、Firefox と Safari は `.output/firefox-mv2`、`.output/safari-mv2` が既定です。別の対象で MV3 が必要なら明示的に指定し、検査を繰り返します。ディレクトリ名は交換可能なラベルではなく、ソースの共有も全ブラウザ共通の配布物を意味しません。

各 `manifest.json` を確認し、popup が生成 HTML を参照していること、content script が対象ドメインだけに一致すること、storage 権限があることを確かめます。Chrome の background は service worker、Firefox MV2 は対応するバックグラウンドスクリプト設定になります。出力を手修正しても次のビルドで上書きされるため、元の設定を修正してください。

## ブラウザ内での再現実験

Chrome では `chrome://extensions/` を開き、デベロッパーモードで「パッケージ化されていない拡張機能を読み込む」から `.output/chrome-mv3` を選択します。Firefox は `about:debugging` の「This Firefox」から「Load Temporary Add-on」を選び、`.output/firefox-mv2/manifest.json` ファイルを指定します。

以下は読者が実行する受け入れ手順です。本記事の見直しで実行済みという意味ではありません。

1. 新しいテスト用プロファイルで読み込み、popup のスイッチが既定で無効になっていることを確認します。
2. 対象ページで強調表示がないことを確認し、有効化して保存します。Saved 表示を待ち、popup を閉じて開き直し、状態が復元されるか確認します。
3. 対象ページを再読み込みして表示を確認します。その後無効化して保存し、再読み込みすると強調表示が消えるか確認します。
4. 別ドメインでは注入されないことを確認します。ブラウザ内部ページや拡張機能ストアは通常のテストサイトの代わりにはなりません。
5. 拡張機能自体を再読み込みした後は、既存の対象ページも再読み込みします。古い content script の context が無効な場合、popup の開き直しだけでは不十分です。

新規プロファイルは空の保存領域を使う実験を再現可能にします。設定だけをリセットするなら、拡張機能の context で `local:enabled` を削除します。対象サイトの保存領域を消しても拡張機能の設定はリセットされません。popup の開発ツール、background の検査画面、対象ページのコンソールは別の実行箇所を観察している点にも注意してください。

受信側がない場合を調べるには、別の実験用コピーで background 入口を一時的に外し、再ビルド、拡張機能の再読み込み、ページの更新を行います。成功として処理せず、通信エラーを記録することが期待されます。入口を戻した後に型検査とビルドを繰り返します。この故障注入は配布版には含めません。

## 権限と問題の切り分け

`matches` はサイトアクセス設計の一部です。明示的な `host_permissions` がなくてもサイトへの権限が不要なわけではありません。ユーザーがブラウザ側でサイトアクセスを制限すると、注入されない場合もあります。全サイトへ拡大するならデータ用途と権限表示を見直します。動作しないからといって `<all_urls>` を追加するのは適切な既定の修正ではありません。

ローカル保存は秘密情報の保管庫でも、端末間同期の保証でもありません。長期利用するサーバーの認証情報を保存しないでください。将来サーバーへ接続する場合は秘密をサーバー側で管理し、送信するデータを説明します。この例は本文を読んだりリンクを送信したりしませんが、収集機能の追加後にはプライバシー説明も変更が必要です。

| 症状 | 最初に確認するもの | 避けたい対応 |
| --- | --- | --- |
| `#imports` を解決できない | このディレクトリでの typecheck と `.wxt` の生成 | 古い `wxt/storage` に戻す |
| popup がない | 配置、相対パス、出力の action 設定 | 直下に任意の `popup.ts` を追加する |
| 保存しても表示が変わらない | 保存完了、ページ更新、URL、サイトアクセス | すべてのホスト権限を要求する |
| メッセージの受信側がない | background のエラー、再読み込み、古い context | catch を削除して成功扱いにする |
| 型検査は通るが読み込めない | manifest バージョン、出力先、ブラウザのエラー | 型検査を互換性試験と考える |

後から tabs 検索を追加する場合は、空配列や `id` の欠如を確認してから参照します。型を紹介するためだけに無関係な `tabs[0].id` の例を追加しません。小さな機能範囲なら、各権限を実際に必要とするコードに対応付けられます。

## 機能を増やす前の三つの実験

まず設定の共有範囲を確認します。対象ページを二つのタブで開き、popup で有効化して保存し、最初のタブだけを更新します。最初のページだけが強調され、二つ目は変わらないことが期待されます。二つ目も更新すると同じ設定を読みます。保存データは拡張機能に属し、スタイルは各ページに属します。サイト別やタブ別のスイッチが必要なら、全体で一つの真偽値とは異なるデータモデルが必要です。

次に永続化と background の寿命を確認します。有効化して保存し、popup を閉じ、Chrome の管理画面で background を観察します。停止を待つか利用可能なデバッグ操作で停止させ、その後ページを更新します。要求によって background が再開し、保存値を読むことが期待されます。検査画面を開き続けた結果から service worker が停止しないと判断しないでください。デバッグ状態は観察に影響します。ここでは停止時間を測定しておらず、復帰試験の成功も主張しません。

最後に別コピーで不正な応答を試します。background が返す `enabled` を一時的に文字列へ変更して再ビルドし、読み込み直します。content script が応答を拒否し、エラーを記録してスタイルを追加しないことを確認します。その後真偽値に戻して正常系を確認します。型引数や型アサーションでは、別 context から届いた文字列を実行時に検証・変換できません。この実験は通信の成功と内容の妥当性を分けるもので、追加権限や外部サービスは不要です。

各実験でブラウザのバージョン、読み込んだディレクトリ、操作順、期待値、実際の結果を記録します。一つ目なら保存キーとページ更新、二つ目ならリスナー登録と background エラー、三つ目なら応答検証を調べます。保存、権限、メッセージを一度に変更すると、何が修正に寄与したか分からなくなります。

スクリーンショットにも操作順が必要です。一枚の強調表示だけでは、保存、background の復帰、別ドメインで注入されないことは証明できません。初期画面、保存後に設定を開き直した画面、更新後の強調表示、無効化後の復元を別々に記録し、読み込んだ出力先を明記します。一回の試験で開発版と本番版を混在させないでください。表示が同じでも別の検査対象です。

即時更新を追加するなら、既存ページへ誰が通知するか、受信側がない場合や保存成功後の通知失敗をどう扱うか決めます。storage の購読を使う方法でも、context の寿命に合わせた解除が必要です。この例は意図的にページ更新を境界にしています。自動更新を加える場合は案内文だけでなく、実行時テストも変更してください。

## Safari とストア公開の境界

Safari ではリソースのビルドと Apple のパッケージ作成を分けます。必要なツールチェーンがある macOS では次のコマンドを使用できます。

```bash
pnpm build:safari
xcrun safari-web-extension-packager .output/safari-mv2
```

渡すのは TypeScript のソースではなく生成ディレクトリです。アプリのコンテナ、識別子、署名、実機試験は別途必要で、選んだ手順に応じて [Apple の説明](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)を確認します。[App Store Connect での Web ベースのパッケージ作成と配布](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)も提供されています。そのため、すべての公開方法で手元の Mac と Xcode が必須とはいえません。各方法には資格と提出要件があります。

[WXT の公開ガイド](https://wxt.dev/guide/essentials/publishing)では、Safari のネイティブアプリを生成せず、Safari への公開も自動化しないと明示されています。Windows で Safari 用の出力を生成できても、Safari 内での動作や審査通過を証明したことにはなりません。

Chrome と Firefox の提出用 ZIP は次のように生成します。

```bash
pnpm exec wxt zip -b chrome
pnpm exec wxt zip -b firefox
```

ビルドで変換を行う Firefox プロジェクトでは、再ビルド可能なソースも必要です。設定では sources ZIP の許可リストを明示しています。提出前に展開し、入口、設定、ロックファイルを確認して、別の空ディレクトリで再インストールとビルドを行います。WXT 0.21 は `includeSources` を通常の許可リスト動作に変更したため、古い除外ルールのコピーだけでは完全性を判断できません。

今回の Firefox ビルドでは、データ収集の宣言と拡張機能 ID に関する警告も出ました。リソース生成は止まりませんが、公開時の対応は必要です。[Mozilla のデータ同意の説明](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)に従い、実際の機能に合った宣言と公開方法に合った自分の ID を設定します。警告の非表示は宣言の代わりにはならず、例示用の ID を製品の恒久的な識別子として使うべきでもありません。

ソース再ビルドでは、元の `.wxt` や `node_modules` を借用せず、展開したファイルだけを使用します。それらがないことを確認してからロックファイルでインストールし、型検査と対象ビルドを実行します。manifest のバージョン、権限、入口、対象パターンを比較します。hash 付きファイル名の違いだけで動作差とは判断できず、総バイト数が同じだけでも同一とは証明できません。

ストア素材と本番用のバージョン管理方針はこの最小例に含みません。公開前には、更新時の設定保持、キー改名時の移行、権限削除時の機能縮小を決めます。旧データを残したプロファイルに新版を読み込み、設定の復元を記録してください。これは初回インストールの空ストレージ試験とは別です。

ソース ZIP に `.env` の秘密、認証設定、非公開レジストリのトークン、個人ファイルを入れないでください。開発者アカウント、掲載文、アイコン、プライバシー情報、審査、更新方針も build コマンドでは完了しません。API 対応、パッケージ作成、ストア受理はそれぞれ別の確認項目です。

本記事の検証範囲は、完全なコードをリポジトリ外の一時プロジェクトへ抽出した後の依存インストール、型検査、リソースビルドです。ブラウザへの読み込み、上記の実行時実験、Safari のネイティブパッケージ作成と署名、ストア提出は実施していません。[フレームワーク比較](/ja/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)では過去の見解と現行バージョンの機能を区別しています。

![以前の WXT 開発画面。今回の実行時検証の証拠ではありません](/assets/browser-extension-development/chrome_2025-03-11_18-27-41.png)
