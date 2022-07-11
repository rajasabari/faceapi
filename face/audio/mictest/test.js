navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    const audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    });

    setTimeout(() => {
      mediaRecorder.stop();
    }, 3000);
  });