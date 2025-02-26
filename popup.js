document.addEventListener("DOMContentLoaded", () => {
  const ttsSelect = document.getElementById("tts-select");
  const saveBtn = document.getElementById("save-btn");

  // Load the current TTS option from localStorage or default to 'edge-tts'
  chrome.storage.sync.get("ttsEngine", (data) => {
    if (data.ttsEngine) {
      ttsSelect.value = data.ttsEngine;
    } else {
      ttsSelect.value = "edge-tts";  // Default value
    }
  });

  // Save the selected TTS engine when the button is clicked
  saveBtn.addEventListener("click", () => {
    const selectedEngine = ttsSelect.value;
    chrome.storage.sync.set({ ttsEngine: selectedEngine }, () => {
    });
  });
});
