const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
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
    const { ttsEngine = "edge-tts" } = await browser.storage.sync.get(
      "ttsEngine"
    );

    if (ttsEngine === "edge-tts") {
      api.tabs.sendMessage(tabId, { action: "audioURL", text: selectedText });
    } else {
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
          const base64Audio = reader.result.split(",")[1];

          api.tabs.sendMessage(tabId, {
            action: "playAudio",
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
    }
  });
}

api.commands.onCommand.addListener(async (command) => {
  if (command === "tts_with_kokoro") {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });

    api.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        const selectedText = response.text;
        if (selectedText) {
          handleTTS(selectedText, tab.id);
        } else {
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
