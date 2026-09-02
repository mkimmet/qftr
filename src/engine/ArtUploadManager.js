import { synth } from './SoundSynth.js';

export class ArtUploadManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.customArtStore = {};
  }

  uploadFileForRoom(roomId, file, callback) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.assignImageToRoom(roomId, dataUrl);
      synth.playStatUp();
      this.gameEngine.showNotification(`🖼️ Applied custom background image to ${roomId}!`);
      if (callback) callback(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  assignImageToRoom(roomId, imageSrc) {
    const room = this.gameEngine.explorationScene.rooms[roomId];
    if (room) {
      const img = new Image();
      img.src = imageSrc;
      room.bgImage = img;
      this.customArtStore[roomId] = imageSrc;
      localStorage.setItem('qftr_custom_art_store', JSON.stringify(this.customArtStore));
    }
  }

  loadCustomArt() {
    const saved = localStorage.getItem('qftr_custom_art_store');
    if (!saved) return;

    try {
      this.customArtStore = JSON.parse(saved);
      Object.keys(this.customArtStore).forEach(rId => {
        const room = this.gameEngine.explorationScene.rooms[rId];
        if (room) {
          const img = new Image();
          img.src = this.customArtStore[rId];
          room.bgImage = img;
        }
      });
    } catch (e) {
      console.warn('Failed to load custom art store:', e);
    }
  }
}
