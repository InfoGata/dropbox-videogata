import type { DropboxAuth } from "dropbox";
import { CLIENT_ID } from "./shared";
import { MessageType, UiMessageType } from "./types";

const PLUGIN_PATH = "/plugins.json";
const PLAYLIST_PATH = "/playlists.json";
let dropboxAuth: DropboxAuth;

const sendMessage = (message: MessageType) => {
  application.postUiMessage(message);
};

const setDropAuth = (clientId: string | null) => {
  dropboxAuth = new Dropbox.DropboxAuth({ clientId: clientId || CLIENT_ID });
};

const setTokens = (accessToken: string, refreshToken: string) => {
  dropboxAuth.setAccessToken(accessToken);
  dropboxAuth.setRefreshToken(refreshToken);
};

const save = async (path: string, items: any[]) => {
  // Requires files.content.write scope
  const dropbox = new Dropbox.Dropbox({ auth: dropboxAuth });
  await dropbox.filesUpload({
    path: path,
    mute: true,
    mode: { ".tag": "overwrite" },
    contents: JSON.stringify(items),
  });
};

const load = async (path: string): Promise<any[]> => {
  const dropbox = new Dropbox.Dropbox({ auth: dropboxAuth });
  const files = await dropbox.filesDownload({
    path: path,
  });
  const blob: Blob = (files.result as any).fileBlob;
  const json = await blob.text();
  const items = JSON.parse(json);
  return items;
};

const savePlugins = async () => {
  const plugins = await application.getPlugins();
  await save(PLUGIN_PATH, plugins);
  sendMessage({
    type: "message",
    message: "Successfully saved plugins.",
  });
};

const addPlaylists = async () => {
  const playlists: Playlist[] = await load(PLAYLIST_PATH);
  await application.addPlaylists(playlists);
  sendMessage({
    type: "message",
    message: "Successfully added playlists.",
  });
};

const savePlaylists = async () => {
  const playlists = await application.getPlaylists();
  await save(PLAYLIST_PATH, playlists);
  sendMessage({
    type: "message",
    message: "Successfully saved playlists.",
  });
};

const loadPlugins = async () => {
  const plugins: PluginInfo[] = await load(PLUGIN_PATH);
  application.installPlugins(plugins);
};

const sendOrigin = async () => {
  const host = document.location.host;
  const hostArray = host.split(".");
  hostArray.shift();
  const domain = hostArray.join(".");
  const origin = `${document.location.protocol}//${domain}`;
  const pluginId = await application.getPluginId();
  const clientId = localStorage.getItem("clientId") ?? "";
  sendMessage({
    type: "info",
    origin: origin,
    pluginId: pluginId,
    clientId: clientId,
  });
};

application.onUiMessage = async (message: UiMessageType) => {
  switch (message.type) {
    case "login":
      let accessToken = message.accessToken;
      let refreshToken = message.refreshToken;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      setTokens(accessToken, refreshToken);
      break;
    case "check-login":
      const token = localStorage.getItem("access_token");
      if (token) {
        sendMessage({ type: "login", accessToken: token });
      }
      await sendOrigin();
      break;
    case "save-plugins":
      await savePlugins();
      break;
    case "load-plugins":
      await loadPlugins();
      break;
    case "save-playlists":
      await savePlaylists();
      break;
    case "load-playlists":
      await addPlaylists();
      break;
    case "set-keys":
      localStorage.setItem("clientId", message.clientId);
      setDropAuth(message.clientId);
      break;
    case "logout":
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      break;
    default:
      const _exhaustive: never = message;
      break;
  }
};

const loadScript = () => {
  return new Promise<void>((resolve, reject) => {
    const src = "https://unpkg.com/dropbox/dist/Dropbox-sdk.min.js";
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(script);
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject();
    };
  });
};

const init = async () => {
  await loadScript();
  const clientId = localStorage.getItem("clientId");
  setDropAuth(clientId);

  let accessToken = localStorage.getItem("access_token");
  let refreshToken = localStorage.getItem("refresh_token");
  if (accessToken && refreshToken) {
    setTokens(accessToken, refreshToken);
  }
};

init();
