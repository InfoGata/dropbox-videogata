import type {
  Dropbox as DropBoxType,
  DropboxAuth as DropboxAuthType,
} from "dropbox";

export interface AccessCodeResponse {
  access_token: string;
  account_id: string;
  expires_in: number;
  refresh_token: string;
  token_type: string;
  uid: string;
}

declare global {
  var Dropbox: {
    DropboxAuth: typeof DropboxAuthType;
    Dropbox: typeof DropBoxType;
  };
}

type UiCheckLoginType = {
  type: "check-login";
};
type UiLoginType = {
  type: "login";
  accessToken: string;
  refreshToken: string;
};
type UiLogoutType = {
  type: "logout";
};
type UiSetKeysType = {
  type: "set-keys";
  clientId: string;
};
type UiSavePluginsType = {
  type: "save-plugins";
};
type UiLoadPluginsType = {
  type: "load-plugins";
};
type UiSavePlaylistsType = {
  type: "save-playlists";
};
type UiLoadPlaylistsType = {
  type: "load-playlists";
};

export type UiMessageType =
  | UiCheckLoginType
  | UiLoginType
  | UiLogoutType
  | UiSetKeysType
  | UiSavePluginsType
  | UiLoadPluginsType
  | UiSavePlaylistsType
  | UiLoadPlaylistsType;

type LoginType = {
  type: "login";
  accessToken: string;
};

type InfoType = {
  type: "info";
  origin: string;
  pluginId: string;
  clientId: string;
};

type MessangerType = {
  type: "message";
  message: string;
};

export type MessageType = LoginType | InfoType | MessangerType;
