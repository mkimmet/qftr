import { synth } from '../engine/SoundSynth.js';

export class StudioPersistence {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.storageKey = 'qftr_custom_rooms_data';
  }

  saveRoomData(roomId, roomData) {
    let allRooms = {};
    const existing = localStorage.getItem(this.storageKey);
    if (existing) {
      try {
        allRooms = JSON.parse(existing);
      } catch (e) {
        allRooms = {};
      }
    }

    // Clean and validate obstacles before saving
    const cleanObstacles = (roomData.obstacles || []).filter(obs => obs && obs.type).map(obs => ({
      id: obs.id || `obs_${Date.now()}`,
      type: obs.type || 'rect',
      label: obs.label || `${(obs.type || 'rect').toUpperCase()} Barrier`,
      isSolid: obs.isSolid !== false,
      isCutout: !!obs.isCutout,
      depthY: obs.depthY || (obs.points && obs.points.length > 0 ? Math.max(...obs.points.map(p => p.y)) : obs.y),
      points: obs.points ? obs.points.map(pt => ({ x: pt.x || 0, y: pt.y || 0 })) : null,
      x: obs.x || 0,
      y: obs.y || 0,
      w: obs.w || 0,
      h: obs.h || 0,
      radius: obs.radius || 0
    }));

    allRooms[roomId] = {
      id: roomData.id,
      title: roomData.title,
      desc: roomData.desc,
      bounds: roomData.bounds,
      exits: roomData.exits,
      obstacles: cleanObstacles,
      props: roomData.props,
      hotspots: roomData.hotspots
    };

    localStorage.setItem(this.storageKey, JSON.stringify(allRooms));
    synth.playStatUp();
    this.gameEngine.showNotification(`💾 Saved room layout for "${roomData.title}" to LocalStorage!`);
  }

  loadRoomData() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return false;

    try {
      const allRooms = JSON.parse(saved);
      if (this.gameEngine.explorationScene && this.gameEngine.explorationScene.rooms) {
        Object.keys(allRooms).forEach(rId => {
          if (this.gameEngine.explorationScene.rooms[rId]) {
            const savedRoom = allRooms[rId];
            if (savedRoom && savedRoom.obstacles) {
              // Sanitize saved obstacles to prevent NaN or broken obstacles
              savedRoom.obstacles = savedRoom.obstacles.filter(obs => {
                if (!obs) return false;
                if (obs.type === 'polygon') return obs.points && Array.isArray(obs.points) && obs.points.length > 2;
                if (obs.type === 'circle') return !isNaN(obs.x) && !isNaN(obs.y) && obs.radius > 0;
                if (obs.type === 'rect') return !isNaN(obs.x) && !isNaN(obs.y) && obs.w > 0 && obs.h > 0;
                return false;
              });
            }
            Object.assign(this.gameEngine.explorationScene.rooms[rId], savedRoom);
          }
        });
      }
      return true;
    } catch (e) {
      console.warn('Malformed room data in LocalStorage. Purging invalid saved rooms.');
      this.clearSavedRooms();
      return false;
    }
  }

  clearSavedRooms() {
    localStorage.removeItem(this.storageKey);
    synth.playHit();
    this.gameEngine.showNotification('🗑️ Reset all saved room overrides to default.');
  }

  exportPermanentJSON() {
    if (!this.gameEngine.explorationScene || !this.gameEngine.explorationScene.rooms) {
      return null;
    }
    const rooms = this.gameEngine.explorationScene.rooms;
    const cleanRooms = {};

    Object.keys(rooms).forEach(rId => {
      const room = rooms[rId];
      cleanRooms[rId] = {
        id: room.id,
        title: room.title,
        desc: room.desc,
        bounds: room.bounds,
        depthScale: room.depthScale,
        exits: room.exits,
        obstacles: (room.obstacles || []).map(obs => ({
          id: obs.id,
          type: obs.type,
          label: obs.label,
          isSolid: obs.isSolid !== false,
          isCutout: !!obs.isCutout,
          depthY: obs.depthY,
          points: obs.points,
          x: obs.x,
          y: obs.y,
          w: obs.w,
          h: obs.h,
          radius: obs.radius
        })),
        props: room.props || [],
        hotspots: room.hotspots || []
      };
    });

    const jsonStr = JSON.stringify(cleanRooms, null, 2);

    // Save directly to project repository via Vite Dev API Endpoint!
    fetch('/api/save-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr
    }).then(res => res.json()).then(data => {
      synth.playStatUp();
      this.gameEngine.showNotification('⚡ PERMANENT SAVE COMPLETE: Saved level layout directly to src/data/rooms.json!');
    }).catch(err => {
      // Fallback to clipboard if API unavailable
      navigator.clipboard?.writeText?.(jsonStr).catch(() => {});
      synth.playStatUp();
      this.gameEngine.showNotification('💾 Saved level layout to clipboard!');
    });

    return cleanRooms;
  }
}
