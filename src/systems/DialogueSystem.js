import { synth } from '../engine/SoundSynth.js';
import { NPCRenderer } from '../engine/NPCRenderer.js';

export class DialogueSystem {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentNode = null;
    this.npcData = null;
    this.statSystem = null;
    this.onChoiceCallback = null;
    this.npcRenderer = new NPCRenderer();
    this.animFrameId = null;
  }

  startDialogue(dialogueTree, onChoice = null) {
    const firstNode = Array.isArray(dialogueTree) ? dialogueTree[0] : (dialogueTree.root || dialogueTree);
    const npcData = {
      name: (firstNode && firstNode.npcName) ? firstNode.npcName : 'Guildmaster Bruno',
      portraitEmoji: (firstNode && firstNode.npcName && firstNode.npcName.includes('Zara')) ? '🔮' : '⚔️'
    };

    this.showSierraQA(npcData, dialogueTree, 'root', null, (text, targetNode) => {
      if (onChoice) {
        onChoice({ text, targetNode });
      }
    });
  }

  showSierraQA(npcData, dialogueTree, initialNodeId = 'root', statSystem = null, onChoice = null) {
    this.npcData = npcData;
    this.dialogueTree = dialogueTree;
    this.statSystem = statSystem;
    this.onChoiceCallback = onChoice;
    this.container.style.display = 'flex';

    this.renderNode(initialNodeId);
  }

  renderNode(nodeId) {
    let node = null;

    if (Array.isArray(this.dialogueTree)) {
      node = this.dialogueTree.find(n => n.id === nodeId) || this.dialogueTree[0];
    } else if (typeof this.dialogueTree === 'object') {
      node = this.dialogueTree[nodeId] || this.dialogueTree.root || this.dialogueTree;
    }

    if (!node) {
      this.hide();
      return;
    }

    this.currentNode = node;
    synth.playClick();

    const npcName = this.npcData.name || node.npcName || 'NPC Speaker';

    this.container.innerHTML = `
      <div style="display: flex; gap: 14px; align-items: stretch; width: 820px; max-width: 95vw; pointer-events: auto;">
        
        <!-- Left Side: Standalone Framed Sierra Portrait Box -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 144px; padding: 12px; background: rgba(14, 26, 18, 0.96); border: 3px solid #d4af37; border-radius: 10px; box-shadow: 0 16px 45px rgba(0,0,0,0.9); flex-shrink: 0;">
          <div style="position: relative; width: 120px; height: 140px; border: 2px solid #d4af37; border-radius: 6px; background: #060d09; box-shadow: inset 0 0 12px rgba(0,0,0,0.9); overflow: hidden;">
            <canvas id="dialogue-portrait-canvas" width="120" height="140" style="display: block; width: 100%; height: 100%;"></canvas>
          </div>
          <div style="font-family: var(--font-heading); font-size: 0.88rem; font-weight: 800; color: #ffd700; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.8); line-height: 1.2;">
            ${npcName}
          </div>
        </div>

        <!-- Right Side: Main Parchment Dialogue Box -->
        <div class="dialogue-modal parchment-card" style="flex: 1; border: 3px solid var(--parchment-border); box-shadow: 0 16px 45px rgba(0,0,0,0.9); display: flex; flex-direction: column; gap: 10px; padding: 18px;">
          <!-- Header Bar -->
          <div style="border-bottom: 2px solid var(--parchment-border); padding-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--text-dark);">${npcName}</div>
            <div style="font-size: 0.78rem; color: #8c5a14; font-weight: 700; background: rgba(212,175,55,0.2); padding: 2px 10px; border-radius: 12px; border: 1px solid var(--parchment-border);">
              📜 Quest for Glory Dialogue
            </div>
          </div>

          <!-- NPC Spoken Response Box -->
          <div style="background: rgba(255,255,255,0.7); border: 1px solid var(--parchment-border); padding: 12px 16px; border-radius: 8px; font-size: 1.02rem; line-height: 1.55; color: var(--text-dark);">
            "${node.text || 'Greetings hero! What would you like to ask?'}"
          </div>

          <!-- Predetermined Question Topics List -->
          <div style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; color: #5e410c;">
            ❓ Select a topic to ask:
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto;">
            ${node.options ? node.options.map((opt) => {
              const reqClass = opt.reqClass || 'None';
              const isClassReqMet = reqClass === 'None' || (this.statSystem && this.statSystem.heroClass === reqClass);

              if (!isClassReqMet) return '';

              return `
                <button class="btn-ghibli btn-sierra-qa-choice" data-target="${opt.targetNode || 'end_dialogue'}" data-text="${opt.text}" style="width: 100%; justify-content: flex-start; padding: 8px 12px; text-align: left; font-size: 0.9rem;">
                  💬 ${opt.text}
                </button>
              `;
            }).join('') : `
              <button class="btn-ghibli btn-sierra-qa-choice" data-target="end_dialogue" style="width: 100%; justify-content: center; padding: 8px;">
                👋 End Conversation
              </button>
            `}
          </div>
        </div>

      </div>
    `;

    // Start Portrait Animation Loop
    this.startPortraitAnimation(npcName);

    this.container.querySelectorAll('.btn-sierra-qa-choice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetNode = e.currentTarget.getAttribute('data-target');
        const text = e.currentTarget.getAttribute('data-text');

        if (this.onChoiceCallback) {
          this.onChoiceCallback({ text, targetNode });
        }

        if (targetNode === 'end_dialogue' || !targetNode) {
          this.hide();
        } else {
          this.renderNode(targetNode);
        }
      });
    });
  }

  startPortraitAnimation(npcName) {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const canvas = document.getElementById('dialogue-portrait-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      if (this.container.style.display !== 'none' && canvas) {
        this.npcRenderer.drawPortraitHeadshot(ctx, canvas.width, canvas.height, npcName, Date.now());
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    loop();
  }

  hide() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.container.style.display = 'none';
    this.currentNode = null;
    synth.playClick();
  }
}
