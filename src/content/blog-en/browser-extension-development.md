---
title: 'What Is a Browser Extension? Build Your First One with WXT'
pubDate: 2024-03-11T00:00:00.000Z
description: 'Learn what browser extensions do, how popups and content scripts work, and how to start building an extension with WXT, TypeScript and pnpm.'
author: 'Remy'
tags: ['browser-extension', 'frontend-development', 'wxt', 'tutorial', 'web-development']
---

## What Is a Browser Extension?

A browser extension is software installed in a web browser to add features or change how websites behave. Password managers, page translators, and read-it-later tools are familiar examples. Unlike an ordinary website, an extension can call browser extension APIs within its granted permissions. A content script can also work on matching websites. Permission to access something is not a reason to collect it: the feature, access scope, and destination of any data need separate explanations.

## Using an Extension or Building One?

To use an existing extension, install it from your browser's store and review its publisher, permissions, and privacy information. You do not need a development environment. To build one, the rest of this guide uses [WXT](https://wxt.dev/guide/installation), a framework that discovers entrypoints, generates a manifest, and organizes builds. The browser still controls permissions, script execution, and the background lifecycle. Build tooling does not replace those controls.

## Example Scope and Versions

Our extension highlights links only on `https://example.com/*`. Its toolbar popup saves a switch. After a page reload, the content script asks the background for that setting and decides whether to add a stylesheet. Turning highlighting off also requires a reload. This example does not watch every tab, send network requests, handle accounts or secrets, or promise immediate updates to pages that are already open.

The **2026-09-25 UTC** revision uses **WXT 0.21.4**, **Vite 6.3.6**, and **TypeScript 5.9.3**. The published WXT package requires **Node >=22**; the chosen Vite version must also support your Node version. The validation environment was Windows, **Node 26.7.0**, and **pnpm 10.28.2**. These are reproduction details, not a recommendation that every project adopt the same Node major. The [upgrade guide](https://wxt.dev/guide/resources/upgrading) explains the dependency requirements.

WXT 0.21 makes Vite a required peer dependency, so this project declares it directly. TypeScript supplies a separate checking step. The optional `web-ext` dependency enables automatic browser opening; we do not install it and will load the extension manually. A browser that does not open automatically is not evidence of a failed build. Conversely, a successful terminal build is not evidence that an extension has executed.

Create an empty `link-marker` directory outside any existing repository and create every file below. We do not use `@latest init`, because scaffolding templates and dependency ranges can change independently of an article. The first installation creates `pnpm-lock.yaml`; retain it for reproduction. Exact direct dependencies alone do not freeze all transitive dependencies.

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

This is the complete file. Script names such as `build:chrome` are defined here; they are not pnpm commands automatically supplied by WXT. `private` prevents accidental npm publication without preventing extension builds. Finish creating the files before installing dependencies or running checks.

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

WXT's prepare command generates `.wxt/tsconfig.json` and import declarations. Our project extends that generated configuration. Do not manually edit generated files or disable strict checking to dismiss an error. If the editor initially cannot find the extended file, run the typecheck command after installation.

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

The only permission listed here is `storage`. Site access comes from the content script's `matches` declaration below; it has not disappeared from the permission model. The example does not query tabs or inject scripts programmatically, so it does not request `tabs`, `activeTab`, or `scripting`. Adding click-to-inject behavior later would require a new permission design, not a collection of permissions copied from unrelated tutorials.

## Popup and Persistent Settings

The [entrypoint guide](https://wxt.dev/guide/essentials/entrypoints) supports a directory entrypoint for a popup. Put the HTML in `entrypoints/popup/index.html` and keep its helper script alongside it. Do not place a helper named `popup.ts` at the top of `entrypoints/`, where files are discovered as entrypoints. The HTML's relative script path must match the actual file layout.

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

`#imports` is WXT's generated import entrypoint. The older `wxt/storage` path is not appropriate for this version baseline. The second argument to `getItem` is an options object, so a default value is expressed as `{ fallback: false }`, not a bare `false`. The `local:` prefix selects extension-local storage, and `enabled` is the key. This is not the website's `localStorage`. The [storage documentation](https://wxt.dev/storage) explains namespaces and defaults.

If loading fails, controls stay disabled so an uninitialized interface cannot overwrite existing settings. Both controls are also disabled during a save, preventing overlapping submissions. The success message means the write completed, and explicitly asks for a page reload. A generic type checks code at compile time; it does not validate previously stored data. The strict `enabled === true` check handles that distinction for this boolean. A future object-shaped setting would need validation and migration.

Closing the popup destroys its page, so it cannot own a continuous task. Each opening restores data from storage rather than trusting a previous JavaScript variable. We also avoid a button that clears all extension storage: troubleshooting this setting should remove only its own key, not future unrelated preferences.

## Background and Content Script

Messaging uses the browser's native `runtime.sendMessage` and `runtime.onMessage` APIs, not a built-in WXT messaging wrapper. [WXT's messaging guide](https://wxt.dev/guide/essentials/messaging) describes native APIs and optional libraries. One request to read a setting does not need an additional library. This example also does not register a listener for messages from external extensions.

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

The listener is registered synchronously inside `defineBackground`. Reading storage is asynchronous, so the listener returns the literal `true` to keep the response channel open and calls `sendResponse` later. Do not casually make the whole listener `async`: Promise-return support needs checking for the browser versions you support. This example uses the asynchronous callback-response pattern documented by [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage).

The background does not keep an in-memory copy of the switch. Each request reads durable storage, which also accommodates a Chrome MV3 service worker stopping and restarting. For a small setting, reading on demand avoids an untested cache. If request frequency later becomes significant, measure it before designing caching and invalidation. This tutorial makes no claim that either strategy is universally faster.

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

Runtime DOM operations belong in `main`; only imports and the entrypoint definition are at module scope. WXT reads entrypoint configuration during a build, when a web page's `document` is not available. After the asynchronous response arrives, the code checks whether the context is still valid. Its cleanup callback removes the stylesheet and class it added, avoiding duplicate effects during development invalidation. This callback is not a persistence hook guaranteed to run whenever a browser closes.

The stylesheet is scoped to our class rather than overwriting each link's inline styles, so restoring the page does not require guessing its original colors. CSS can match links added later, but this example has not validated complex websites, iframes, Shadow DOM, or forced-colors mode. A simple target page limits experimental variables; it does not establish universal selector compatibility.

## Install, Typecheck, and Build

Run these commands inside `link-marker`, not at the root of an existing website project. The first installation may create a lockfile. For subsequent reproduction, use `pnpm install --frozen-lockfile` in a clean copy to verify that the dependency graph can be restored. If pnpm reports blocked dependency installation scripts, inspect the named packages and their sources rather than approving everything without review.

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm build:firefox
pnpm build:safari
```

`typecheck` generates WXT types and then runs `tsc --noEmit`; building transforms and bundles the code. These are different checks. An invalid storage argument might still become valid JavaScript in a bundle without meeting the API contract. Do not skip type checking because an output directory exists, and do not inspect stale output from a previous successful build after a new build fails.

We do not override manifest versions. Under [WXT's target rules](https://wxt.dev/guide/essentials/target-different-browsers), Chrome defaults to `.output/chrome-mv3`, while Firefox and Safari default to `.output/firefox-mv2` and `.output/safari-mv2`. To target MV3 elsewhere, select it explicitly and repeat the checks. Directory suffixes describe actual targets, not interchangeable labels. Shared source code does not produce one universal browser package.

Inspect each generated `manifest.json`. The popup should reference generated HTML, the content script should match only the selected domain, and permissions should include storage. Chrome should have a background service worker; Firefox MV2 uses its corresponding background-script configuration. Fix source configuration rather than manually patching generated manifests, because another build will overwrite them.

## Reproduce the Browser Behavior

In Chrome, open `chrome://extensions/`, enable Developer mode, choose Load unpacked, and select `.output/chrome-mv3`. In Firefox, open `about:debugging`, enter This Firefox, choose Load Temporary Add-on, and select `.output/firefox-mv2/manifest.json`. Selecting the manifest file is more precise than simply telling a reader to choose an output directory.

The following is a runtime acceptance procedure for readers, not a claim that it was executed for this revision:

1. Load the extension in a new test profile, open the popup, and confirm the switch starts off.
2. Open the target page and confirm links are unchanged. Enable highlighting, save, wait for the Saved message, then close and reopen the popup to check persistence.
3. Reload the target page and inspect the link styles. Disable highlighting, save, and reload again to check that the styles disappear.
4. Open a different domain and confirm this content script does not inject. Browser-internal pages and extension-store pages are not substitutes for a normal test website.
5. After reloading the extension itself, reload previously open target pages before checking again. Their old content-script contexts may be invalid; reopening only the popup is insufficient.

A fresh profile makes the missing-storage test repeatable. To reset only this example, remove `local:enabled` from extension storage in an extension context. Clearing the target website's storage does not reset extension storage. Keep the three debugging contexts separate: popup DevTools, the extension background inspector, and content-script messages in the target page's console reveal different parts of the workflow.

To investigate a missing receiver, temporarily remove the background entrypoint in a separate experimental copy. Rebuild, reload the extension, and refresh the target page. The request should produce a messaging error rather than silently succeeding. Restore the background and repeat type checking and building afterward. This fault injection is a diagnostic exercise, not a change to include in a release package.

## Permissions and Troubleshooting

The `matches` declaration is part of site-access design. An absent explicit `host_permissions` field does not mean the extension never requests access to a website. Browsers can also let users withhold access to particular sites, preventing injection. Expanding to every website requires another review of data use and permission prompts. `<all_urls>` is not an appropriate default repair for a script that did not run.

Extension-local storage is neither a secret vault nor a promise of cross-device synchronization. Do not place a long-lived server credential there. If the extension later contacts a server, keep secrets on the server and explain exactly what data is transmitted. This example does not read article text or upload links, but a future data-collection feature would require revisiting that privacy description.

| Symptom | Check first | Avoid this shortcut |
| --- | --- | --- |
| `#imports` cannot be resolved | Run `pnpm typecheck` in this project and check `.wxt` generation | Reverting to `wxt/storage` |
| The popup is missing | Directory layout, relative script path, generated action configuration | Adding an arbitrary top-level `popup.ts` |
| Saving does not change the page | Saved status, page reload, matching URL, allowed site access | Requesting every host permission |
| A message has no receiver | Background errors, extension reload, stale content-script context | Removing error handling or inventing a successful response |
| Types pass but loading fails | Manifest version, selected output, browser loading errors | Treating TypeScript as a browser compatibility test |

If a later feature queries tabs, check for an empty array and a missing `id` before reading `tabs[0].id`. This tutorial deliberately does not add tab queries merely to demonstrate types. Keeping the workflow small lets every permission correspond to code that actually needs it.

## Three Experiments Before Adding Features

First, investigate the scope of shared settings. Open two target tabs, enable highlighting through the popup, and reload only the first tab. The expected result is highlighting in the first tab while the second remains unchanged. Reloading the second should make it read the same setting. Storage belongs to the extension, while the injected stylesheet belongs to each page. A product that needs per-site or per-tab switches needs a different data model; one global boolean cannot represent independent settings.

Next, investigate persistence across the background lifecycle. Save the enabled state and close the popup. Observe the background through Chrome's extension management tools, let it stop or stop it through the available debugging controls, and then reload the target page. The expected result is that the request wakes the background and reads storage. Do not keep its inspector open and conclude that a service worker never sleeps: debugging can affect the observation. This is a proposed experiment, not a measured shutdown duration or a claim that recovery was tested here.

Finally, investigate malformed responses in a separate copy. Temporarily make the background return a string for `enabled`, rebuild, and reload. The content script should reject that response, log an error, and avoid adding styles. Restore the boolean before checking the normal flow again. A TypeScript generic cannot inspect a value received across contexts, and a type assertion does not convert a string. This experiment separates successful message delivery from a valid message payload without requesting more permissions or contacting a service.

For each experiment, record the browser version, loaded output directory, action sequence, expected result, and actual result. A first-experiment failure points toward storage keys or page reloads; the second calls for checking listener registration and background errors; the third calls for reviewing response validation. Changing storage, permissions, and messages simultaneously makes it harder to identify what fixed a failure.

Screenshot evidence also needs an action sequence. One highlighted page proves only its appearance at capture time, not persistence, background recovery, or absence of injection on other domains. Capture the initial page, the reopened settings after saving, highlighting after reloading, and the restored page after disabling. Record which output directory was loaded. Do not mix development and production extensions in one acceptance run: matching interfaces do not make them the same artifact.

Real-time updates require another decision: who notifies existing pages, how missing receivers are handled, and what the popup reports when persistence succeeds but notification fails. Storage subscriptions are another option, but they need lifecycle cleanup. This example intentionally uses a page-reload boundary. Adding automatic updates requires runtime coverage, not merely deleting the word “reload” from the success message.

## Safari and Store Publishing Boundaries

Safari resource generation comes first; Apple packaging is a separate step. On macOS with the appropriate toolchain, the documented command-line route is:

```bash
pnpm build:safari
xcrun safari-web-extension-packager .output/safari-mv2
```

Pass the built output directory, not the TypeScript source directory. App containers, identifiers, signing, and device testing still need attention; follow [Apple's packaging instructions](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari) for the selected workflow. Apple also offers [web-based packaging and distribution through App Store Connect](https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect). It is therefore inaccurate to say every Safari publishing route requires a local Mac and Xcode. Each route has its own eligibility and submission requirements.

[WXT's publishing guide](https://wxt.dev/guide/essentials/publishing) states that WXT does not create the native Safari app wrapper or automate Safari publishing. Generating a Safari output directory on Windows establishes only that target resources can be built. It does not establish successful Safari execution or store approval.

For Chrome and Firefox, generate submission archives with:

```bash
pnpm exec wxt zip -b chrome
pnpm exec wxt zip -b firefox
```

A Firefox project that transforms source during its build also needs rebuildable source for review. Our configuration explicitly allowlists the source ZIP's files. Before submission, unpack the archive, inspect entrypoints, configuration, and lockfile, and reproduce installation and building in another empty directory. WXT 0.21 changed `includeSources` to ordinary allowlist semantics; copying older exclusion rules is not evidence that the resulting source archive is complete.

The Firefox build also reported warnings about data-collection declarations and an extension ID. They do not block this resource build, but publication requirements still need attention. Follow [Mozilla's data-consent documentation](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/) to declare actual behavior and configure your own identifier for the target manifest and distribution route. Suppressing a warning does not supply the declaration, and a tutorial placeholder is not a product's permanent identity.

Rebuild from the archive itself without borrowing `.wxt` or `node_modules` from the original project. Confirm those directories are absent, install using the lockfile, run type checking, and build the selected target. Compare manifest versions, permissions, entrypoints, and match patterns. Different hashed filenames alone do not prove different behavior, and equal total byte counts do not prove identical packages.

Store assets and a production versioning policy are outside this minimal example. Before public distribution, decide how upgrades preserve settings, how a renamed key migrates, and how removing a permission affects existing features. Load a new version over retained test-profile data and record whether settings recover. That is a different test from a first installation with empty storage.

Do not include `.env` secrets, authentication configuration, private registry tokens, or personal files in that archive. Developer accounts, listing copy, icons, privacy information, review, and update policy are not completed by a build command either. API support, packaging success, and store acceptance are separate checks. Keep a record for each platform you intend to release on.

This revision's validation is limited to dependency installation, type checking, and resource builds after extracting the complete files into an external temporary project. The extension was not loaded in a browser; the runtime experiments above, native Safari packaging, signing, and store submission were not performed. For selection context, the [framework comparison](/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) separates historical opinions from version-specific current capabilities.

![Retained WXT development screenshot; not evidence of this revision's runtime validation](/assets/browser-extension-development/chrome_2025-03-11_18-27-41.png)
