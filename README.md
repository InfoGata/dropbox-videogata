# dropbox-videogata

A [VideoGata](https://github.com/InfoGata/videogata) plugin that syncs your
playlists and favorites between devices through Dropbox.

[Installation Link](https://www.videogata.com/plugininstall?manifestUrl=https://cdn.jsdelivr.net/gh/InfoGata/dropbox-videogata@latest/manifest.json)

After installing, open VideoGata Settings → Cloud Sync, choose Dropbox and log
in. VideoGata then syncs by itself: shortly after you change something,
periodically, and whenever the app is opened or put in the background.

The library is stored as a single automerge file, `videogata-library.automerge`,
in the app's Dropbox folder. Changes made on different devices are merged,
deletions included.
