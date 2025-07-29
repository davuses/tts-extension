document.addEventListener("DOMContentLoaded", () => {
  const ttsSelect = document.getElementById("tts-select");

  // Load the current TTS option from localStorage or default to 'edge-tts'
  chrome.storage.sync.get("ttsEngine", (data) => {
    if (data.ttsEngine) {
      ttsSelect.value = data.ttsEngine;
    } else {
      ttsSelect.value = "tts-edge"; // Default value
    }
  });

  // Save the selected TTS engine when the button is clicked
  ttsSelect.addEventListener("change", () => {
    const selectedEngine = ttsSelect.value;
    chrome.storage.sync.set({ ttsEngine: selectedEngine }, () => {
      console.log("Settings saved for:", selectedEngine);
    });
  });
});
const select = document.getElementById("tts-select");

select.addEventListener("wheel", (event) => {
  event.preventDefault(); // Prevent default page scrolling

  const currentIndex = select.selectedIndex;
  const maxIndex = select.options.length - 1;

  if (event.deltaY > 0 && currentIndex < maxIndex) {
    // Scroll down: go to next option
    select.selectedIndex += 1;
  } else if (event.deltaY < 0 && currentIndex > 0) {
    // Scroll up: go to previous option
    select.selectedIndex -= 1;
  }

  // Optional: trigger change event if needed
  select.dispatchEvent(new Event("change"));
});
