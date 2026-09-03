import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function saveRoomsPlugin() {
  return {
    name: 'save-rooms-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-rooms', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const roomsPath = path.resolve(__dirname, 'src/data/rooms.json');
              const data = JSON.parse(body);
              const formatted = JSON.stringify(data, null, 2);
              fs.writeFileSync(roomsPath, formatted, 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', message: 'Saved directly to src/data/rooms.json!' }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [saveRoomsPlugin()]
});
