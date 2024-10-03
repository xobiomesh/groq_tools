let mediaRecorder;
let audioChunks = [];
const socket = io();

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
        if (audioChunks.length > 5) { // Send audio chunks every ~5 seconds
            sendAudioChunk();
        }
    };

    mediaRecorder.start(1000); // Collect data every 1 second
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
}

function sendAudioChunk() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    fetch('/transcribe', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('transcription').textContent += data.transcription + ' ';
    })
    .catch(error => console.error('Error:', error));

    audioChunks = [];
}

socket.on('transcription', (data) => {
    document.getElementById('transcription').textContent += data.transcription + ' ';
});