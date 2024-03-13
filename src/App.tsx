import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { CLIENT_ID } from "./shared";
import { AccessCodeResponse, MessageType, UiMessageType } from "./types";
import { createEffect, createSignal } from "solid-js";

const sendUiMessage = (message: UiMessageType) => {
  parent.postMessage(message, "*");
};

const redirectPath = "/login_popup.html";
const App = () => {
  const [accessToken, setAccessToken] = createSignal("");
  const [message, setMessage] = createSignal("");
  const [redirectUri, setRedirectUri] = createSignal("");
  const [pluginId, setPluginId] = createSignal("");
  const [clientId, setClientId] = createSignal("");
  const [useOwnKeys, setUseOwnKeys] = createSignal(false);

  const showMessage = (m: string) => {
    setMessage(m);
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  createEffect(() => {
    const onMessage = (event: MessageEvent<MessageType>) => {
      switch (event.data.type) {
        case "message":
          showMessage(event.data.message);
          break;
        case "info":
          console.log(event);
          setRedirectUri(event.data.origin + redirectPath);
          setPluginId(event.data.pluginId);
          setClientId(event.data.clientId);
          if (event.data.clientId) {
            setUseOwnKeys(true);
          }
          break;
        case "login":
          setAccessToken(event.data.accessToken);
          break;
        default:
          const _exhaustive: never = event.data;
          break;
      }
    };
    window.addEventListener("message", onMessage);
    sendUiMessage({ type: "check-login" });
    return () => window.removeEventListener("message", onMessage);
  });

  const onLogin = async () => {
    const dropboxAuth = new Dropbox.DropboxAuth({ clientId: CLIENT_ID });
    const state = { pluginId: pluginId };
    const stateStr = JSON.stringify(state);
    const authUrl = await dropboxAuth.getAuthenticationUrl(
      redirectUri(),
      stateStr,
      "code",
      "offline",
      undefined,
      undefined,
      true
    );
    const url = authUrl.valueOf();
    const newWindow = window.open(url, "_blank");
    const onMessage = async (url: string) => {
      const returnUrl = new URL(url);
      if (newWindow) {
        newWindow.close();
      }
      const code = returnUrl.searchParams.get("code") || "";
      const accessCodeResponse = await dropboxAuth.getAccessTokenFromCode(
        redirectUri(),
        code
      );
      const accessCodeResult = accessCodeResponse.result as AccessCodeResponse;
      const accessToken = accessCodeResult.access_token;
      const refreshToken = accessCodeResult.refresh_token;
      console.log("accessToken", accessToken);
      setAccessToken(accessToken);
      sendUiMessage({
        type: "login",
        accessToken,
        refreshToken,
      });
    };
    window.onmessage = async (event: MessageEvent) => {
      if (event.source === newWindow && event.data.url) {
        await onMessage(event.data.url);
      } else {
        // mobile deeplink
        if (event.data.type === "deeplink") {
          await onMessage(event.data.url);
        }
      }
    };
  };

  const onSavePlugins = () => {
    sendUiMessage({ type: "save-plugins" });
  };

  const onLoadPlugins = () => {
    sendUiMessage({ type: "load-plugins" });
  };

  const onLogout = () => {
    sendUiMessage({ type: "logout" });
    setAccessToken("");
  };

  const onSaveKeys = () => {
    setUseOwnKeys(!!clientId);
    sendUiMessage({
      type: "set-keys",
      clientId: clientId(),
    });
  };

  const onClearKeys = () => {
    setClientId("");
    setUseOwnKeys(false);
    sendUiMessage({
      type: "set-keys",
      clientId: "",
    });
  };

  const onSavePlaylists = () => {
    sendUiMessage({
      type: "save-playlists",
    });
  };

  const onLoadPlaylists = () => {
    sendUiMessage({
      type: "load-playlists",
    });
  };

  return (
    <div class="flex">
      {accessToken() ? (
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <Button onClick={onSavePlaylists}>Save Playlists</Button>
            <Button onClick={onLoadPlaylists}>Load Playlists</Button>
          </div>
          <div class="flex gap-2">
            <Button onClick={onSavePlugins}>Save Plugins</Button>
            <Button onClick={onLoadPlugins}>Install Plugins</Button>
          </div>
          <div class="flex gap-2">
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>
      ) : (
        <div class="w-full">
          <Button onClick={onLogin}>Login</Button>
          {useOwnKeys() && (
            <p>Using Client Id set in the Advanced Configuration</p>
          )}
          <Accordion multiple collapsible class="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Advanced Configuration</AccordionTrigger>
              <AccordionContent>
                <div class="flex flex-col gap-4 m-4">
                  <p>Supplying your own keys:</p>
                  <p>{redirectUri()} needs be added to Redirect URIs</p>
                  <div>
                    <Input
                      placeholder="Client ID"
                      value={clientId()}
                      onChange={(e) => {
                        const value = e.currentTarget.value;
                        setClientId(value);
                      }}
                    />
                  </div>
                  <div class="flex gap-2">
                    <Button onClick={onSaveKeys}>Save</Button>
                    <Button variant="destructive" onClick={onClearKeys}>
                      Clear
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      <pre>{message()}</pre>
    </div>
  );
};

export default App;
