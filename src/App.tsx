import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CssBaseline,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FunctionalComponent } from "preact";
import { useState, useEffect } from "preact/hooks";
import { CLIENT_ID } from "./shared";
import { AccessCodeResponse, MessageType, UiMessageType } from "./types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const sendUiMessage = (message: UiMessageType) => {
  parent.postMessage(message, "*");
};

const redirectPath = "/login_popup.html";
const App: FunctionalComponent = () => {
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [pluginId, setPluginId] = useState("");
  const [clientId, setClientId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useOwnKeys, setUseOwnKeys] = useState(false);

  const showMessage = (m: string) => {
    setMessage(m);
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  useEffect(() => {
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
      }
    };
    window.addEventListener("message", onMessage);
    sendUiMessage({ type: "check-login" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const onLogin = async () => {
    const dropboxAuth = new Dropbox.DropboxAuth({ clientId: CLIENT_ID });
    const state = { pluginId: pluginId };
    const stateStr = JSON.stringify(state);
    const authUrl = await dropboxAuth.getAuthenticationUrl(
      redirectUri,
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
        redirectUri,
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

  const onAccordionChange = (_: any, expanded: boolean) => {
    setShowAdvanced(expanded);
  };

  const onSaveKeys = () => {
    setUseOwnKeys(!!clientId);
    sendUiMessage({
      type: "set-keys",
      clientId: clientId,
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
    <Box
      sx={{ display: "flex", "& .MuiTextField-root": { m: 1, width: "25ch" } }}
    >
      <CssBaseline />
      {accessToken ? (
        <div>
          <div>
            <div>
              <Button onClick={onSavePlaylists}>Save Playlists</Button>
              <Button onClick={onLoadPlaylists}>Load Playlists</Button>
            </div>
            <div>
              <Button onClick={onSavePlugins}>Save Plugins</Button>
              <Button onClick={onLoadPlugins}>Install Plugins</Button>
            </div>
            <div>
              <Button onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="contained" onClick={onLogin}>
            Login
          </Button>
          {useOwnKeys && (
            <Typography>
              Using Client Id set in the Advanced Configuration
            </Typography>
          )}
          <Accordion expanded={showAdvanced} onChange={onAccordionChange}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1d-content"
              id="panel1d-header"
            >
              <Typography>Advanced Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Supplying your own keys:</Typography>
              <Typography>
                {redirectUri} needs be added to Redirect URIs
              </Typography>
              <div>
                <TextField
                  label="Client ID"
                  value={clientId}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setClientId(value);
                  }}
                />
              </div>
              <Stack spacing={2} direction="row">
                <Button variant="contained" onClick={onSaveKeys}>
                  Save
                </Button>
                <Button variant="contained" onClick={onClearKeys} color="error">
                  Clear
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </div>
      )}
      <pre>{message}</pre>
    </Box>
  );
};

export default App;
