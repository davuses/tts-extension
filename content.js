// Listen for messages from the background script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "playAudio") {
    const base64Audio = message.audioBase64;

    if (base64Audio) {
      // Check if there is an existing audio player, and remove it if present
      const existingAudio = document.querySelector('.audio-player-container');
      if (existingAudio) {
        existingAudio.remove();
      }

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

      // Create a container div for the audio player and close button
      const audioContainer = document.createElement("div");
      audioContainer.classList.add("audio-player-container");

      // Create the audio element
      const audioElement = document.createElement("audio");
      audioElement.src = audioURL;
      audioElement.controls = true;  // Show controls (play/pause)
      audioElement.autoplay = true;  // Automatically start playing

      // Create the close button (X)
      const closeButton = document.createElement("button");
      closeButton.innerHTML = "&times;";  // Use an HTML entity for a "×" symbol
      closeButton.classList.add("close-button");

      // Add an event listener to close the audio player when clicked
      closeButton.addEventListener("click", () => {
        audioContainer.remove();  // Remove the entire audio container (audio + close button)
      });

      // Append the audio element and the close button to the container
      audioContainer.appendChild(audioElement);
      audioContainer.appendChild(closeButton);

      // Append the container to the body
      document.body.appendChild(audioContainer);
    } else {
      console.error('No audio data received');
    }
  }
  else if (message.action === "audioURL") {
    const text = message.text;
    generateAudio(text, 'en-US-AndrewNeural', { pitch: 0, rate: 0 }).then(
      url => {
        const audioURL = url;
        const audioContainer = document.createElement("div");
        audioContainer.classList.add("audio-player-container");

        // Create the audio element
        const audioElement = document.createElement("audio");
        audioElement.src = audioURL;
        audioElement.controls = true;  // Show controls (play/pause)
        audioElement.autoplay = true;  // Automatically start playing

        // Create the close button (X)
        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";  // Use an HTML entity for a "×" symbol
        closeButton.classList.add("close-button");

        // Add an event listener to close the audio player when clicked
        closeButton.addEventListener("click", () => {
          audioContainer.remove();  // Remove the entire audio container (audio + close button)
        });

        // Append the audio element and the close button to the container
        audioContainer.appendChild(audioElement);
        audioContainer.appendChild(closeButton);

        // Append the container to the body
        document.body.appendChild(audioContainer);
      });

  }
});
