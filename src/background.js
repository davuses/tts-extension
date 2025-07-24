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
    const ttsEngine = data.ttsEngine || "edge-tts";

    switch (ttsEngine) {
      case "tts-edge":
        api.tabs.sendMessage(tabId, {
          action: "tts_edge",
          text: selectedText,
        });
        break;
      case "tts-google-translate":
        api.tabs.sendMessage(tabId, {
          action: "tts_google_translate",
          text: selectedText,
        });
        break;
      case "tts-kokoro":
        try {
          const apiUrl = "http://localhost:18001/tts";
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: selectedText }),
          });

          if (!response.ok) {
            console.error("Error with TTS request:", response.statusText);
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
            message:
              "Please ensure the Kokoro TTS server is running at http://localhost:18001",
          });
        }
        break;
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
