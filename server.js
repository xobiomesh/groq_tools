const express = require('express');
const multer = require('multer');
const { Groq } = require('groq');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const upload = multer({ dest: 'uploads/' });
const groq = new Groq(process.env.GROQ_API_KEY);

app.use(express.static('public'));

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        const audioFile = req.file.path;
        
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioFile),
            model: 'distil-whisper-large-v3-en',
        });

        io.emit('transcription', { transcription: transcription.text });
        res.json({ transcription: transcription.text });

        // Clean up the temporary file
        fs.unlinkSync(audioFile);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Transcription failed' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});