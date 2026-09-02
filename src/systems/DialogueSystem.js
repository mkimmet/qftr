import { synth } from '../engine/SoundSynth.js';

export class DialogueSystem {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentNode = null;
    this.npcData = null;
    this.statSystem = null;
    this.onChoiceCallback = null;
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

    this.container.innerHTML = `
      <div class="dialogue-modal parchment-card" style="width: 720px; border: 2px solid var(--parchment-border); box-shadow: 0 16px 40px rgba(0,0,0,0.85);">
        
        <!-- NPC Header & Portrait Bar -->
        <div style="display: flex; gap: 16px; align-items: center; border-bottom: 2px solid var(--parchment-border); padding-bottom: 12px; margin-bottom: 14px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #000; border: 2px solid var(--ghibli-sun-gold); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; flex-shrink: 0;">
            ${this.npcData.portraitEmoji || '🧙‍♂️'}
          </div>
          <div>
            <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--text-dark);">${this.npcData.name || node.npcName || 'NPC Speaker'}</div>
            <div style="font-size: 0.82rem; color: #8c5a14; font-weight: 700;">Sierra Quest for Glory Dialogue Tree</div>
          </div>
        </div>

        <!-- NPC Spoken Answer Response Box -->
        <div style="background: rgba(255,255,255,0.65); border: 1px solid var(--parchment-border); padding: 14px 18px; border-radius: 8px; font-size: 1.05rem; line-height: 1.6; color: var(--text-dark); margin-bottom: 16px;">
          "${node.text || 'Greetings hero! What would you like to ask?'}"
        </div>

        <!-- Predetermined Question Topics List -->
        <div style="font-family: var(--font-heading); font-weight: 700; font-size: 0.95rem; color: #5e410c; margin-bottom: 8px;">
          ❓ Select a predetermined topic to ask:
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin-bottom: 14px;">
          ${node.options ? node.options.map((opt, idx) => {
            const reqClass = opt.reqClass || 'None';
            const isClassReqMet = reqClass === 'None' || (this.statSystem && this.statSystem.heroClass === reqClass);

            if (!isClassReqMet) return '';

            return `
              <button class="btn-ghibli btn-sierra-qa-choice" data-target="${opt.targetNode || 'end_dialogue'}" data-text="${opt.text}" style="width: 100%; justify-content: flex-start; padding: 10px 14px; text-align: left; font-size: 0.92rem;">
                💬 ${opt.text}
              </button>
            `;
          }).join('') : `
            <button class="btn-ghibli btn-sierra-qa-choice" data-target="end_dialogue" style="width: 100%; justify-content: center; padding: 10px;">
              👋 End Conversation
            </button>
          `}
        </div>

      </div>
    `;

    this.container.querySelectorAll('.btn-sierra-qa-choice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        const text = e.currentTarget.getAttribute('data-text');

        if (this.onChoiceCallback) {
          this.onChoiceCallback(text, target);
        }

        if (target === 'end_dialogue' || !target) {
          this.hide();
        } else {
          this.renderNode(target);
        }
      });
    });
  }

  hide() {
    this.container.style.display = 'none';
    synth.playClick();
  }
}
