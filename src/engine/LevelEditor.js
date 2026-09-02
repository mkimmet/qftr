import { synth } from './SoundSynth.js';

export class LevelEditor {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.isActive = false;
    this.activeTab = 'hotspots'; // 'hotspots' | 'obstacles' | 'props' | 'exits' | 'bounds'

    this.selectedHotspotIdx = -1;
    this.selectedObstacleIdx = -1;
    this.selectedPropIdx = -1;
    this.selectedPolyVertexIdx = -1;

    // Canvas Drag Modes: 'move-hs' | 'resize-hs' | 'move-obs' | 'resize-obs' | 'move-poly' | 'move-poly-vertex' | 'move-prop' | 'drag-ymin' | 'drag-ymax' | null
    this.dragMode = null;
    this.dragStart = { x: 0, y: 0 };
    this.initialBox = { x: 0, y: 0, w: 0, h: 0, radius: 0, yMin: 0, yMax: 0, ptX: 0, ptY: 0, points: null };

    // Window Panel Drag State
    this.isPanelDragging = false;
    this.panelDragOffset = { x: 0, y: 0 };

    this.panelElement = null;
    this.initPanelUI();
    this.initGlobalDragListeners();
  }

  toggleEditor() {
    this.isActive = !this.isActive;
    synth.playClick();
    if (this.isActive) {
      this.panelElement.style.display = 'flex';
      this.gameEngine.showNotification('🛠️ DEV LEVEL EDITOR Active! Drag red polygon vertex handles on canvas.');
      this.refreshPanel();
    } else {
      this.panelElement.style.display = 'none';
      this.gameEngine.showNotification('🛠️ DEV LEVEL EDITOR Disabled.');
    }
  }

  initPanelUI() {
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'parchment-card level-editor-panel';
    this.panelElement.style.cssText = `
      position: absolute;
      top: 55px;
      right: 12px;
      width: 420px;
      max-height: 640px;
      overflow-y: auto;
      z-index: 95;
      display: none;
      flex-direction: column;
      gap: 10px;
      font-size: 0.85rem;
      background: rgba(12, 22, 16, 0.97);
      color: #f7f2e7;
      border: 2px solid var(--ghibli-sun-gold);
      box-shadow: 0 16px 40px rgba(0,0,0,0.85);
      user-select: none;
    `;
    document.getElementById('game-container').appendChild(this.panelElement);

    // Draggable Window Event Listeners
    window.addEventListener('mousemove', (e) => {
      if (this.isPanelDragging) {
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        let left = e.clientX - containerRect.left - this.panelDragOffset.x;
        let top = e.clientY - containerRect.top - this.panelDragOffset.y;
        this.panelElement.style.left = `${left}px`;
        this.panelElement.style.top = `${top}px`;
        this.panelElement.style.right = 'auto';
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPanelDragging = false;
    });
  }

  initGlobalDragListeners() {
    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.dragMode) return;

      const canvas = this.gameEngine.canvas;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      const room = this.gameEngine.explorationScene.getCurrentRoomData();
      this.handleMouseMove(canvasX, canvasY, room);
    });

    window.addEventListener('mouseup', () => {
      if (this.isActive && this.dragMode) {
        this.handleMouseUp();
      }
    });
  }

  refreshPanel() {
    if (!this.isActive) return;
    const room = this.gameEngine.explorationScene.getCurrentRoomData();
    if (!room.obstacles) room.obstacles = [];
    if (!room.props) room.props = [];
    if (!room.exits) room.exits = {};

    this.panelElement.innerHTML = `
      <!-- Draggable Header Bar -->
      <div id="editor-header-drag" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px; cursor: move; background: rgba(244, 190, 66, 0.15); margin: -10px -10px 4px -10px; padding: 10px;">
        <span style="font-family: var(--font-heading); font-weight: 700; color: var(--ghibli-sun-gold); font-size: 0.98rem;">✋ Drag Panel: Level Editor (${room.id})</span>
        <button id="btn-close-editor-panel" class="btn-ghibli" style="padding: 2px 8px; font-size: 0.75rem;">✕</button>
      </div>

      <!-- Room Selection & New Room Creator Row -->
      <div style="display: flex; gap: 6px; align-items: center;">
        <select id="select-active-room" style="flex: 1; background: #000; color: var(--ghibli-sun-gold); border: 1px solid #666; padding: 4px; font-weight: 700; border-radius: 4px;">
          ${Object.keys(this.gameEngine.explorationScene.rooms).map(rId => `
            <option value="${rId}" ${rId === room.id ? 'selected' : ''}>🏰 ${this.gameEngine.explorationScene.rooms[rId].title} (${rId})</option>
          `).join('')}
        </select>
        <button id="btn-create-new-room" class="btn-ghibli btn-emerald" style="padding: 4px 10px; font-weight: 700;">➕ New Room</button>
      </div>

      <!-- Tab Selectors -->
      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
        <button class="btn-ghibli ${this.activeTab === 'hotspots' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="hotspots">Hotspots (${room.hotspots.length})</button>
        <button class="btn-ghibli ${this.activeTab === 'obstacles' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="obstacles">🪨 Barriers (${room.obstacles.length})</button>
        <button class="btn-ghibli ${this.activeTab === 'props' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="props">🪵 Props (${room.props.length})</button>
        <button class="btn-ghibli ${this.activeTab === 'exits' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="exits">🚪 Exits</button>
        <button class="btn-ghibli ${this.activeTab === 'bounds' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="bounds">Walk Bounds</button>
        <button class="btn-ghibli ${this.activeTab === 'depth' ? 'btn-emerald' : ''} btn-editor-tab" data-tab="depth">📐 Depth Scale</button>
      </div>

      <!-- Tab Content Area -->
      <div style="margin-top: 4px;">
        ${this.renderTabContent(room)}
      </div>

      <!-- Save & Export Controls -->
      <div style="display: flex; gap: 6px; margin-top: 8px;">
        <button id="btn-save-room-storage" class="btn-ghibli btn-emerald" style="flex: 1; height: 36px; font-weight: 800; justify-content: center;">💾 Save to Storage</button>
        <button id="btn-reset-room-storage" class="btn-ghibli" style="background: #a83232; color: #fff; border-color: #591515; padding: 4px 8px; font-weight: 700;">🔄 Reset Room</button>
        <button id="btn-export-room-json" class="btn-ghibli" style="flex: 1; height: 36px; justify-content: center;">📋 Export JSON</button>
      </div>
    `;

    // Bind Draggable Header
    const headerEl = this.panelElement.querySelector('#editor-header-drag');
    headerEl.addEventListener('mousedown', (e) => {
      if (e.target.id === 'btn-close-editor-panel') return;
      this.isPanelDragging = true;
      const rect = this.panelElement.getBoundingClientRect();
      this.panelDragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    this.panelElement.querySelector('#btn-close-editor-panel').addEventListener('click', () => this.toggleEditor());

    const selectRoom = this.panelElement.querySelector('#select-active-room');
    if (selectRoom) {
      selectRoom.addEventListener('change', (e) => {
        this.gameEngine.explorationScene.changeRoom(e.target.value, 650, 450);
        this.refreshPanel();
      });
    }

    const createRoomBtn = this.panelElement.querySelector('#btn-create-new-room');
    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', () => this.showCreateRoomModal());
    }

    this.panelElement.querySelectorAll('.btn-editor-tab').forEach(b => {
      b.addEventListener('click', (e) => {
        this.activeTab = e.target.getAttribute('data-tab');
        this.refreshPanel();
      });
    });

    this.panelElement.querySelector('#btn-save-room-storage').addEventListener('click', () => {
      this.gameEngine.studioPersistence.saveRoomData(room.id, room);
    });

    const resetBtn = this.panelElement.querySelector('#btn-reset-room-storage');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        let allRooms = {};
        const existing = localStorage.getItem('qftr_custom_rooms_data');
        if (existing) {
          try { allRooms = JSON.parse(existing); } catch(e) {}
        }
        delete allRooms[room.id];
        localStorage.setItem('qftr_custom_rooms_data', JSON.stringify(allRooms));
        location.reload();
      });
    }

    this.panelElement.querySelector('#btn-export-room-json').addEventListener('click', () => this.exportRoomJSON());

    this.attachTabEvents(room);
  }

  showCreateRoomModal() {
    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 650px;">
        <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--text-dark); margin-bottom: 12px; border-bottom: 2px solid var(--parchment-border); padding-bottom: 6px;">
          🏰 1-Click Create New Game Room
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          <div>
            <label style="font-weight: 700;">Room ID (lowercase, e.g. <code>dragon_lair</code>):</label>
            <input type="text" id="new-room-id" value="dragon_lair" style="width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px;">
          </div>
          <div>
            <label style="font-weight: 700;">Room Title:</label>
            <input type="text" id="new-room-title" value="The Crimson Dragon Lair" style="width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px;">
          </div>
          <div>
            <label style="font-weight: 700;">Room Description:</label>
            <input type="text" id="new-room-desc" value="A dark volcanic cavern littered with gold coins." style="width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px;">
          </div>
          <div>
            <label style="font-weight: 700;">Background Image Path or URL:</label>
            <input type="text" id="new-room-bg" value="/forest.jpg" style="width: 100%; padding: 6px; border: 1px solid #999; border-radius: 4px;">
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btn-submit-new-room" class="btn-ghibli btn-emerald" style="flex: 1; height: 42px; font-weight: 800; justify-content: center;">🏰 Create Room Now</button>
          <button id="btn-cancel-new-room" class="btn-ghibli" style="height: 42px;">Cancel</button>
        </div>
      </div>
    `;

    dialogueLayer.querySelector('#btn-cancel-new-room').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });

    dialogueLayer.querySelector('#btn-submit-new-room').addEventListener('click', () => {
      const rId = dialogueLayer.querySelector('#new-room-id').value.trim().toLowerCase().replace(/\s+/g, '_');
      const rTitle = dialogueLayer.querySelector('#new-room-title').value.trim();
      const rDesc = dialogueLayer.querySelector('#new-room-desc').value.trim();
      const rBg = dialogueLayer.querySelector('#new-room-bg').value.trim();

      if (!rId) return;

      const bgImg = new Image();
      bgImg.src = rBg;

      const newRoom = {
        id: rId,
        title: rTitle || 'New Realm Room',
        bgImage: bgImg,
        desc: rDesc || 'A newly created room in Spielburg Valley.',
        bounds: { xMin: 40, xMax: 1240, yMin: 300, yMax: 660 },
        exits: {},
        obstacles: [],
        props: [],
        hotspots: []
      };

      this.gameEngine.explorationScene.rooms[rId] = newRoom;
      this.gameEngine.studioPersistence.saveRoomData(rId, newRoom);
      this.gameEngine.explorationScene.changeRoom(rId, 650, 450);

      dialogueLayer.style.display = 'none';
      synth.playStatUp();
      this.gameEngine.showNotification(`🎉 Created and entered new room "${newRoom.title}" (${rId})!`);
      this.refreshPanel();
    });
  }

  renderTabContent(room) {
    if (this.activeTab === 'exits') {
      const dirList = ['east', 'west', 'north', 'south'];
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-weight: 700; color: #6ee3a0;">🚪 Room Exits & Spawn Points (${room.id})</div>
          <div style="font-size: 0.78rem; color: #aaa;">Configure target room destination and exact spawn (x, y) coordinates when entering!</div>
          ${dirList.map(dir => {
            const ex = room.exits[dir] || { room: '', spawnX: 300, spawnY: 450 };
            return `
              <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); padding: 6px; border-radius: 4px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-weight: 700; color: var(--ghibli-sun-gold); text-transform: uppercase;">[${dir}] Exit Door</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                  <div><label style="font-size: 0.75rem;">Target Room:</label> <input type="text" class="exit-inp-room" data-dir="${dir}" value="${ex.room || ''}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  <div><label style="font-size: 0.75rem;">Spawn X:</label> <input type="number" class="exit-inp-spawnx" data-dir="${dir}" value="${ex.spawnX || 300}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  <div><label style="font-size: 0.75rem;">Spawn Y:</label> <input type="number" class="exit-inp-spawny" data-dir="${dir}" value="${ex.spawnY || 450}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (this.activeTab === 'obstacles') {
      const selectedObs = room.obstacles[this.selectedObstacleIdx];
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button id="btn-add-rect-obs" class="btn-ghibli" style="flex: 1; padding: 4px; font-size: 0.75rem;">+ Rect</button>
            <button id="btn-add-circle-obs" class="btn-ghibli" style="flex: 1; padding: 4px; font-size: 0.75rem;">+ Circle</button>
            <button id="btn-add-poly-obs" class="btn-ghibli btn-emerald" style="flex: 1; padding: 4px; font-size: 0.75rem; font-weight: 800;">+ Polygon</button>
          </div>

          ${selectedObs ? `
            <div style="background: rgba(168, 50, 50, 0.15); border: 1px solid #ff4d4d; padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-weight: 700; color: #ff4d4d;">Selected Barrier: [${this.selectedObstacleIdx}] ${selectedObs.label || (selectedObs.type || 'rect').toUpperCase()}</div>
              
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">Barrier Custom Name / Label:</label>
                <input type="text" id="obs-inp-label" value="${selectedObs.label || ''}" placeholder="e.g. 🪨 Mossy Boulder" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 3px; border-radius: 4px; margin-top: 2px;">
              </div>

              <div style="display: flex; gap: 12px; margin: 4px 0; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" id="obs-chk-solid" ${selectedObs.isSolid !== false ? 'checked' : ''}>
                  <label for="obs-chk-solid" style="font-weight: 700; color: #ff7777; font-size: 0.82rem;">🧱 Solid Collision</label>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" id="obs-chk-cutout" ${selectedObs.isCutout ? 'checked' : ''}>
                  <label for="obs-chk-cutout" style="font-weight: 700; color: #f4be42; font-size: 0.82rem;">🖼️ 2.5D Cutout</label>
                </div>
              </div>

              ${selectedObs.type === 'polygon' ? `
                <div style="font-size: 0.78rem; color: #6ee3a0;">Drag bright red vertex circles on canvas to shape polygon!</div>
                <div style="display: flex; gap: 6px; margin-top: 4px;">
                  <button id="btn-add-poly-vertex" class="btn-ghibli" style="flex: 1; padding: 2px 6px; font-size: 0.75rem;">+ Add Vertex</button>
                  <button id="btn-delete-obs" class="btn-ghibli" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 6px; font-size: 0.75rem;">🗑️ Delete Poly</button>
                </div>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                  <div><label>X:</label> <input type="number" id="obs-inp-x" value="${selectedObs.x}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  <div><label>Y:</label> <input type="number" id="obs-inp-y" value="${selectedObs.y}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  ${selectedObs.type === 'circle' ? `<div><label>Radius:</label> <input type="number" id="obs-inp-radius" value="${selectedObs.radius}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>` : `
                    <div><label>Width:</label> <input type="number" id="obs-inp-w" value="${selectedObs.w}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                    <div><label>Height:</label> <input type="number" id="obs-inp-h" value="${selectedObs.h}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  `}
                </div>
                <button id="btn-delete-obs" class="btn-ghibli" style="background: #a83232; color: #fff; border-color: #591515; padding: 4px;">🗑️ Delete Barrier</button>
              `}
            </div>
          ` : '<div style="color: #888; text-align: center;">Click red collision barrier on canvas to move/resize!</div>'}

          <div style="display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;">
            ${room.obstacles.map((obs, idx) => `
              <div style="background: ${this.selectedObstacleIdx === idx ? 'rgba(255, 77, 77, 0.25)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${this.selectedObstacleIdx === idx ? '#ff4d4d' : 'rgba(255,255,255,0.15)'}; padding: 4px 8px; border-radius: 4px; cursor: pointer;" class="editor-obs-item" data-idx="${idx}">
                <div style="font-weight: 700; color: #ff7777;">[${idx}] ${obs.label || (obs.type || 'rect').toUpperCase()} ${obs.isCutout ? '🖼️' : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.activeTab === 'props') {
      const selectedProp = room.props[this.selectedPropIdx];
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-add-prop" class="btn-ghibli" style="width: 100%; padding: 4px;">+ Add 2.5D Scenery Prop</button>

          ${selectedProp ? `
            <div style="background: rgba(78, 163, 115, 0.18); border: 1px solid #4ea373; padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-weight: 700; color: #4ea373;">Selected Prop: [${this.selectedPropIdx}] ${selectedProp.label}</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                <div><label>X:</label> <input type="number" id="prop-inp-x" value="${selectedProp.x}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                <div><label>Y:</label> <input type="number" id="prop-inp-y" value="${selectedProp.y}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                <div><label>DepthY:</label> <input type="number" id="prop-inp-depth" value="${selectedProp.depthY}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                <div><label>Icon Emoji:</label> <input type="text" id="prop-inp-icon" value="${selectedProp.icon || '🪵'}" style="width: 50px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
              </div>
              <div><label>Label:</label> <input type="text" id="prop-inp-label" value="${selectedProp.label}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
              <button id="btn-delete-prop" class="btn-ghibli" style="background: #a83232; color: #fff; border-color: #591515; padding: 4px;">🗑️ Delete Prop</button>
            </div>
          ` : '<div style="color: #888; text-align: center;">Click green scenery prop on canvas to drag & depth-sort!</div>'}

          <div style="display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;">
            ${room.props.map((p, idx) => `
              <div style="background: ${this.selectedPropIdx === idx ? 'rgba(78, 163, 115, 0.25)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${this.selectedPropIdx === idx ? '#4ea373' : 'rgba(255,255,255,0.15)'}; padding: 4px 8px; border-radius: 4px; cursor: pointer;" class="editor-prop-item" data-idx="${idx}">
                <div style="font-weight: 700; color: #6ee3a0;">${p.icon || '🪵'} ${p.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.activeTab === 'hotspots') {
      const selected = room.hotspots[this.selectedHotspotIdx];
      return `
        <button id="btn-add-hotspot" class="btn-ghibli" style="width: 100%; padding: 4px;">+ Add Hotspot Box</button>
        ${selected ? `
          <div style="background: rgba(244, 190, 66, 0.15); border: 1px solid var(--ghibli-sun-gold); padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; color: var(--ghibli-sun-gold);">Selected: [${this.selectedHotspotIdx}] ${selected.label}</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
              <div><label>X:</label> <input type="number" id="hs-inp-x" value="${selected.x}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
              <div><label>Y:</label> <input type="number" id="hs-inp-y" value="${selected.y}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
              <div><label>Width:</label> <input type="number" id="hs-inp-w" value="${selected.w}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
              <div><label>Height:</label> <input type="number" id="hs-inp-h" value="${selected.h}" style="width: 60px; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
            </div>
            ${selected.type === 'door' ? `
              <div style="background: rgba(110, 227, 160, 0.12); border: 1px solid #6ee3a0; padding: 6px; border-radius: 4px; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-weight: 700; color: #6ee3a0; font-size: 0.78rem;">🚪 Target Door Spawn Coordinates</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                  <div><label style="font-size: 0.7rem;">Target Room:</label> <input type="text" id="hs-inp-targetroom" value="${selected.targetRoom || ''}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  <div><label style="font-size: 0.7rem;">Spawn X:</label> <input type="number" id="hs-inp-spawnx" value="${selected.spawnX || 300}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                  <div><label style="font-size: 0.7rem;">Spawn Y:</label> <input type="number" id="hs-inp-spawny" value="${selected.spawnY || 450}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
                </div>
              </div>
            ` : ''}
            <div><label>Label:</label> <input type="text" id="hs-inp-label" value="${selected.label}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px;"></div>
            <button id="btn-delete-hs" class="btn-ghibli" style="background: #a83232; color: #fff; border-color: #591515; padding: 4px;">🗑️ Delete Hotspot</button>
          </div>
        ` : '<div style="color: #888; text-align: center;">Click any hotspot box on canvas to drag/resize!</div>'}

        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;">
          ${room.hotspots.map((hs, idx) => `
            <div style="background: ${this.selectedHotspotIdx === idx ? 'rgba(244, 190, 66, 0.25)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${this.selectedHotspotIdx === idx ? '#f4be42' : 'rgba(255,255,255,0.15)'}; padding: 4px 8px; border-radius: 4px; cursor: pointer;" class="editor-hs-item" data-idx="${idx}">
              <div style="font-weight: 700; color: var(--ghibli-sun-gold);">${hs.label}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (this.activeTab === 'depth') {
      const depthConfig = room.depthScale || {
        yMin: room.bounds ? room.bounds.yMin : 320,
        yMax: room.bounds ? room.bounds.yMax : 650,
        minScale: 2.2,
        maxScale: 4.2
      };
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="font-weight: 800; color: var(--ghibli-sun-gold); font-size: 0.95rem;">📐 Room Depth Perspective Scaling</div>
          <div style="font-size: 0.78rem; color: #ccc;">Adjust min scale (far horizon) and max scale (foreground camera) for ${room.title}!</div>
          
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
            <div>
              <div style="display: flex; justify-content: space-between;">
                <label style="font-weight: 700; color: #6ee3a0;">Horizon Min Scale (Far Away):</label>
                <span id="lbl-min-scale" style="font-weight: 800; color: var(--ghibli-sun-gold);">${depthConfig.minScale.toFixed(1)}x</span>
              </div>
              <input type="range" id="rng-min-scale" min="1.0" max="4.0" step="0.1" value="${depthConfig.minScale}" style="width: 100%; margin-top: 4px;">
            </div>

            <div>
              <div style="display: flex; justify-content: space-between;">
                <label style="font-weight: 700; color: #ff7777;">Foreground Max Scale (Close Up):</label>
                <span id="lbl-max-scale" style="font-weight: 800; color: var(--ghibli-sun-gold);">${depthConfig.maxScale.toFixed(1)}x</span>
              </div>
              <input type="range" id="rng-max-scale" min="2.0" max="6.0" step="0.1" value="${depthConfig.maxScale}" style="width: 100%; margin-top: 4px;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: #3a86ff;">yMin (Horizon Y):</label>
                <input type="number" id="inp-depth-ymin" value="${depthConfig.yMin}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px 4px; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: #3a86ff;">yMax (Foreground Y):</label>
                <input type="number" id="inp-depth-ymax" value="${depthConfig.yMax}" style="width: 100%; background: #000; color: #fff; border: 1px solid #666; padding: 2px 4px; border-radius: 4px;">
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-weight: 700; color: #3a86ff;">🔵 Walk Bounds Editor</div>
          <div style="font-size: 0.8rem; color: #aaa;">Drag top blue line handle for yMin or bottom blue line handle for yMax directly on canvas!</div>
          <div><label style="color: #3a86ff; font-weight: 700;">yMin (Top Wall):</label> <input type="number" id="inp-ymin" value="${room.bounds.yMin}" style="width: 70px; background: #000; color: #fff; border: 1px solid #666; padding: 2px 6px;"></div>
          <div><label style="color: #3a86ff; font-weight: 700;">yMax (Bottom Wall):</label> <input type="number" id="inp-ymax" value="${room.bounds.yMax}" style="width: 70px; background: #000; color: #fff; border: 1px solid #666; padding: 2px 6px;"></div>
        </div>
      `;
    }
  }

  attachTabEvents(room) {
    if (this.activeTab === 'exits') {
      this.panelElement.querySelectorAll('.exit-inp-room').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const dir = e.target.getAttribute('data-dir');
          if (!room.exits[dir]) room.exits[dir] = { room: '', spawnX: 300, spawnY: 450 };
          room.exits[dir].room = e.target.value;
        });
      });

      this.panelElement.querySelectorAll('.exit-inp-spawnx').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const dir = e.target.getAttribute('data-dir');
          if (!room.exits[dir]) room.exits[dir] = { room: '', spawnX: 300, spawnY: 450 };
          room.exits[dir].spawnX = parseInt(e.target.value) || 300;
        });
      });

      this.panelElement.querySelectorAll('.exit-inp-spawny').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const dir = e.target.getAttribute('data-dir');
          if (!room.exits[dir]) room.exits[dir] = { room: '', spawnX: 300, spawnY: 450 };
          room.exits[dir].spawnY = parseInt(e.target.value) || 450;
        });
      });
    } else if (this.activeTab === 'obstacles') {
      const addRectBtn = this.panelElement.querySelector('#btn-add-rect-obs');
      if (addRectBtn) {
        addRectBtn.addEventListener('click', () => {
          room.obstacles.push({
            id: `obs_${Date.now()}`,
            type: 'rect',
            label: '🪨 Rect Barrier',
            x: 500,
            y: 400,
            w: 120,
            h: 80
          });
          this.selectedObstacleIdx = room.obstacles.length - 1;
          this.refreshPanel();
        });
      }

      const addCircleBtn = this.panelElement.querySelector('#btn-add-circle-obs');
      if (addCircleBtn) {
        addCircleBtn.addEventListener('click', () => {
          room.obstacles.push({
            id: `obs_${Date.now()}`,
            type: 'circle',
            label: '🪨 Circle Barrier',
            x: 500,
            y: 450,
            radius: 50
          });
          this.selectedObstacleIdx = room.obstacles.length - 1;
          this.refreshPanel();
        });
      }

      const addPolyBtn = this.panelElement.querySelector('#btn-add-poly-obs');
      if (addPolyBtn) {
        addPolyBtn.addEventListener('click', () => {
          const newPts = [
            { x: 450, y: 380 },
            { x: 620, y: 350 },
            { x: 580, y: 480 },
            { x: 400, y: 450 }
          ];
          room.obstacles.push({
            id: `obs_${Date.now()}`,
            type: 'polygon',
            label: '🪨 Polygon Rock Barrier',
            isCutout: true,
            depthY: Math.max(...newPts.map(p => p.y)),
            points: newPts
          });
          this.selectedObstacleIdx = room.obstacles.length - 1;
          this.refreshPanel();
        });
      }

      const addVertexBtn = this.panelElement.querySelector('#btn-add-poly-vertex');
      if (addVertexBtn) {
        addVertexBtn.addEventListener('click', () => {
          const obs = room.obstacles[this.selectedObstacleIdx];
          if (obs && obs.type === 'polygon' && obs.points) {
            const lastPt = obs.points[obs.points.length - 1] || { x: 500, y: 400 };
            obs.points.push({ x: lastPt.x + 30, y: lastPt.y + 30 });
            obs.depthY = Math.max(...obs.points.map(p => p.y));
            this.refreshPanel();
          }
        });
      }

      this.panelElement.querySelectorAll('.editor-obs-item').forEach(el => {
        el.addEventListener('click', (e) => {
          this.selectedObstacleIdx = parseInt(e.currentTarget.getAttribute('data-idx'));
          this.refreshPanel();
        });
      });

      const selectedObs = room.obstacles[this.selectedObstacleIdx];
      if (selectedObs) {
        const inpLabel = this.panelElement.querySelector('#obs-inp-label');
        if (inpLabel) {
          inpLabel.addEventListener('input', (e) => {
            selectedObs.label = e.target.value;
          });
        }

        const chkSolid = this.panelElement.querySelector('#obs-chk-solid');
        if (chkSolid) {
          chkSolid.addEventListener('change', (e) => {
            selectedObs.isSolid = e.target.checked;
            synth.playClick();
          });
        }

        const chkCutout = this.panelElement.querySelector('#obs-chk-cutout');
        if (chkCutout) {
          chkCutout.addEventListener('change', (e) => {
            selectedObs.isCutout = e.target.checked;
            if (selectedObs.points && selectedObs.points.length > 0) {
              selectedObs.depthY = Math.max(...selectedObs.points.map(p => p.y));
            }
            synth.playClick();
          });
        }

        ['x', 'y', 'w', 'h', 'radius'].forEach(f => {
          const inp = this.panelElement.querySelector(`#obs-inp-${f}`);
          if (inp) {
            inp.addEventListener('input', (e) => {
              selectedObs[f] = parseInt(e.target.value) || 0;
            });
          }
        });

        const delBtn = this.panelElement.querySelector('#btn-delete-obs');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            room.obstacles.splice(this.selectedObstacleIdx, 1);
            this.selectedObstacleIdx = -1;
            this.refreshPanel();
          });
        }
      }
    } else if (this.activeTab === 'props') {
      const addPropBtn = this.panelElement.querySelector('#btn-add-prop');
      if (addPropBtn) {
        addPropBtn.addEventListener('click', () => {
          room.props.push({
            id: `prop_${Date.now()}`,
            label: '🌲 New Scenery Prop',
            icon: '🌲',
            x: 600,
            y: 450,
            depthY: 450,
            isInteractable: false
          });
          this.selectedPropIdx = room.props.length - 1;
          this.refreshPanel();
        });
      }

      this.panelElement.querySelectorAll('.editor-prop-item').forEach(el => {
        el.addEventListener('click', (e) => {
          this.selectedPropIdx = parseInt(e.currentTarget.getAttribute('data-idx'));
          this.refreshPanel();
        });
      });

      const selectedProp = room.props[this.selectedPropIdx];
      if (selectedProp) {
        ['x', 'y', 'depthY', 'label', 'icon'].forEach(f => {
          const inp = this.panelElement.querySelector(`#prop-inp-${f === 'depthY' ? 'depth' : f}`);
          if (inp) {
            inp.addEventListener('input', (e) => {
              if (f === 'label' || f === 'icon') selectedProp[f] = e.target.value;
              else selectedProp[f] = parseInt(e.target.value) || 0;
            });
          }
        });

        const delBtn = this.panelElement.querySelector('#btn-delete-prop');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            room.props.splice(this.selectedPropIdx, 1);
            this.selectedPropIdx = -1;
            this.refreshPanel();
          });
        }
      }
    } else if (this.activeTab === 'hotspots') {
      const addBtn = this.panelElement.querySelector('#btn-add-hotspot');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          room.hotspots.push({
            id: `hs_${Date.now()}`,
            label: '📍 New Hotspot',
            x: 400,
            y: 400,
            w: 120,
            h: 120,
            type: 'action',
            desc: 'Custom interactive hotspot description.'
          });
          this.selectedHotspotIdx = room.hotspots.length - 1;
          this.refreshPanel();
        });
      }

      this.panelElement.querySelectorAll('.editor-hs-item').forEach(el => {
        el.addEventListener('click', (e) => {
          this.selectedHotspotIdx = parseInt(e.currentTarget.getAttribute('data-idx'));
          this.refreshPanel();
        });
      });

      const selected = room.hotspots[this.selectedHotspotIdx];
      if (selected) {
        const inpTR = this.panelElement.querySelector('#hs-inp-targetroom');
        if (inpTR) inpTR.addEventListener('input', (e) => { selected.targetRoom = e.target.value; });

        const inpSX = this.panelElement.querySelector('#hs-inp-spawnx');
        if (inpSX) inpSX.addEventListener('input', (e) => { selected.spawnX = parseInt(e.target.value) || 300; });

        const inpSY = this.panelElement.querySelector('#hs-inp-spawny');
        if (inpSY) inpSY.addEventListener('input', (e) => { selected.spawnY = parseInt(e.target.value) || 450; });

        ['x', 'y', 'w', 'h', 'label'].forEach(field => {
          const inp = this.panelElement.querySelector(`#hs-inp-${field}`);
          if (inp) {
            inp.addEventListener('input', (e) => {
              if (field === 'label') selected.label = e.target.value;
              else selected[field] = parseInt(e.target.value) || 0;
            });
          }
        });

        const delBtn = this.panelElement.querySelector('#btn-delete-hs');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            room.hotspots.splice(this.selectedHotspotIdx, 1);
            this.selectedHotspotIdx = -1;
            this.refreshPanel();
          });
        }
      }
    } else if (this.activeTab === 'depth') {
      if (!room.depthScale) {
        room.depthScale = {
          yMin: room.bounds ? room.bounds.yMin : 320,
          yMax: room.bounds ? room.bounds.yMax : 650,
          minScale: 2.2,
          maxScale: 4.2
        };
      }

      const rngMin = this.panelElement.querySelector('#rng-min-scale');
      const rngMax = this.panelElement.querySelector('#rng-max-scale');
      const inpYMin = this.panelElement.querySelector('#inp-depth-ymin');
      const inpYMax = this.panelElement.querySelector('#inp-depth-ymax');

      if (rngMin) {
        rngMin.addEventListener('input', (e) => {
          room.depthScale.minScale = parseFloat(e.target.value);
          const lbl = this.panelElement.querySelector('#lbl-min-scale');
          if (lbl) lbl.innerText = `${room.depthScale.minScale.toFixed(1)}x`;
        });
      }

      if (rngMax) {
        rngMax.addEventListener('input', (e) => {
          room.depthScale.maxScale = parseFloat(e.target.value);
          const lbl = this.panelElement.querySelector('#lbl-max-scale');
          if (lbl) lbl.innerText = `${room.depthScale.maxScale.toFixed(1)}x`;
        });
      }

      if (inpYMin) {
        inpYMin.addEventListener('input', (e) => {
          room.depthScale.yMin = parseInt(e.target.value) || 300;
        });
      }

      if (inpYMax) {
        inpYMax.addEventListener('input', (e) => {
          room.depthScale.yMax = parseInt(e.target.value) || 660;
        });
      }
    } else {
      const inpYMin = this.panelElement.querySelector('#inp-ymin');
      const inpYMax = this.panelElement.querySelector('#inp-ymax');
      if (inpYMin) inpYMin.addEventListener('change', (e) => { room.bounds.yMin = parseInt(e.target.value); });
      if (inpYMax) inpYMax.addEventListener('change', (e) => { room.bounds.yMax = parseInt(e.target.value); });
    }
  }

  handleMouseDown(x, y, room) {
    if (!this.isActive || !room) return false;

    // Check Walk Bounds Y-Line Drag Handles
    if (Math.abs(y - room.bounds.yMin) <= 14) {
      this.dragMode = 'drag-ymin';
      this.dragStart = { x, y };
      this.initialBox = { yMin: room.bounds.yMin };
      return true;
    }
    if (Math.abs(y - room.bounds.yMax) <= 14) {
      this.dragMode = 'drag-ymax';
      this.dragStart = { x, y };
      this.initialBox = { yMax: room.bounds.yMax };
      return true;
    }

    // Check Obstacles Selection / Drag / Polygon Vertex Drag Handles
    if (room.obstacles) {
      for (let idx = room.obstacles.length - 1; idx >= 0; idx--) {
        const obs = room.obstacles[idx];

        if (obs.type === 'polygon' && obs.points) {
          // 1. Check Vertex Handle Drag (Large 28px Hit Area)
          for (let vIdx = 0; vIdx < obs.points.length; vIdx++) {
            const pt = obs.points[vIdx];
            if (Math.hypot(x - pt.x, y - pt.y) <= 28) {
              this.selectedObstacleIdx = idx;
              this.selectedPolyVertexIdx = vIdx;
              this.dragMode = 'move-poly-vertex';
              this.dragStart = { x, y };
              this.initialBox = { ptX: pt.x, ptY: pt.y };
              this.refreshPanel();
              return true;
            }
          }

          // 2. Check Whole Polygon Shape Drag (Inside Polygon)
          if (this.isPointInPoly(x, y, obs.points)) {
            this.selectedObstacleIdx = idx;
            this.dragMode = 'move-poly';
            this.dragStart = { x, y };
            this.initialBox = { points: obs.points.map(p => ({ x: p.x, y: p.y })) };
            this.refreshPanel();
            return true;
          }
        } else if (obs.type === 'circle') {
          const dist = Math.hypot(x - obs.x, y - obs.y);
          if (Math.abs(dist - obs.radius) <= 14) {
            this.selectedObstacleIdx = idx;
            this.dragMode = 'resize-obs';
            this.dragStart = { x, y };
            this.initialBox = { x: obs.x, y: obs.y, radius: obs.radius };
            this.refreshPanel();
            return true;
          }
          if (dist <= obs.radius) {
            this.selectedObstacleIdx = idx;
            this.dragMode = 'move-obs';
            this.dragStart = { x, y };
            this.initialBox = { x: obs.x, y: obs.y };
            this.refreshPanel();
            return true;
          }
        } else {
          const handleX = obs.x + obs.w;
          const handleY = obs.y + obs.h;
          if (Math.abs(x - handleX) <= 16 && Math.abs(y - handleY) <= 16) {
            this.selectedObstacleIdx = idx;
            this.dragMode = 'resize-obs';
            this.dragStart = { x, y };
            this.initialBox = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
            this.refreshPanel();
            return true;
          }

          if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
            this.selectedObstacleIdx = idx;
            this.dragMode = 'move-obs';
            this.dragStart = { x, y };
            this.initialBox = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
            this.refreshPanel();
            return true;
          }
        }
      }
    }

    // Check Props Selection / Drag
    if (room.props) {
      for (let idx = room.props.length - 1; idx >= 0; idx--) {
        const p = room.props[idx];
        if (Math.hypot(x - p.x, y - p.y) <= 30) {
          this.selectedPropIdx = idx;
          this.dragMode = 'move-prop';
          this.dragStart = { x, y };
          this.initialBox = { x: p.x, y: p.y, depthY: p.depthY };
          this.refreshPanel();
          return true;
        }
      }
    }

    // Check Hotspots Selection / Drag / Resize Corner Handle
    if (room.hotspots) {
      for (let idx = room.hotspots.length - 1; idx >= 0; idx--) {
        const hs = room.hotspots[idx];
        const handleX = hs.x + hs.w;
        const handleY = hs.y + hs.h;

        if (Math.abs(x - handleX) <= 16 && Math.abs(y - handleY) <= 16) {
          this.selectedHotspotIdx = idx;
          this.dragMode = 'resize-hs';
          this.dragStart = { x, y };
          this.initialBox = { x: hs.x, y: hs.y, w: hs.w, h: hs.h };
          this.refreshPanel();
          return true;
        }

        if (x >= hs.x && x <= hs.x + hs.w && y >= hs.y && y <= hs.y + hs.h) {
          this.selectedHotspotIdx = idx;
          this.dragMode = 'move-hs';
          this.dragStart = { x, y };
          this.initialBox = { x: hs.x, y: hs.y, w: hs.w, h: hs.h };
          this.refreshPanel();
          return true;
        }
      }
    }

    return false;
  }

  isPointInPoly(px, py, points) {
    if (!points || points.length < 3) return false;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  handleMouseMove(x, y, room) {
    if (!this.isActive || !this.dragMode || !room) return;

    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;

    if (this.dragMode === 'move-poly-vertex' && this.selectedObstacleIdx >= 0 && this.selectedPolyVertexIdx >= 0) {
      const obs = room.obstacles[this.selectedObstacleIdx];
      if (obs && obs.points && obs.points[this.selectedPolyVertexIdx]) {
        const pt = obs.points[this.selectedPolyVertexIdx];
        pt.x = Math.round(this.initialBox.ptX + dx);
        pt.y = Math.round(this.initialBox.ptY + dy);
        obs.depthY = Math.max(...obs.points.map(p => p.y));
      }
    } else if (this.dragMode === 'move-poly' && this.selectedObstacleIdx >= 0 && this.initialBox.points) {
      const obs = room.obstacles[this.selectedObstacleIdx];
      if (obs && obs.points) {
        obs.points.forEach((pt, idx) => {
          const initPt = this.initialBox.points[idx];
          if (initPt) {
            pt.x = Math.round(initPt.x + dx);
            pt.y = Math.round(initPt.y + dy);
          }
        });
        obs.depthY = Math.max(...obs.points.map(p => p.y));
      }
    } else if (this.dragMode === 'move-hs' && this.selectedHotspotIdx >= 0) {
      const hs = room.hotspots[this.selectedHotspotIdx];
      if (hs) {
        hs.x = Math.round(this.initialBox.x + dx);
        hs.y = Math.round(this.initialBox.y + dy);
      }
    } else if (this.dragMode === 'resize-hs' && this.selectedHotspotIdx >= 0) {
      const hs = room.hotspots[this.selectedHotspotIdx];
      if (hs) {
        hs.w = Math.max(30, Math.round(this.initialBox.w + dx));
        hs.h = Math.max(30, Math.round(this.initialBox.h + dy));
      }
    } else if (this.dragMode === 'move-obs' && this.selectedObstacleIdx >= 0) {
      const obs = room.obstacles[this.selectedObstacleIdx];
      if (obs) {
        obs.x = Math.round(this.initialBox.x + dx);
        obs.y = Math.round(this.initialBox.y + dy);
      }
    } else if (this.dragMode === 'resize-obs' && this.selectedObstacleIdx >= 0) {
      const obs = room.obstacles[this.selectedObstacleIdx];
      if (obs) {
        if (obs.type === 'circle') {
          obs.radius = Math.max(15, Math.round(this.initialBox.radius + dx));
        } else {
          obs.w = Math.max(20, Math.round(this.initialBox.w + dx));
          obs.h = Math.max(20, Math.round(this.initialBox.h + dy));
        }
      }
    } else if (this.dragMode === 'move-prop' && this.selectedPropIdx >= 0) {
      const p = room.props[this.selectedPropIdx];
      if (p) {
        p.x = Math.round(this.initialBox.x + dx);
        p.y = Math.round(this.initialBox.y + dy);
        p.depthY = p.y;
      }
    } else if (this.dragMode === 'drag-ymin') {
      room.bounds.yMin = Math.round(this.initialBox.yMin + dy);
    } else if (this.dragMode === 'drag-ymax') {
      room.bounds.yMax = Math.round(this.initialBox.yMax + dy);
    }
  }

  handleMouseUp() {
    if (this.dragMode) {
      this.refreshPanel();
    }
    this.dragMode = null;
  }

  renderEditorOverlay(ctx, room) {
    if (!this.isActive || !room) return;

    ctx.save();

    // Render Walk Bounds Line with Drag Handles
    ctx.strokeStyle = '#3a86ff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(room.bounds.xMin, room.bounds.yMin, room.bounds.xMax - room.bounds.xMin, room.bounds.yMax - room.bounds.yMin);

    // Walk Bounds Y Line Handles
    ctx.fillStyle = '#3a86ff';
    ctx.fillRect(room.bounds.xMin, room.bounds.yMin - 5, room.bounds.xMax - room.bounds.xMin, 10);
    ctx.fillRect(room.bounds.xMin, room.bounds.yMax - 5, room.bounds.xMax - room.bounds.xMin, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px sans-serif';
    ctx.fillText(`🔵 yMin Wall: ${room.bounds.yMin} (Drag Line)`, room.bounds.xMin + 10, room.bounds.yMin - 8);
    ctx.fillText(`🔵 yMax Wall: ${room.bounds.yMax} (Drag Line)`, room.bounds.xMin + 10, room.bounds.yMax + 18);

    // Render Red Collision Obstacles, Polygon Vertices & Custom Barrier Labels
    if (room.obstacles) {
      room.obstacles.forEach((obs, idx) => {
        const isSelected = this.selectedObstacleIdx === idx;
        ctx.fillStyle = isSelected ? 'rgba(255, 77, 77, 0.45)' : 'rgba(255, 77, 77, 0.25)';
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash([]);

        const displayLabel = obs.label || `🪨 [${idx}] ${(obs.type || 'rect').toUpperCase()}`;

        if (obs.type === 'polygon' && obs.points && obs.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(obs.points[0].x, obs.points[0].y);
          for (let i = 1; i < obs.points.length; i++) {
            ctx.lineTo(obs.points[i].x, obs.points[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Render High-Visibility Bright Red Polygon Vertex Drag Handles (10px Radius Circle)
          obs.points.forEach((pt, vIdx) => {
            const isVertexSelected = isSelected && this.selectedPolyVertexIdx === vIdx;
            ctx.fillStyle = isVertexSelected ? '#ffff00' : '#ff2222';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          });

          // Render Green Curved Depth Baseline if Cutout is active
          if (obs.isCutout) {
            const minX = Math.min(...obs.points.map(p => p.x));
            const maxX = Math.max(...obs.points.map(p => p.x));

            ctx.save();
            ctx.strokeStyle = '#6ee3a0';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            
            // Draw per-X curved baseline across polygon width
            let isFirst = true;
            for (let curX = minX; curX <= maxX; curX += 10) {
              let maxY = -Infinity;
              for (let i = 0; i < obs.points.length; i++) {
                const p1 = obs.points[i];
                const p2 = obs.points[(i + 1) % obs.points.length];
                const segMinX = Math.min(p1.x, p2.x);
                const segMaxX = Math.max(p1.x, p2.x);
                if (curX >= segMinX && curX <= segMaxX && segMinX !== segMaxX) {
                  const t = (curX - p1.x) / (p2.x - p1.x);
                  const yAtX = p1.y + t * (p2.y - p1.y);
                  if (yAtX > maxY) maxY = yAtX;
                }
              }
              if (maxY !== -Infinity) {
                if (isFirst) { ctx.moveTo(curX, maxY); isFirst = false; }
                else { ctx.lineTo(curX, maxY); }
              }
            }
            ctx.stroke();

            ctx.fillStyle = '#6ee3a0';
            ctx.font = '700 11px sans-serif';
            ctx.fillText(`🟢 Curved 2.5D Base (Dynamic Depth)`, minX - 10, Math.max(...obs.points.map(p => p.y)) + 16);
            ctx.restore();
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 11px sans-serif';
          ctx.fillText(`${displayLabel} ${obs.isCutout ? '🖼️ (2.5D Cutout)' : ''}`, obs.points[0].x - 20, obs.points[0].y - 10);

        } else if (obs.type === 'circle') {
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Circle Radius Handle
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(obs.x + obs.radius, obs.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 11px sans-serif';
          ctx.fillText(displayLabel, obs.x - 20, obs.y - 6);
        } else {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          // Rect Resize Handle (Bottom-Right)
          ctx.fillStyle = '#ff3333';
          ctx.fillRect(obs.x + obs.w - 10, obs.y + obs.h - 10, 10, 10);

          ctx.fillStyle = '#ffffff';
          ctx.font = '700 11px sans-serif';
          ctx.fillText(displayLabel, obs.x - 20, obs.y - 6);
        }
      });
    }

    // Render Green Scenery Props
    if (room.props) {
      room.props.forEach((prop, idx) => {
        const isSelected = this.selectedPropIdx === idx;
        ctx.strokeStyle = isSelected ? '#ffffff' : '#4ea373';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(prop.x, prop.y, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#6ee3a0';
        ctx.font = '700 11px sans-serif';
        ctx.fillText(`🪵 [${idx}] ${prop.label}`, prop.x - 25, prop.y + 35);
      });
    }

    // Render Hotspots Bounding Boxes & Corner Resize Handles
    if (room.hotspots) {
      room.hotspots.forEach((hs, idx) => {
        const isSelected = this.selectedHotspotIdx === idx;
        ctx.fillStyle = isSelected ? 'rgba(244, 190, 66, 0.35)' : 'rgba(244, 190, 66, 0.15)';
        ctx.strokeStyle = isSelected ? '#ffffff' : '#f4be42';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash([]);
        ctx.fillRect(hs.x, hs.y, hs.w, hs.h);
        ctx.strokeRect(hs.x, hs.y, hs.w, hs.h);

        // Bottom-Right Resize Handle
        ctx.fillStyle = '#f4be42';
        ctx.fillRect(hs.x + hs.w - 12, hs.y + hs.h - 12, 12, 12);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px sans-serif';
        ctx.fillText(`[${idx}] ${hs.label}`, hs.x + 4, hs.y + 14);
      });
    }

    ctx.restore();
  }

  exportRoomJSON() {
    const room = this.gameEngine.explorationScene.getCurrentRoomData();
    const cleanRoom = {
      id: room.id,
      title: room.title,
      desc: room.desc,
      bounds: room.bounds,
      exits: room.exits,
      obstacles: room.obstacles,
      props: room.props,
      hotspots: room.hotspots
    };

    const jsonStr = JSON.stringify(cleanRoom, null, 2);

    const dialogueLayer = document.getElementById('dialogue-layer');
    dialogueLayer.style.display = 'flex';
    dialogueLayer.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 720px;">
        <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--text-dark); margin-bottom: 8px;">
          📋 Exported Room Definition JSON (${room.id})
        </div>
        <textarea style="width: 100%; height: 320px; background: #0c140e; color: #78e8a0; font-family: monospace; font-size: 0.85rem; padding: 12px; border-radius: 8px; border: 1px solid var(--parchment-border); margin-bottom: 14px;">${jsonStr}</textarea>
        <button id="btn-close-json-export" class="btn-ghibli btn-emerald" style="width: 100%; height: 42px; justify-content: center;">Close Exporter</button>
      </div>
    `;

    dialogueLayer.querySelector('#btn-close-json-export').addEventListener('click', () => {
      dialogueLayer.style.display = 'none';
    });
  }
}
