import { synth } from './SoundSynth.js';

export class AdminStudio {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.isActive = false;

    // Active File Key
    this.activeFile = 'dialogues.json'; // 'dialogues.json' | 'items.json' | 'enemies.json' | 'events.json' | 'spells.json' | 'shops.json' | 'sfx.json' | 'rooms.json' | 'quests.json'
    this.editorMode = 'form'; // 'form' | 'code'
    
    this.isValidJSON = true;
    this.rawJSONText = '';

    this.modalElement = null;
    this.initAdminUI();
  }

  toggleStudio() {
    this.isActive = !this.isActive;
    synth.playClick();
    if (this.isActive) {
      this.modalElement.style.display = 'flex';
      this.loadFileContent(this.activeFile);
      this.gameEngine.showNotification('👑 REALM ADMIN STUDIO Active! Visual Dialogue Tree Builder enabled.');
    } else {
      this.modalElement.style.display = 'none';
      this.gameEngine.showNotification('👑 REALM ADMIN STUDIO Closed.');
    }
  }

  initAdminUI() {
    this.modalElement = document.createElement('div');
    this.modalElement.id = 'admin-studio-layer';
    this.modalElement.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 120;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    document.getElementById('game-container').appendChild(this.modalElement);
  }

  loadFileContent(fileKey) {
    this.activeFile = fileKey;
    let data = null;

    if (fileKey === 'rooms.json') {
      data = this.gameEngine.explorationScene.rooms;
    } else if (fileKey === 'items.json') {
      data = this.gameEngine.gameRegistry.items;
    } else if (fileKey === 'enemies.json') {
      data = this.gameEngine.gameRegistry.enemies;
    } else if (fileKey === 'quests.json') {
      data = this.gameEngine.questSystem.quests;
    } else if (fileKey === 'events.json') {
      data = this.gameEngine.eventEngine.actionTypes;
    } else if (fileKey === 'dialogues.json') {
      data = [
        {
          id: 'root',
          npcId: 'guildmaster',
          npcName: 'Guildmaster Bruno',
          text: 'Welcome to the Adventurers Guild, Hero! What knowledge or bounties do you seek today?',
          options: [
            { text: 'Ask about the Goblin Bounty in Mistvale Forest', targetNode: 'goblins_branch', reqClass: 'None' },
            { text: 'Ask about the Shadow Arch-Lich threat', targetNode: 'ans_archlich', reqClass: 'None' },
            { text: '[FIGHTER] Ask how to improve sword technique', targetNode: 'ans_sword', reqClass: 'Fighter' },
            { text: 'Farewell Guildmaster.', targetNode: 'end_dialogue', reqClass: 'None' }
          ]
        },
        {
          id: 'goblins_branch',
          npcId: 'guildmaster',
          npcName: 'Guildmaster Bruno',
          text: 'The Goblins have established a war camp in eastern Mistvale Forest! Defeat their spearmen and Chieftain for a reward of 25 Sierra Score Points & Gold.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root', reqClass: 'None' },
            { text: 'I will head into the forest now!', targetNode: 'end_dialogue', reqClass: 'None' }
          ]
        },
        {
          id: 'ans_archlich',
          npcId: 'guildmaster',
          npcName: 'Guildmaster Bruno',
          text: 'The Shadow Arch-Lich looms inside the Void Citadel! Only a hero armed with high stats and powerful equipment can vanquish him.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root', reqClass: 'None' },
            { text: 'I shall prepare for battle!', targetNode: 'end_dialogue', reqClass: 'None' }
          ]
        },
        {
          id: 'ans_sword',
          npcId: 'guildmaster',
          npcName: 'Guildmaster Bruno',
          text: 'Practice on the straw dummy in this room! Every drill increases your Weaponry stat and Strength.',
          options: [
            { text: 'Ask about another topic...', targetNode: 'root', reqClass: 'None' },
            { text: 'Thank you Guildmaster!', targetNode: 'end_dialogue', reqClass: 'None' }
          ]
        }
      ];
    } else if (fileKey === 'spells.json') {
      data = [
        { id: 'open', name: 'Open Magical Lock', mpCost: 5, apCost: 3, type: 'utility', desc: 'Pops open iron locks & chest latches.' },
        { id: 'zap', name: 'Arcane Zap', mpCost: 8, apCost: 3, type: 'damage', power: 18, element: 'lightning', desc: 'Crackling electric bolt dealing 18 damage.' },
        { id: 'flame', name: 'Fireball Explosion', mpCost: 14, apCost: 4, type: 'damage', power: 30, element: 'fire', desc: 'Hurls a fiery blast dealing 30 damage.' },
        { id: 'heal', name: 'Divine Restoration', mpCost: 10, apCost: 3, type: 'heal', power: 35, element: 'holy', desc: 'Restores +35 HP instantly.' }
      ];
    } else if (fileKey === 'shops.json') {
      data = [
        { id: 'zara_shop', name: 'Sorceress Zara Arcana Shop', items: ['healing_elixir', 'mana_essence', 'arcane_staff', 'moonflower_herb'] }
      ];
    } else if (fileKey === 'sfx.json') {
      data = [
        { id: 'gold', label: '💰 Gold Coins Pickup Jingle' },
        { id: 'spell', label: '🔮 Arcane Spell Blast' },
        { id: 'swing', label: '🗡️ Sword Slash Swing' },
        { id: 'hit', label: '💥 Heavy Combat Hit' },
        { id: 'parry', label: '🛡️ Metallic Shield Parry' },
        { id: 'fanfare', label: '🏆 Quest Complete Fanfare' }
      ];
    }

    this.rawJSONText = JSON.stringify(data, null, 2);
    this.validateCurrentJSON();
    this.renderStudioModal();
  }

  validateCurrentJSON() {
    try {
      JSON.parse(this.rawJSONText);
      this.isValidJSON = true;
    } catch (e) {
      this.isValidJSON = false;
    }
  }

  renderStudioModal() {
    this.modalElement.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 1080px; height: 640px; max-width: 98%; display: flex; flex-direction: column; gap: 10px; padding: 18px 24px;">
        
        <!-- Admin Studio Header Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem; color: var(--text-dark);">👑 Realm Admin World Studio</span>
            <span style="background: ${this.isValidJSON ? 'rgba(56, 118, 84, 0.25)' : 'rgba(168, 50, 50, 0.25)'}; color: ${this.isValidJSON ? '#1e5e3a' : '#a83232'}; border: 1px solid ${this.isValidJSON ? '#387654' : '#a83232'}; padding: 2px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem;">
              ${this.isValidJSON ? '✅ Valid JSON' : '❌ Syntax Error'}
            </span>
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="btn-mode-form" class="btn-ghibli ${this.editorMode === 'form' ? 'btn-emerald' : ''}" style="padding: 4px 14px; font-size: 0.82rem;">Visual Form Editor</button>
            <button id="btn-mode-code" class="btn-ghibli ${this.editorMode === 'code' ? 'btn-emerald' : ''}" style="padding: 4px 14px; font-size: 0.82rem;">Raw JSON Code</button>
            <button id="btn-close-admin-studio" class="btn-ghibli" style="padding: 4px 12px; font-size: 0.82rem;">✕ Close</button>
          </div>
        </div>

        <!-- Main Body: File Tree Sidebar + Editor Workspace -->
        <div style="display: flex; gap: 16px; flex: 1; min-height: 0;">
          
          <!-- File Tree Sidebar -->
          <div style="width: 220px; background: rgba(140, 109, 70, 0.12); border: 1px solid var(--parchment-border); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto;">
            <div style="font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem; color: #5e410c; margin-bottom: 2px;">📂 DATABASE FILES</div>
            ${[
              { key: 'dialogues.json', icon: '💬', label: 'dialogues.json' },
              { key: 'enemies.json', icon: '👺', label: 'enemies.json' },
              { key: 'items.json', icon: '🎒', label: 'items.json' },
              { key: 'events.json', icon: '⚡', label: 'events.json' },
              { key: 'spells.json', icon: '🪄', label: 'spells.json' },
              { key: 'shops.json', icon: '🏪', label: 'shops.json' },
              { key: 'sfx.json', icon: '🎵', label: 'sfx.json' },
              { key: 'rooms.json', icon: '🏰', label: 'rooms.json' },
              { key: 'quests.json', icon: '📜', label: 'quests.json' }
            ].map(f => `
              <button class="btn-ghibli ${this.activeFile === f.key ? 'btn-emerald' : ''} btn-file-tree" data-file="${f.key}" style="width: 100%; justify-content: flex-start; padding: 6px 10px; font-size: 0.8rem;">
                ${f.icon} ${f.label}
              </button>
            `).join('')}
          </div>

          <!-- Editor Workspace Area -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0;">
            ${this.editorMode === 'code' ? `
              <textarea id="admin-code-editor" style="flex: 1; width: 100%; background: #0c140e; color: #78e8a0; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4; padding: 12px; border-radius: 8px; border: 2px solid ${this.isValidJSON ? 'var(--parchment-border)' : '#a83232'}; resize: none;">${this.rawJSONText}</textarea>
            ` : `
              <div style="flex: 1; background: rgba(255, 255, 255, 0.45); border: 1px solid var(--parchment-border); border-radius: 8px; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
                ${this.renderVisualForm()}
              </div>
            `}

            <!-- Bottom Control Toolbar -->
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 4px;">
              ${this.editorMode === 'code' ? '<button id="btn-prettify-json" class="btn-ghibli" style="padding: 8px 16px;">🪄 Prettify JSON</button>' : ''}
              <button id="btn-apply-live" class="btn-ghibli btn-emerald" style="padding: 8px 20px; font-weight: 800;">⚡ Apply Live Changes</button>
              <button id="btn-download-admin-file" class="btn-ghibli" style="padding: 8px 16px;">💾 Save to Computer</button>
            </div>
          </div>
        </div>

      </div>
    `;

    this.attachEvents();
  }

  renderVisualForm() {
    if (!this.isValidJSON) {
      return `<div style="color: #a83232; font-weight: 700;">⚠️ Cannot render visual form due to syntax error in JSON code. Switch to Raw JSON Code to fix.</div>`;
    }

    const data = JSON.parse(this.rawJSONText);

    if (this.activeFile === 'dialogues.json') {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
          <div>
            <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; color: #291e14;">💬 Visual NPC Dialogue Tree Builder (${data.length} conversation nodes)</span>
            <div style="font-size: 0.8rem; color: #524030;">Build NPC dialogue nodes, player response choices, and target branch links!</div>
          </div>
          <button id="btn-form-add-dialogue-node" class="btn-ghibli btn-emerald" style="padding: 4px 12px;">+ Add Conversation Node</button>
        </div>
        ${data.map((node, nodeIdx) => `
          <div style="background: rgba(255,255,255,0.75); border: 1px solid var(--parchment-border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px;">
              <span style="font-weight: 800; color: #5e410c; font-size: 0.95rem;">💬 [Node ${nodeIdx + 1}] ID: <code>${node.id}</code> (${node.npcName})</span>
              <button class="btn-ghibli btn-del-dialogue-node" data-idx="${nodeIdx}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 8px; font-size: 0.75rem;">🗑️ Delete Node</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">Node ID (e.g. <code>goblins_branch</code>):</label>
                <input type="text" class="form-field-node" data-idx="${nodeIdx}" data-key="id" value="${node.id || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px; font-family: monospace;">
              </div>
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">NPC ID:</label>
                <input type="text" class="form-field-node" data-idx="${nodeIdx}" data-key="npcId" value="${node.npcId || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">NPC Name:</label>
                <input type="text" class="form-field-node" data-idx="${nodeIdx}" data-key="npcName" value="${node.npcName || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
              </div>
            </div>

            <div>
              <label style="font-size: 0.76rem; font-weight: 700;">NPC Spoken Answer Response Text:</label>
              <textarea class="form-field-node" data-idx="${nodeIdx}" data-key="text" style="width: 100%; height: 50px; padding: 4px; border: 1px solid #999; border-radius: 4px; resize: vertical;">${node.text || ''}</textarea>
            </div>

            <!-- Response Options List -->
            <div style="background: rgba(140, 109, 70, 0.1); border: 1px solid var(--parchment-border); padding: 8px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; font-size: 0.82rem; color: #5e410c;">Player Response Question Choices (${node.options ? node.options.length : 0})</span>
                <button class="btn-ghibli btn-add-opt" data-idx="${nodeIdx}" style="padding: 2px 8px; font-size: 0.75rem;">+ Add Question Choice</button>
              </div>

              ${node.options ? node.options.map((opt, optIdx) => `
                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 6px; align-items: center;">
                  <div>
                    <label style="font-size: 0.7rem; font-weight: 700; display: block;">Choice Text:</label>
                    <input type="text" class="form-field-opt-text" data-nodeidx="${nodeIdx}" data-optidx="${optIdx}" value="${opt.text || ''}" placeholder="Question text..." style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; font-weight: 700; display: block;">Target Node ID:</label>
                    <input type="text" class="form-field-opt-target" data-nodeidx="${nodeIdx}" data-optidx="${optIdx}" value="${opt.targetNode || ''}" placeholder="e.g. goblins_branch" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px; font-family: monospace;">
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; font-weight: 700; display: block;">Class Req:</label>
                    <select class="form-field-opt-class" data-nodeidx="${nodeIdx}" data-optidx="${optIdx}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
                      <option value="None" ${opt.reqClass === 'None' ? 'selected' : ''}>Any Class</option>
                      <option value="Fighter" ${opt.reqClass === 'Fighter' ? 'selected' : ''}>Fighter Only</option>
                      <option value="Mage" ${opt.reqClass === 'Mage' ? 'selected' : ''}>Mage Only</option>
                      <option value="Rogue" ${opt.reqClass === 'Rogue' ? 'selected' : ''}>Rogue Only</option>
                    </select>
                  </div>
                  <button class="btn-ghibli btn-del-opt" data-nodeidx="${nodeIdx}" data-optidx="${optIdx}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 6px; font-size: 0.72rem; margin-top: 14px;">✕</button>
                </div>
              `).join('') : ''}
            </div>
          </div>
        `).join('')}
      `;
    } else if (this.activeFile === 'enemies.json') {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
          <div>
            <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: #291e14;">👺 Monsters & Bosses (${data.length} entries)</span>
            <div style="font-size: 0.8rem; color: #524030;">Click "⚔️ Test Battle" on any card to simulate combat on tactical grid!</div>
          </div>
          <button id="btn-form-add-enemy" class="btn-ghibli btn-emerald" style="padding: 4px 12px;">+ Add New Monster</button>
        </div>
        ${data.map((enemy, idx) => `
          <div style="background: rgba(255,255,255,0.7); border: 1px solid var(--parchment-border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #5e410c;">[${idx + 1}] ${enemy.portrait || '👺'} ${enemy.name}</span>
              <div style="display: flex; gap: 6px;">
                <button class="btn-ghibli btn-emerald btn-test-battle" data-name="${enemy.name}" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 700;">⚔️ Test Battle</button>
                <button class="btn-ghibli btn-dup-record" data-idx="${idx}" style="padding: 2px 8px; font-size: 0.75rem;">👯 Clone</button>
                <button class="btn-ghibli btn-del-record" data-idx="${idx}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 8px; font-size: 0.75rem;">🗑️ Delete</button>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <div><label style="font-size: 0.76rem; font-weight: 700;">Name:</label> <input type="text" class="form-field-enemy" data-idx="${idx}" data-key="name" value="${enemy.name || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;"></div>
              <div><label style="font-size: 0.76rem; font-weight: 700;">Portrait:</label> <input type="text" class="form-field-enemy" data-idx="${idx}" data-key="portrait" value="${enemy.portrait || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;"></div>
              <div><label style="font-size: 0.76rem; font-weight: 700;">HP:</label> <input type="number" class="form-field-enemy" data-idx="${idx}" data-key="hp" value="${enemy.hp || 0}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;"></div>
              <div><label style="font-size: 0.76rem; font-weight: 700;">AP:</label> <input type="number" class="form-field-enemy" data-idx="${idx}" data-key="ap" value="${enemy.ap || 0}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;"></div>
            </div>
          </div>
        `).join('')}
      `;
    } else if (this.activeFile === 'events.json') {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
          <div>
            <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: #291e14;">⚡ Visual Event Scripting Engine (${data.length} actions)</span>
            <div style="font-size: 0.8rem; color: #524030;">Action ID, Action Label, and Parameter List (comma separated)</div>
          </div>
          <button id="btn-form-add-event" class="btn-ghibli btn-emerald" style="padding: 4px 12px;">+ Add New Event</button>
        </div>
        ${data.map((evt, idx) => `
          <div style="background: rgba(255,255,255,0.7); border: 1px solid var(--parchment-border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #5e410c;">[${idx + 1}] ${evt.label}</span>
              <div style="display: flex; gap: 6px;">
                <button class="btn-ghibli btn-emerald btn-run-event" data-id="${evt.id}" style="padding: 2px 8px; font-size: 0.75rem;">⚡ Test Run</button>
                <button class="btn-ghibli btn-del-event" data-idx="${idx}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 8px; font-size: 0.75rem;">🗑️ Delete</button>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">Action ID:</label>
                <input type="text" class="form-field-evt" data-idx="${idx}" data-key="id" value="${evt.id || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">Action Label:</label>
                <input type="text" class="form-field-evt" data-idx="${idx}" data-key="label" value="${evt.label || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
              </div>
              <div>
                <label style="font-size: 0.76rem; font-weight: 700;">Parameters (comma-separated):</label>
                <input type="text" class="form-field-evt-params" data-idx="${idx}" value="${Array.isArray(evt.params) ? evt.params.join(', ') : ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
              </div>
            </div>
          </div>
        `).join('')}
      `;
    } else if (Array.isArray(data)) {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
          <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: #291e14;">${this.activeFile} Database (${data.length} records)</span>
          <button id="btn-form-add-record" class="btn-ghibli btn-emerald" style="padding: 4px 12px;">+ Add New Record</button>
        </div>
        ${data.map((rec, idx) => `
          <div style="background: rgba(255,255,255,0.7); border: 1px solid var(--parchment-border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #5e410c;">[${idx + 1}] ${rec.icon || rec.portrait || '📄'} ${rec.name || rec.label || rec.title || rec.id || rec.npcName}</span>
              <div style="display: flex; gap: 6px;">
                ${this.activeFile === 'sfx.json' ? `<button class="btn-ghibli btn-emerald btn-play-sfx" data-id="${rec.id}" style="padding: 2px 8px; font-size: 0.75rem;">▶ Preview</button>` : ''}
                <button class="btn-ghibli btn-dup-record" data-idx="${idx}" style="padding: 2px 8px; font-size: 0.75rem;">👯 Clone</button>
                <button class="btn-ghibli btn-del-record" data-idx="${idx}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 8px; font-size: 0.75rem;">🗑️ Delete</button>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              ${Object.keys(rec).slice(0, 6).map(key => `
                <div>
                  <label style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase;">${key}:</label> 
                  <input type="text" class="form-field-generic" data-idx="${idx}" data-key="${key}" value="${typeof rec[key] === 'object' ? JSON.stringify(rec[key]) : rec[key]}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px; font-size: 0.82rem;">
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      `;
    } else {
      const keys = Object.keys(data);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--parchment-border); padding-bottom: 6px;">
          <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: #291e14;">${this.activeFile} Database (${keys.length} entries)</span>
          <button id="btn-form-add-dict-entry" class="btn-ghibli btn-emerald" style="padding: 4px 12px;">+ Add New Entry</button>
        </div>
        ${keys.map((k, idx) => `
          <div style="background: rgba(255,255,255,0.7); border: 1px solid var(--parchment-border); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #5e410c;">[${idx + 1}] ID: ${k}</span>
              <button class="btn-ghibli btn-del-dict-entry" data-id="${k}" style="background: #a83232; color: #fff; border-color: #591515; padding: 2px 8px; font-size: 0.75rem;">🗑️ Delete</button>
            </div>
            <div>
              <label style="font-size: 0.76rem; font-weight: 700;">Title / Name:</label>
              <input type="text" class="form-field-dict" data-id="${k}" data-key="title" value="${data[k].title || data[k].name || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
            </div>
            <div>
              <label style="font-size: 0.76rem; font-weight: 700;">Description:</label>
              <input type="text" class="form-field-dict" data-id="${k}" data-key="desc" value="${data[k].desc || ''}" style="width: 100%; padding: 3px; border: 1px solid #999; border-radius: 4px;">
            </div>
          </div>
        `).join('')}
      `;
    }
  }

  attachEvents() {
    this.modalElement.querySelector('#btn-close-admin-studio').addEventListener('click', () => this.toggleStudio());

    this.modalElement.querySelectorAll('.btn-file-tree').forEach(b => {
      b.addEventListener('click', (e) => {
        const fileKey = e.currentTarget.getAttribute('data-file');
        this.loadFileContent(fileKey);
      });
    });

    this.modalElement.querySelector('#btn-mode-code').addEventListener('click', () => {
      this.editorMode = 'code';
      this.renderStudioModal();
    });

    this.modalElement.querySelector('#btn-mode-form').addEventListener('click', () => {
      this.editorMode = 'form';
      this.renderStudioModal();
    });

    if (this.editorMode === 'code') {
      const textarea = this.modalElement.querySelector('#admin-code-editor');
      if (textarea) {
        textarea.addEventListener('input', (e) => {
          this.rawJSONText = e.target.value;
          this.validateCurrentJSON();
        });
      }

      const prettifyBtn = this.modalElement.querySelector('#btn-prettify-json');
      if (prettifyBtn) {
        prettifyBtn.addEventListener('click', () => {
          try {
            const parsed = JSON.parse(this.rawJSONText);
            this.rawJSONText = JSON.stringify(parsed, null, 2);
            this.isValidJSON = true;
            synth.playStatUp();
            this.renderStudioModal();
            this.gameEngine.showNotification('🪄 Auto-formatted JSON with 2-space indentation!');
          } catch (e) {
            synth.playHit();
            this.gameEngine.showNotification('⚠️ Cannot format invalid JSON syntax.');
          }
        });
      }
    } else {
      if (this.activeFile === 'dialogues.json') {
        const addNodeBtn = this.modalElement.querySelector('#btn-form-add-dialogue-node');
        if (addNodeBtn) {
          addNodeBtn.addEventListener('click', () => {
            const data = JSON.parse(this.rawJSONText);
            data.push({
              id: `node_${Date.now()}`,
              npcId: 'npc_sheriff',
              npcName: 'Sheriff von Spielburg',
              text: 'The roads outside the town gate are dangerous. Watch for brigands!',
              options: [
                { text: 'I can handle myself.', targetNode: 'end_dialogue', reqClass: 'None' }
              ]
            });
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playStatUp();
            this.renderStudioModal();
          });
        }

        this.modalElement.querySelectorAll('.form-field-node').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const key = e.target.getAttribute('data-key');
            const data = JSON.parse(this.rawJSONText);
            data[idx][key] = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.btn-add-opt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const nodeIdx = parseInt(e.target.getAttribute('data-idx'));
            const data = JSON.parse(this.rawJSONText);
            if (!data[nodeIdx].options) data[nodeIdx].options = [];
            data[nodeIdx].options.push({
              text: 'New question choice...',
              targetNode: 'root',
              reqClass: 'None'
            });
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playStatUp();
            this.renderStudioModal();
          });
        });

        this.modalElement.querySelectorAll('.form-field-opt-text').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const nIdx = parseInt(e.target.getAttribute('data-nodeidx'));
            const oIdx = parseInt(e.target.getAttribute('data-optidx'));
            const data = JSON.parse(this.rawJSONText);
            data[nIdx].options[oIdx].text = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.form-field-opt-target').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const nIdx = parseInt(e.target.getAttribute('data-nodeidx'));
            const oIdx = parseInt(e.target.getAttribute('data-optidx'));
            const data = JSON.parse(this.rawJSONText);
            data[nIdx].options[oIdx].targetNode = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.form-field-opt-class').forEach(inp => {
          inp.addEventListener('change', (e) => {
            const nIdx = parseInt(e.target.getAttribute('data-nodeidx'));
            const oIdx = parseInt(e.target.getAttribute('data-optidx'));
            const data = JSON.parse(this.rawJSONText);
            data[nIdx].options[oIdx].reqClass = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.btn-del-opt').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const nIdx = parseInt(e.target.getAttribute('data-nodeidx'));
            const oIdx = parseInt(e.target.getAttribute('data-optidx'));
            const data = JSON.parse(this.rawJSONText);
            data[nIdx].options.splice(oIdx, 1);
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playHit();
            this.renderStudioModal();
          });
        });

        this.modalElement.querySelectorAll('.btn-del-dialogue-node').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const data = JSON.parse(this.rawJSONText);
            data.splice(idx, 1);
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playHit();
            this.renderStudioModal();
          });
        });
      } else {
        // Test Battle Simulator Trigger
        this.modalElement.querySelectorAll('.btn-test-battle').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const enemyName = e.target.getAttribute('data-name');
            this.toggleStudio();
            this.gameEngine.startCombatMode(enemyName);
          });
        });

        // Generic Record Add / Duplicate / Delete
        const addRecordBtn = this.modalElement.querySelector('#btn-form-add-record');
        if (addRecordBtn) {
          addRecordBtn.addEventListener('click', () => {
            const data = JSON.parse(this.rawJSONText);
            const newRecord = {
              id: `entry_${Date.now()}`,
              name: `New ${this.activeFile.replace('.json', '')} Record`,
              desc: 'Custom record created in Admin Visual Form Editor.'
            };
            data.push(newRecord);
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playStatUp();
            this.renderStudioModal();
          });
        }

        const addDictBtn = this.modalElement.querySelector('#btn-form-add-dict-entry');
        if (addDictBtn) {
          addDictBtn.addEventListener('click', () => {
            const data = JSON.parse(this.rawJSONText);
            const newId = `entry_${Date.now()}`;
            data[newId] = {
              id: newId,
              title: 'New Dict Entry',
              desc: 'Custom dict record created in Admin Visual Form Editor.'
            };
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playStatUp();
            this.renderStudioModal();
          });
        }

        this.modalElement.querySelectorAll('.form-field-generic').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const key = e.target.getAttribute('data-key');
            const data = JSON.parse(this.rawJSONText);
            data[idx][key] = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.form-field-dict').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const id = e.target.getAttribute('data-id');
            const key = e.target.getAttribute('data-key');
            const data = JSON.parse(this.rawJSONText);
            if (!data[id]) data[id] = {};
            data[id][key] = e.target.value;
            this.rawJSONText = JSON.stringify(data, null, 2);
          });
        });

        this.modalElement.querySelectorAll('.btn-dup-record').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const data = JSON.parse(this.rawJSONText);
            const clone = JSON.parse(JSON.stringify(data[idx]));
            clone.id = `entry_${Date.now()}`;
            if (clone.name) clone.name += ' (Copy)';
            if (clone.title) clone.title += ' (Copy)';
            data.push(clone);
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playStatUp();
            this.renderStudioModal();
          });
        });

        this.modalElement.querySelectorAll('.btn-del-record').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const data = JSON.parse(this.rawJSONText);
            data.splice(idx, 1);
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playHit();
            this.renderStudioModal();
          });
        });

        this.modalElement.querySelectorAll('.btn-del-dict-entry').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const data = JSON.parse(this.rawJSONText);
            delete data[id];
            this.rawJSONText = JSON.stringify(data, null, 2);
            synth.playHit();
            this.renderStudioModal();
          });
        });

        this.modalElement.querySelectorAll('.btn-play-sfx').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            this.gameEngine.eventEngine.executeAction('play_sfx', { sfxType: id });
          });
        });
      }
    }

    const applyLiveBtn = this.modalElement.querySelector('#btn-apply-live');
    if (applyLiveBtn) {
      applyLiveBtn.addEventListener('click', () => {
        if (!this.isValidJSON) {
          synth.playHit();
          this.gameEngine.showNotification('⚠️ Cannot apply invalid JSON syntax!');
          return;
        }

        try {
          const parsed = JSON.parse(this.rawJSONText);
          if (this.activeFile === 'rooms.json') {
            Object.assign(this.gameEngine.explorationScene.rooms, parsed);
          } else if (this.activeFile === 'items.json') {
            this.gameEngine.gameRegistry.items = parsed;
          } else if (this.activeFile === 'enemies.json') {
            this.gameEngine.gameRegistry.enemies = parsed;
          } else if (this.activeFile === 'quests.json') {
            this.gameEngine.questSystem.quests = parsed;
          } else if (this.activeFile === 'events.json') {
            this.gameEngine.eventEngine.actionTypes = parsed;
          }

          synth.playStatUp();
          this.gameEngine.showNotification(`⚡ Live Hot-Reloaded ${this.activeFile} into running game!`);
        } catch (e) {
          this.gameEngine.showNotification('⚠️ Hot reload failed.');
        }
      });
    }

    const downloadBtn = this.modalElement.querySelector('#btn-download-admin-file');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.rawJSONText);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", this.activeFile);
        dlAnchorElem.click();
        synth.playStatUp();
        this.gameEngine.showNotification(`💾 Saved ${this.activeFile} to computer!`);
      });
    }
  }
}
