# DevTool2Go Privacy Policy

_Last updated: October 16, 2025_

DevTool2Go is a developer tool that injects the [Eruda](https://eruda.liriliri.io/) console into the pages you choose. This document explains what information the extension collects, how it is used, and the limited situations in which data could leave your device. If anything here is unclear, please open an issue at [https://github.com/o-az/d2go](https://github.com/o-az/d2go).

## TL;DR

- DevTool2Go does **not** collect, transmit, or sell any personal data.
- All preferences are stored locally (and optionally synced by your browser if you use Chrome/Edge/Firefox sync).
- The extension only touches the pages you explicitly grant access to and only to inject the Eruda UI.
- No network calls are made to third-party services, and no analytics libraries are bundled.

## What DevTool2Go can access

When you grant the extension permission to run on a page, it can:

- Inject the Eruda script so you can inspect the DOM, console, network activity, etc.
- Respond to your popup settings (auto-load, auto-hide).
- Listen for pointer/touch events to auto-hide the Eruda panel if you enabled that option.

DevTool2Go **cannot** see data on tabs or sites where it has not been granted access.

## Data storage

- **Preferences** – The “auto load” and “auto hide” options are stored via the browser’s storage API (`browser.storage.sync` when available, falling back to local storage otherwise). These values live inside your browser profile. If you use the browser’s cloud sync, the preference values (`"on"` or `"off"`) may sync between devices through your browser vendor (Chrome, Edge, Firefox). No other data is stored.
- **Runtime state** – The extension keeps an in-memory flag (e.g., whether Eruda has been initialized) while the page is open. This state disappears as soon as the page or browser closes.

DevTool2Go does not store logs, page content, or any personally identifiable information.

## Data sharing

DevTool2Go does not send any information to the developer or to third parties. The only network requests made by the extension are:

- The browser’s own requests to load the Eruda script file from the extension bundle.
- Any requests initiated manually from within the Eruda console (e.g., if you run code that fetches a URL while testing).

## Third-party services

Eruda itself runs entirely inside the page and does not communicate with a backend. DevTool2Go bundles Eruda so no external CDN calls are needed.

## Children’s privacy

DevTool2Go is a developer tool and is not intended for use by children. It does not knowingly collect personal information from anyone.

## Changes to this policy

If the functionality changes in a way that affects privacy, this document will be updated. The “Last updated” date at the top reflects the most recent revision. Material changes will also be noted in the project README or release notes.

## Contact

For questions about this policy or the extension in general, please reach out:

- GitHub Issues: [https://github.com/o-az/d2go/issues](https://github.com/o-az/d2go/issues)
- Email: <devtool2go@async.email>

By installing or using DevTool2Go, you acknowledge that you have read and understood this privacy policy.
