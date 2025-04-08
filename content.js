// Listen for messages from the background script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "playAudio") {
    const base64Audio = message.audioBase64;

    if (base64Audio) {
      // Convert the base64 string back to a Blob
      const byteCharacters = atob(base64Audio); // Decode base64
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const audioBlob = new Blob(byteArrays, { type: "audio/mp3" });
      const audioURL = URL.createObjectURL(audioBlob);
      createAudioPlayer(audioURL);
    } else {
      console.error('No audio data received');
    }
  }
  else if (message.action === "audioURL") {
    const text = message.text;
    generateAudio(text, 'en-US-AndrewNeural', { pitch: 0, rate: 0 }).then(
      url => {
        const audioURL = url;
        createAudioPlayer(audioURL);
      });

  }
  else if (message.action === "getSelectedText") {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      sendResponse({ success: true, text: selectedText });
    };
  }
}
);

function createAudioPlayer(audioURL) {
  // Create or reuse the Clear All button

  let clearAllButton = document.querySelector('#clear-all-audio-button');
  if (!clearAllButton) {
    clearAllButton = document.createElement("button");
    clearAllButton.id = "clear-all-audio-button";
    clearAllButton.textContent = "Clear";
    clearAllButton.style.position = "fixed";
    clearAllButton.style.bottom = "10px";
    clearAllButton.style.right = "375px";
    clearAllButton.style.marginBottom = "8px";
    clearAllButton.style.padding = "8px 12px";
    clearAllButton.style.backgroundColor = "#e74c3c";
    clearAllButton.style.color = "white";
    clearAllButton.style.border = "none";
    clearAllButton.style.borderRadius = "26px";
    clearAllButton.style.cursor = "pointer";
    clearAllButton.style.zIndex = "10000";
    clearAllButton.style.fontWeight = "bold";

    clearAllButton.addEventListener("click", () => {
      document.querySelectorAll('.audio-player-container').forEach(el => el.remove());
      clearAllButton.style.display = "none";
    });

    document.body.appendChild(clearAllButton);
  }

  // Show the button if hidden
  clearAllButton.style.display = "block";

  // Create a container div for the new audio player
  const audioContainer = document.createElement("div");
  audioContainer.classList.add("audio-player-container");

  // Create the audio element
  const audioElement = document.createElement("audio");
  audioElement.src = audioURL;
  audioElement.controls = true;  // Show controls (play/pause)
  audioElement.autoplay = true;  // Automatically start playing
  audioElement.style.height = "38px";

  // Create the close button (X)
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";  // Use an HTML entity for a "×" symbol
  closeButton.classList.add("close-button");

  // Add an event listener to close the audio player when clicked
  closeButton.addEventListener("click", () => {
    audioContainer.remove();  // Remove the entire audio container (audio + close button)
    adjustAudioPositions();   // Re-adjust positions after removal
  });

  // Append the audio element and the close button to the container
  audioContainer.appendChild(audioElement);
  audioContainer.appendChild(closeButton);

  // Count existing audio players
  const existingPlayers = document.querySelectorAll('.audio-player-container');

  // Set dynamic positioning so each new player appears above the previous one
  const baseBottom = 10; // Initial bottom position
  const spacing = 56; // Space between players
  audioContainer.style.bottom = `${baseBottom + (existingPlayers.length * spacing)}px`;
  audioContainer.style.right = "10px"; // Keep it fixed to the right

  // Append the container to the body
  document.body.appendChild(audioContainer);

  // Function to re-adjust audio positions when one is removed
  function adjustAudioPositions() {
    const players = document.querySelectorAll('.audio-player-container');
    players.forEach((player, index) => {
      player.style.bottom = `${baseBottom + (index * spacing)}px`;
    });
  }
}