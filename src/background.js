const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({
    id: "ttsWithKokoro",
    title: "TTS with Kokoro",
    contexts: ["selection"],
  });
});

api.runtime.onStartup.addListener(() => {
  api.contextMenus.create({
    id: "ttsWithKokoro",
    title: "TTS with Kokoro",
    contexts: ["selection"],
  });
});

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ttsWithKokoro") {
    const selectedText = info.selectionText;
    handleTTS(selectedText, tab.id);
  }
});

async function handleTTS(selectedText, tabId) {
  api.storage.sync.get("ttsEngine", async (data) => {
    const ttsEngine = data.ttsEngine || "google-translate";
    if (ttsEngine.startsWith("kokoro")) {
      const voice = ttsEngine.split("_").slice(1).join("_");

      try {
        const apiUrl = "http://localhost:18001/tts";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: selectedText, voice: voice }),
        });

        if (!response.ok) {
          const status = response.status;
          let errorDetail = "Unknown error";
          try {
            const errorData = await response.json();
            if (errorData.detail) {
              errorDetail = errorData.detail;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          const errorMessage = `Error playing TTS audio: ${status} - ${errorDetail}`;

          console.error(errorMessage);

          api.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "TTS Server Error",
            message: errorMessage,
          });
          return;
        }

        const audioBlob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1]; // Get base64 part

          // Send the base64 audio to the content script
          api.tabs.sendMessage(tabId, {
            action: "tts_kokoro",
            audioBase64: base64Audio,
          });
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("Error playing TTS audio:", error);
        api.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "TTS Server Error",
          message: `Error playing TTS audio:, ${error}. Please make sure the server is running at port 18001`,
        });
      }
    } else {
      switch (ttsEngine) {
        case "edge":
          api.tabs.sendMessage(tabId, {
            action: "tts_edge",
            text: selectedText,
          });
          break;
        case "google-translate":
          api.tabs.sendMessage(tabId, {
            action: "tts_google_translate",
            text: selectedText,
          });
          break;
      }
    }
  });
}

api.commands.onCommand.addListener(async (command) => {
  if (command === "Text to Speech") {
    // Get the active tab
    const [tab] = await api.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Send a message to the content script to get the selected text
    api.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        const selectedText = response.text;
        if (selectedText) {
          console.log("Selected Text:", selectedText);
          handleTTS(selectedText, tab.id);
        } else {
          console.log("No text selected.");
          api.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "No Text Selected",
            message: "Please select some text before using the TTS feature.",
          });
        }
      }
    });
  }
});
