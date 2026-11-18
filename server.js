const WebSocket = require('ws');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const http = require('http');

const PORT = process.env.PORT || 3000;
const ICECAST_URL = process.env.ICECAST_URL;

if (!ICECAST_URL) {
  console.error('ICECAST_URL n\u00e3o definida');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Ponte RadioBOSS Ativa');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('App conectado');

  const ffmpeg = spawn(ffmpegPath, [
    '-i', 'pipe:0',
    '-vn',
    '-acodec', 'libmp3lame',
    '-ab', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-content_type', 'audio/mpeg',
    '-f', 'mp3',
    ICECAST_URL
  ], { stdio: ['pipe', 'ignore', 'pipe'] });

  ffmpeg.stderr.on('data', d => console.log('FFmpeg:', d.toString()));
  ffmpeg.on('error', err => console.error('Erro FFmpeg:', err));

  ws.on('message', data => {
    if (ffmpeg.stdin.writable) ffmpeg.stdin.write(data);
  });

  ws.on('close', () => {
    console.log('Conex\u00e3o fechada');
    if (ffmpeg.stdin.writable) ffmpeg.stdin.end();
    ffmpeg.kill('SIGTERM');
  });
});

server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
