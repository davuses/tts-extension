chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ttsWithKokoro",
    title: "TTS with Kokoro",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ttsWithKokoro") {
    const selectedText = info.selectionText;
    handleTTS(selectedText, tab.id);
  }
});


async function handleTTS(selectedText, tabId) {
  chrome.storage.sync.get("ttsEngine", async (data) => {
    const ttsEngine = data.ttsEngine || "edge-tts";

    if (ttsEngine === "edge-tts") {
      chrome.tabs.sendMessage(tabId, { action: "audioURL", text: selectedText });
    } else {
      try {
        const apiUrl = "http://localhost:18001/tts";
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: selectedText })
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
          chrome.tabs.sendMessage(tabId, { action: "playAudio", audioBase64: base64Audio });
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("Error playing TTS audio:", error);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "TTS Server Error",
          message: "Please ensure the Kokoro TTS server is running at http://localhost:18001"
        });
      }
    }
  });
}


chrome.commands.onCommand.addListener(async (command) => {
  if (command === "tts_with_kokoro") {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send a message to the content script to get the selected text
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" }, (response) => {
      if (response && response.text) {
        const selectedText = response.text;
        if (selectedText) {
          console.log("Selected Text:", selectedText);
          handleTTS(selectedText, tab.id);
        } else {
          console.log("No text selected.");
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "No Text Selected",
            message: "Please select some text before using the TTS feature."
          });
        }
      }
    });
  }
});