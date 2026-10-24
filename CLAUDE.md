# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VideoGata cloud sync plugin for Dropbox, built with Preact, TypeScript and
Vite. It is a storage backend only: VideoGata decides when to sync, merges
documents with automerge and hands this plugin opaque bytes. The plugin never
reads playlists itself.

It implements, from `@infogata/videogata-plugin-typings`:
- `onSyncUpload({ docUrl, data })` / `onSyncDownload({ docUrl })` -- `data` is a
  base64 automerge document; download returns `{ data: null }` when there is no
  file yet (Dropbox answers 409 `path/not_found`).
- `onLogin` / `onLoginCallback` / `onLogout` / `onIsLoggedIn` -- the app opens a
  blank popup, `onLogin` returns the OAuth url, and the app relays the callback
  url to `onLoginCallback`. The auth url carries `state={"pluginId": ...}` so
  the Android and iOS apps can route the callback deep link back here.

A port of `dropbox-audiogata`, which shares its design with
`dropbox-socialgata`; keep them in step.

## Build Commands

```bash
npm run build          # tsc, then both vite builds
npm run build:options  # options page (Preact) -> dist/options.html
npm run build:plugin   # plugin script -> dist/index.js
```

`dist/` is committed: jsdelivr serves the plugin from the repo.

## Dropbox details

- OAuth code flow with PKCE and `token_access_type=offline`, so no client
  secret is involved. The verifier is kept in localStorage because the plugin
  may reload before the callback arrives.
- Dropbox access tokens last about four hours. They are refreshed a minute
  before expiry and once more on a 401; concurrent refreshes share one request.
  A 400/401 from the refresh means the grant is gone and the user must log in
  again.
- Files are `/<docUrl>.automerge` in the app folder (VideoGata uses
  `videogata-library`), written with `mode: overwrite`.
- The default app key is in `src/shared.ts`; a user's own key replaces it.
- API calls go through `application.networkRequest`; the token endpoint is
  called with `fetch` (Dropbox allows CORS there).
