document.addEventListener("DOMContentLoaded", () => {
  const ttsSelect = document.getElementById("tts-select");

  // Load the current TTS option from localStorage or default to 'edge-tts'
  chrome.storage.sync.get("ttsEngine", (data) => {
    if (data.ttsEngine) {
      ttsSelect.value = data.ttsEngine;
    } else {
      ttsSelect.value = "edge-tts";  // Default value
    }
  });

  // Save the selected TTS engine when the button is clicked
  ttsSelect.addEventListener("change", () => {
    const selectedEngine = ttsSelect.value;
    chrome.storage.sync.set({ ttsEngine: selectedEngine }, () => {
      console.log('Settings saved for:', selectedEngine);
    });
  });
});
