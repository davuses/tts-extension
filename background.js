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

    if (selectedText) {
      chrome.storage.sync.get("ttsEngine", async (data) => {
        const ttsEngine = data.ttsEngine;
        if (ttsEngine == "edge-tts") {
          chrome.tabs.sendMessage(
            tab.id,
            { action: "audioURL" , text: selectedText});
        }
        else {
          try {
            const apiUrl = 'http://localhost:8001/tts'
            // Send the selected text to the FastAPI server
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: selectedText })
            });

            if (!response.ok) {
              console.error('Error with TTS request:', response.statusText);
              return;
            }

            // Get the MP3 audio as a blob
            const audioBlob = await response.blob();

            // Convert the blob to a base64 string
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(',')[1]; // Get base64 part (ignore "data:audio/mp3;base64,")

              // Send the base64 string to the content script
              chrome.tabs.sendMessage(tab.id, { action: "playAudio", audioBase64: base64Audio });
            };
            reader.readAsDataURL(audioBlob);

          } catch (error) {
            console.error('Error playing TTS audio:', error);
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon128.png', // Path to your extension icon
              title: 'TTS Server Error',
              message: 'Please ensure the kokoro TTS server is running at http://localhost:8001'
            });
          }
        }
      })

    }
  }
});
