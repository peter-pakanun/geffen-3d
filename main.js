import * as THREE from 'three';
import { GeffenMap, DUNGEON_CENTER } from './map.js';
import {
  createPlayerMesh,
  createClickCursor,
  createNPCs,
  spawnInitialMonsters,
} from './entities.js';
import { SPELL_DEFS, getElementalMultiplier, VFXManager } from './spells.js';
import { sfx } from './audio.js';

// ============================================================================
// 1. SCENE, CAMERA & RENDERER SETUP
// ============================================================================
const container = document.getElementById('canvas-container');
const worldLabelsContainer = document.getElementById('world-labels');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ec5fc);
scene.fog = new THREE.FogExp2(0x8ec5fc, 0.0052);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.5,
  350
);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

// Lighting (Sunny Day, Golden Dusk, Arcane Starlight Night)
const hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x4d6b53, 0.9);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff4d6, 1.45);
dirLight.position.set(45, 72, 38);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 210;
const d = 80;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// Ambient Floating Mana Particles across Geffen
const particleCount = 320;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  const r = Math.random() * 120;
  const a = Math.random() * Math.PI * 2;
  particlePositions[i * 3] = Math.cos(a) * r;
  particlePositions[i * 3 + 1] = 1 + Math.random() * 24;
  particlePositions[i * 3 + 2] = Math.sin(a) * r;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x99e2ff,
  size: 0.42,
  transparent: true,
  opacity: 0.72,
});
const manaParticles = new THREE.Points(particleGeo, particleMat);
scene.add(manaParticles);

// ============================================================================
// 2. BUILD GEFFEN MAP, PLAYER, NPCS & MONSTERS
// ============================================================================
const geffenMap = new GeffenMap(scene);
const vfx = new VFXManager(scene);

const playerMesh = createPlayerMesh();
playerMesh.position.set(0, 0, 19); // Start on South Central Plaza in front of Geffen Tower
scene.add(playerMesh);

const clickCursor = createClickCursor(scene);
const npcs = createNPCs(scene);
const monsters = spawnInitialMonsters(scene);

// ============================================================================
// 3. GAME STATE & CHARACTER PROGRESSION
// ============================================================================
const state = {
  baseLv: 1,
  jobLv: 1,
  baseExp: 0,
  baseExpMax: 100,
  jobExp: 0,
  jobExpMax: 80,

  stats: {
    int: 18,
    dex: 12,
    vit: 10,
    agi: 10,
  },
  statPoints: 3,

  hp: 450,
  maxHp: 450,
  sp: 320,
  maxSp: 320,
  zeny: 1500,
  weaponRefine: 0, // +0 to +10 Arcane Staff
  academyBuffTimer: 0,
  shieldTimer: 0,

  activeSlot: 1,
  cooldowns: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },

  inventory: [
    { id: 'potion', name: 'Arcane Potion', icon: '🧪', qty: 5, price: 50, consumable: true },
    { id: 'jellopy', name: 'Jellopy', icon: '🍬', qty: 3, price: 15, consumable: false },
    { id: 'oridecon', name: 'Oridecon Ore', icon: '🔮', qty: 2, price: 240, consumable: false },
  ],

  // Quests chain from Archmage Elion
  questIndex: 0,
  questProgress: 0,
  quests: [
    {
      title: 'Speak with Archmage Elion',
      desc: 'Click on Archmage Elion at the base of Central Geffen Tower (-5, 14) to receive your trial.',
      type: 'talk',
      targetId: 'archmage',
      goal: 1,
      rewardExp: 60,
      rewardZeny: 300,
    },
    {
      title: 'Trial I: Poring Patrol',
      desc: 'Exit through any of Geffen’s 4 outer gates and defeat 4 Porings or Fabres in the Outskirts.',
      type: 'kill_field',
      goal: 4,
      rewardExp: 180,
      rewardZeny: 650,
    },
    {
      title: 'Trial II: Spore Research',
      desc: 'Defeat 3 Poison Spores in the outer Geffen meadow to collect magical spores.',
      type: 'kill_spore',
      goal: 3,
      rewardExp: 340,
      rewardZeny: 1200,
    },
    {
      title: 'Trial III: Geffen Tower Dungeon',
      desc: 'Enter the glowing blue portal at the base of Geffen Tower and vanquish 3 Whispers or the Arch-Doppel MVP!',
      type: 'kill_dungeon',
      goal: 3,
      rewardExp: 800,
      rewardZeny: 2800,
    },
  ],

  // Movement & Targeting
  moveTarget: null,
  targetMonster: null,
  targetNPC: null,
  currentZoneId: 'safe',
  timeOfDay: 'day',

  // Camera Orbit State (Classic RO Angled Isometric / Orbital 3D)
  camYaw: 0,
  camPitch: 0.62, // radians above horizon
  camDist: 28,
};

function recalcDerivedStats() {
  state.maxHp = 350 + state.baseLv * 45 + state.stats.vit * 14;
  state.maxSp = 200 + state.jobLv * 30 + state.stats.int * 10;
  state.hp = Math.min(state.hp, state.maxHp);
  state.sp = Math.min(state.sp, state.maxSp);
}
recalcDerivedStats();
state.hp = state.maxHp;
state.sp = state.maxSp;

function getMatkRange() {
  const refineBonus = state.weaponRefine * 14;
  const buffMult = state.academyBuffTimer > 0 ? 1.25 : 1.0;
  const min = Math.floor((state.stats.int * 2.8 + state.baseLv * 4 + refineBonus) * buffMult);
  const max = Math.floor((state.stats.int * 3.9 + state.baseLv * 6 + refineBonus * 1.3) * buffMult);
  return [min, max];
}

// ============================================================================
// 4. FLOATING 2D WORLD LABELS (NPC TAGS, MONSTER TAGS, DAMAGE NUMBERS)
// ============================================================================
const npcLabelEls = new Map();
npcs.forEach((npc) => {
  const el = document.createElement('div');
  el.className = 'world-label npc-tag';
  el.textContent = `${npc.portrait} ${npc.name}`;
  worldLabelsContainer.appendChild(el);
  npcLabelEls.set(npc.id, el);
});

const monsterLabelEls = new Map();
monsters.forEach((m) => {
  const el = document.createElement('div');
  el.className = `world-label monster-tag ${m.mvp ? 'mvp' : ''}`;
  el.textContent = `${m.mvp ? '👑 ' : ''}${m.name} (Lv.${m.level})`;
  worldLabelsContainer.appendChild(el);
  monsterLabelEls.set(m.id, el);
});

// Classic RO Under-Foot HP/SP Mini Bar
const playerFootEl = document.createElement('div');
playerFootEl.className = 'world-label player-foot-bars';
playerFootEl.innerHTML = `<div class="foot-hp" id="foot-hp-bar"></div><div class="foot-sp" id="foot-sp-bar"></div>`;
worldLabelsContainer.appendChild(playerFootEl);

function projectToScreen(worldVec) {
  const v = worldVec.clone().project(camera);
  if (v.z > 1) return null;
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  return { x, y };
}

function spawnFloatingText(worldPos, text, cssClass = '', offsetY = 2.2, delayMs = 0) {
  setTimeout(() => {
    const pos = worldPos.clone();
    pos.y += offsetY;
    const screen = projectToScreen(pos);
    if (!screen) return;

    const el = document.createElement('div');
    el.className = `world-label ${cssClass}`;
    el.textContent = text;
    el.style.left = `${screen.x + (Math.random() - 0.5) * 20}px`;
    el.style.top = `${screen.y}px`;
    worldLabelsContainer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 950);
  }, delayMs);
}

// ============================================================================
// 5. CHAT LOG & UI UPDATES
// ============================================================================
const chatBox = document.getElementById('chat-messages');
function addChatLog(msg, type = 'system') {
  const div = document.createElement('div');
  div.className = `chat-line ${type}`;
  div.textContent = msg;
  chatBox.appendChild(div);
  while (chatBox.children.length > 40) {
    chatBox.removeChild(chatBox.firstChild);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

addChatLog('Welcome to Geffen, the City of Magic! Explore the Central Tower, 4 Bridges, and Outskirts.', 'system');
addChatLog('Tip: Left-Click ground/monsters or use WASD to move. Right-Click + Drag to rotate camera.', 'system');

function showZoneAnnouncement(sub, title) {
  const banner = document.getElementById('zone-announcement');
  document.getElementById('zone-ann-sub').textContent = sub;
  document.getElementById('zone-ann-title').textContent = title;
  banner.classList.remove('hidden');
  banner.style.animation = 'none';
  // Trigger reflow
  void banner.offsetWidth;
  banner.style.animation = 'zoneFadeInOut 3.4s ease forwards';
}

function updateHUD() {
  document.getElementById('ui-base-lv').textContent = state.baseLv;
  document.getElementById('ui-job-lv').textContent = state.jobLv;
  document.getElementById('ui-weapon-refine').textContent = `+${state.weaponRefine} Staff`;

  const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  const spPct = Math.max(0, Math.min(100, (state.sp / state.maxSp) * 100));
  document.getElementById('ui-hp-fill').style.width = `${hpPct}%`;
  document.getElementById('ui-hp-text').textContent = `${Math.ceil(state.hp)} / ${state.maxHp}`;
  document.getElementById('ui-sp-fill').style.width = `${spPct}%`;
  document.getElementById('ui-sp-text').textContent = `${Math.ceil(state.sp)} / ${state.maxSp}`;

  document.getElementById('foot-hp-bar').style.width = `${hpPct}%`;
  document.getElementById('foot-sp-bar').style.width = `${spPct}%`;

  const basePct = Math.min(100, Math.floor((state.baseExp / state.baseExpMax) * 100));
  const jobPct = Math.min(100, Math.floor((state.jobExp / state.jobExpMax) * 100));
  document.getElementById('ui-base-exp').style.width = `${basePct}%`;
  document.getElementById('ui-base-pct').textContent = `${basePct}%`;
  document.getElementById('ui-job-exp').style.width = `${jobPct}%`;
  document.getElementById('ui-job-pct').textContent = `${jobPct}%`;

  document.getElementById('ui-zeny').textContent = state.zeny.toLocaleString();

  // Potion count in slot 6
  const potItem = state.inventory.find((i) => i.id === 'potion');
  const potQty = potItem ? potItem.qty : 0;
  document.getElementById('potion-count').textContent = `x${potQty}`;

  // Stats modal
  document.getElementById('stat-int').textContent = state.stats.int;
  document.getElementById('stat-dex').textContent = state.stats.dex;
  document.getElementById('stat-vit').textContent = state.stats.vit;
  document.getElementById('stat-agi').textContent = state.stats.agi;
  document.getElementById('ui-stat-points').textContent = state.statPoints;

  const badge = document.getElementById('ui-stat-badge');
  if (state.statPoints > 0) badge.classList.remove('hidden');
  else badge.classList.add('hidden');

  const [matkMin, matkMax] = getMatkRange();
  document.getElementById('derived-matk').textContent = `${matkMin} ~ ${matkMax}`;
  const castPct = Math.max(35, 100 - state.stats.dex * 2);
  document.getElementById('derived-cast').textContent = `${castPct}%`;
  document.getElementById('derived-def').textContent = `${15 + state.stats.vit * 2} + ${state.stats.int}`;
  document.getElementById('derived-spd').textContent = `${100 + state.stats.agi}%`;

  // Quest Tracker
  const q = state.quests[state.questIndex];
  if (q) {
    document.getElementById('quest-title').textContent = q.title;
    document.getElementById('quest-desc').textContent = q.desc;
    document.getElementById('quest-progress').textContent =
      q.type === 'talk' ? 'Status: Ready to speak' : `Progress: ${state.questProgress} / ${q.goal}`;
  } else {
    document.getElementById('quest-title').textContent = 'Archmage of Geffen!';
    document.getElementById('quest-desc').textContent =
      'You have completed all Academy trials. Continue hunting MVPs and refining your staff!';
    document.getElementById('quest-progress').textContent = 'All Trials Complete ★';
  }

  // Target Monster Banner
  const targetBanner = document.getElementById('hud-target-banner');
  if (state.targetMonster && !state.targetMonster.dead) {
    targetBanner.classList.remove('hidden');
    const m = state.targetMonster;
    document.getElementById('target-element').textContent = m.element;
    document.getElementById('target-name').textContent = m.name;
    document.getElementById('target-lv').textContent = `Lv. ${m.level}`;
    const mPct = Math.max(0, (m.hp / m.maxHp) * 100);
    document.getElementById('target-hp-fill').style.width = `${mPct}%`;
    document.getElementById('target-hp-text').textContent = `${Math.ceil(m.hp)} / ${m.maxHp}`;
  } else {
    targetBanner.classList.add('hidden');
  }
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  state.inventory.forEach((item) => {
    if (item.qty <= 0) return;
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.title = `${item.name} (Sell Value: ${item.price} Z)`;
    div.innerHTML = `
      <span class="inv-icon">${item.icon}</span>
      <span class="inv-name">${item.name}</span>
      <span class="inv-qty">x${item.qty}</span>
    `;
    div.addEventListener('click', () => {
      if (item.consumable) {
        usePotion();
        renderInventory();
      } else {
        addChatLog(`${item.name}: Monster loot worth ${item.price} Zeny each.`, 'system');
      }
    });
    grid.appendChild(div);
  });
}

function addInventoryItem(itemDef, qty = 1) {
  const existing = state.inventory.find((i) => i.id === itemDef.id);
  if (existing) {
    existing.qty += qty;
  } else {
    state.inventory.push({ ...itemDef, qty });
  }
  updateHUD();
}

// ============================================================================
// 6. COMBAT, SPELLS, LEVEL UP & QUEST LOGIC
// ============================================================================
function usePotion() {
  if (state.cooldowns[6] > 0) return;
  const pot = state.inventory.find((i) => i.id === 'potion');
  if (!pot || pot.qty <= 0) {
    addChatLog('Out of Arcane Potions! Buy more at Alchemist Aurelia (SW Shop).', 'system');
    return;
  }
  pot.qty -= 1;
  state.cooldowns[6] = 1.0;
  const healHp = Math.floor(state.maxHp * 0.42);
  const healSp = Math.floor(state.maxSp * 0.35);
  state.hp = Math.min(state.maxHp, state.hp + healHp);
  state.sp = Math.min(state.maxSp, state.sp + healSp);
  sfx.playSpellHit('heal');
  spawnFloatingText(playerMesh.position, `+${healHp} HP / +${healSp} SP`, 'dmg-float heal', 2.4);
  updateHUD();
}

function castSanctuary() {
  const spell = SPELL_DEFS[5];
  if (state.cooldowns[5] > 0) return;
  if (state.sp < spell.spCost) {
    addChatLog('Not enough SP for Arcane Sanctuary!', 'system');
    return;
  }
  state.sp -= spell.spCost;
  state.cooldowns[5] = spell.cooldown;
  state.shieldTimer = 20.0;
  playerMesh.userData.shieldMesh.visible = true;

  const healAmt = Math.floor(state.maxHp * 0.35 + state.stats.int * 5);
  state.hp = Math.min(state.maxHp, state.hp + healAmt);

  sfx.playSpellHit('heal');
  spawnFloatingText(playerMesh.position, spell.shout, 'cast-shout', 2.8);
  spawnFloatingText(playerMesh.position, `+${healAmt} HP`, 'dmg-float heal', 2.1, 120);
  addChatLog(`Cast Arcane Sanctuary! Restored ${healAmt} HP and activated Energy Coat for 20s.`, 'combat');
  updateHUD();
}

function performOffensiveSpell(slot, monster) {
  const spell = SPELL_DEFS[slot];
  if (!spell || !monster || monster.dead) return;
  if (state.cooldowns[slot] > 0) return;

  if (state.sp < spell.spCost) {
    addChatLog(`Not enough SP to cast ${spell.name}!`, 'system');
    return;
  }

  state.sp -= spell.spCost;
  const hasteFactor = Math.max(0.5, 1 - state.stats.dex * 0.015);
  state.cooldowns[slot] = spell.cooldown * hasteFactor;

  // Face target monster
  const dx = monster.position.x - playerMesh.position.x;
  const dz = monster.position.z - playerMesh.position.z;
  playerMesh.rotation.y = Math.atan2(dx, dz);

  // Show ground casting magic circle briefly
  const castRing = playerMesh.userData.castRing;
  castRing.material.color.setHex(spell.color);
  castRing.visible = true;
  setTimeout(() => {
    castRing.visible = false;
  }, 480);

  sfx.playCastStart();
  setTimeout(() => sfx.playSpellHit(spell.sfxType), 160);
  spawnFloatingText(playerMesh.position, spell.shout, 'cast-shout', 2.85);

  const [matkMin, matkMax] = getMatkRange();

  if (spell.aoeRadius) {
    // AoE Meteor Storm hits all monsters near target
    vfx.spawnMeteorStormEffect(monster.position, spell.aoeRadius);
    monsters.forEach((m) => {
      if (m.dead) return;
      if (m.position.distanceTo(monster.position) <= spell.aoeRadius) {
        applySpellHitsToMonster(spell, m, matkMin, matkMax);
      }
    });
  } else {
    vfx.spawnBoltEffect(spell, monster.position);
    applySpellHitsToMonster(spell, monster, matkMin, matkMax);
  }

  updateHUD();
}

function applySpellHitsToMonster(spell, monster, matkMin, matkMax) {
  const elemMult = getElementalMultiplier(spell.element, monster.element);
  let totalDamage = 0;

  for (let h = 0; h < spell.hits; h++) {
    const baseRoll = matkMin + Math.random() * (matkMax - matkMin);
    const hitDmg = Math.max(1, Math.round(baseRoll * spell.power * elemMult));
    totalDamage += hitDmg;
    const isCrit = elemMult > 1.2 || Math.random() < 0.2;
    spawnFloatingText(
      monster.position,
      `${hitDmg}${isCrit ? '!' : ''}`,
      `dmg-float ${isCrit ? 'crit' : ''}`,
      1.8 + h * 0.38,
      h * 110
    );
  }

  if (spell.chill) {
    monster.slowTimer = spell.chill;
  }

  // Trigger aggro when hit
  monster.aggroed = true;
  monster.hp -= totalDamage;

  if (monster.hp <= 0) {
    handleMonsterDeath(monster);
  }
  updateHUD();
}

function handleMonsterDeath(monster) {
  monster.hp = 0;
  monster.dead = true;
  monster.aggroed = false;
  monster.respawnTimer = monster.mvp ? 18.0 : 7.5;
  monster.mesh.visible = false;

  if (state.targetMonster === monster) {
    state.targetMonster = null;
  }

  // Grant Zeny & EXP
  const zenyGain =
    monster.zeny[0] + Math.floor(Math.random() * (monster.zeny[1] - monster.zeny[0] + 1));
  state.zeny += zenyGain;
  state.baseExp += monster.exp;
  state.jobExp += monster.jobExp;

  addChatLog(
    `Defeated ${monster.name}! (+${monster.exp} Base EXP, +${monster.jobExp} Job EXP, +${zenyGain} Z)`,
    'combat'
  );

  // Roll for Monster Drops
  monster.drops.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      addInventoryItem(drop, 1);
      addChatLog(`Obtained ${drop.icon} ${drop.name}!`, 'loot');
    }
  });

  // Update Active Quest Progress
  const q = state.quests[state.questIndex];
  if (q) {
    if (
      (q.type === 'kill_field' && (monster.type === 'poring' || monster.type === 'fabre')) ||
      (q.type === 'kill_spore' && monster.type === 'spore') ||
      (q.type === 'kill_dungeon' && (monster.type === 'whisper' || monster.type === 'doppel'))
    ) {
      state.questProgress += 1;
      if (state.questProgress >= q.goal) {
        completeCurrentQuest();
      }
    }
  }

  checkLevelUp();
  updateHUD();
}

function completeCurrentQuest() {
  const q = state.quests[state.questIndex];
  if (!q) return;

  state.baseExp += q.rewardExp;
  state.jobExp += Math.floor(q.rewardExp * 0.8);
  state.zeny += q.rewardZeny;
  sfx.playLevelUp();

  addChatLog(
    `★ Quest Completed: "${q.title}"! Rewarded +${q.rewardExp} EXP & +${q.rewardZeny} Zeny!`,
    'quest'
  );
  spawnFloatingText(playerMesh.position, 'QUEST COMPLETE ★', 'dmg-float crit', 3.1);

  state.questIndex += 1;
  state.questProgress = 0;
  checkLevelUp();
  updateHUD();
}

function checkLevelUp() {
  let leveled = false;
  while (state.baseExp >= state.baseExpMax) {
    state.baseExp -= state.baseExpMax;
    state.baseLv += 1;
    state.baseExpMax = Math.floor(state.baseExpMax * 1.38);
    state.statPoints += 3;
    leveled = true;
  }
  while (state.jobExp >= state.jobExpMax) {
    state.jobExp -= state.jobExpMax;
    state.jobLv += 1;
    state.jobExpMax = Math.floor(state.jobExpMax * 1.35);
    state.stats.int += 1;
    leveled = true;
  }

  if (leveled) {
    recalcDerivedStats();
    state.hp = state.maxHp;
    state.sp = state.maxSp;
    sfx.playLevelUp();
    vfx.spawnLevelUpPillar(playerMesh.position);
    spawnFloatingText(playerMesh.position, `LEVEL UP! Base Lv.${state.baseLv}`, 'dmg-float crit', 3.2);
    addChatLog(
      `★ LEVEL UP! You are now Base Lv.${state.baseLv} / Job Lv.${state.jobLv}! (+3 Stat Points)`,
      'level'
    );
  }
}

// ============================================================================
// 7. NPC DIALOG INTERACTIONS
// ============================================================================
function openNPCDialog(npc) {
  sfx.playClick();
  const modal = document.getElementById('modal-npc-dialog');
  document.getElementById('npc-dialog-title').textContent = `${npc.name} — ${npc.role}`;
  document.getElementById('npc-portrait').textContent = npc.portrait;
  const textEl = document.getElementById('npc-dialog-text');
  const actionsEl = document.getElementById('npc-dialog-actions');
  actionsEl.innerHTML = '';

  const addBtn = (label, fn) => {
    const b = document.createElement('button');
    b.className = 'ro-action-btn';
    b.textContent = label;
    b.addEventListener('click', fn);
    actionsEl.appendChild(b);
  };

  if (npc.id === 'kafra') {
    textEl.textContent =
      'Welcome to the Kafra Corporation in Central Geffen! Would you like to restore your HP/SP or use our Warp Teleport service?';
    addBtn('Full HP/SP Rest (Free)', () => {
      state.hp = state.maxHp;
      state.sp = state.maxSp;
      sfx.playSpellHit('heal');
      spawnFloatingText(playerMesh.position, 'HP & SP Restored!', 'dmg-float heal', 2.4);
      updateHUD();
    });
    addBtn('Warp: Geffen Outskirts', () => {
      warpPlayerTo(new THREE.Vector3(0, 0, 80));
      modal.classList.add('hidden');
    });
    addBtn('Warp: Geffen Dungeon B1', () => {
      warpPlayerTo(new THREE.Vector3(DUNGEON_CENTER.x, 0, DUNGEON_CENTER.z + 18));
      modal.classList.add('hidden');
    });
  } else if (npc.id === 'archmage') {
    const q = state.quests[state.questIndex];
    if (q && q.type === 'talk') {
      completeCurrentQuest();
    }
    const nextQ = state.quests[state.questIndex];
    textEl.textContent = nextQ
      ? `Greetings, fellow mage of Geffen! Your current Academy assignment is: "${nextQ.title}" — ${nextQ.desc}`
      : 'Magnificent! You have mastered the mysteries of Geffen Tower and proven yourself a true High Wizard!';
    addBtn('Restore Mana & Bless', () => {
      state.sp = state.maxSp;
      sfx.playSpellHit('heal');
      updateHUD();
    });
  } else if (npc.id === 'blacksmith') {
    const cost = (state.weaponRefine + 1) * 250;
    textEl.textContent = `Aha! Ready to temper your Arcane Staff with Geffen forge fire? Refining to +${
      state.weaponRefine + 1
    } costs ${cost} Zeny (or 1 Oridecon Ore) and adds +14 base MATK!`;
    addBtn(`Refine Staff to +${state.weaponRefine + 1} (${cost} Z)`, () => {
      if (state.weaponRefine >= 10) {
        addChatLog('Your Arcane Staff has already reached the maximum +10 refinement!', 'level');
        return;
      }
      if (state.zeny < cost) {
        addChatLog(`You need ${cost} Zeny to refine your staff!`, 'system');
        return;
      }
      state.zeny -= cost;
      state.weaponRefine += 1;
      sfx.playRefineSuccess();
      updateStaffVisualRefine();
      spawnFloatingText(playerMesh.position, `REFINE SUCCESS! +${state.weaponRefine}`, 'dmg-float crit', 2.9);
      addChatLog(`Hollgrehenn refined your Arcane Staff to +${state.weaponRefine}!`, 'level');
      updateHUD();
      openNPCDialog(npc);
    });
  } else if (npc.id === 'merchant') {
    textEl.textContent =
      'Welcome to the Geffen Apothecary! Stock up on Arcane Potions for dungeon expeditions or sell your monster loot.';
    addBtn('Buy 3x Arcane Potions (120 Z)', () => {
      if (state.zeny < 120) {
        addChatLog('Not enough Zeny!', 'system');
        return;
      }
      state.zeny -= 120;
      addInventoryItem({ id: 'potion', name: 'Arcane Potion', icon: '🧪', price: 50, consumable: true }, 3);
      sfx.playClick();
      addChatLog('Purchased 3x Arcane Potions!', 'loot');
      updateHUD();
    });
    addBtn('Sell All Monster Loot', () => {
      sellAllMonsterLoot();
    });
  } else if (npc.id === 'dean') {
    textEl.textContent =
      'Welcome to the Geffen Magic Academy! May the stars above Geffen Tower amplify your elemental spells.';
    addBtn('Receive Academy Blessing (+25% MATK)', () => {
      state.academyBuffTimer = 60.0;
      sfx.playLevelUp();
      spawnFloatingText(playerMesh.position, 'MATK +25% (60s)!', 'dmg-float crit', 2.6);
      addChatLog('Dean Zephyr granted you the Geffen Academy Blessing (+25% MATK for 60s)!', 'quest');
      updateHUD();
    });
  }

  modal.classList.remove('hidden');
}

function updateStaffVisualRefine() {
  const orbMat = playerMesh.userData.staffOrbMat;
  const colors = [0x5ce1ff, 0x4dff91, 0xffe44d, 0xff7b29, 0xff2975, 0xc94dff];
  const c = colors[Math.min(colors.length - 1, Math.floor(state.weaponRefine / 2))];
  orbMat.color.setHex(c);
  orbMat.emissive.setHex(c);
  orbMat.emissiveIntensity = 1.5 + state.weaponRefine * 0.25;
  playerMesh.userData.staffOrb.scale.setScalar(1 + state.weaponRefine * 0.08);
}

function sellAllMonsterLoot() {
  let earned = 0;
  state.inventory.forEach((item) => {
    if (!item.consumable && item.qty > 0) {
      earned += item.qty * item.price;
      item.qty = 0;
    }
  });
  if (earned > 0) {
    state.zeny += earned;
    sfx.playClick();
    addChatLog(`Sold monster loot for +${earned.toLocaleString()} Zeny!`, 'loot');
    renderInventory();
    updateHUD();
  } else {
    addChatLog('No monster loot in inventory to sell.', 'system');
  }
}

// ============================================================================
// 8. INPUT & CONTROLS (CLICK-TO-MOVE, WASD, CAMERA ORBIT, HOTKEYS)
// ============================================================================
const keys = {};
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isRightDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  if (e.code === 'Digit1') selectSkillSlot(1);
  if (e.code === 'Digit2') selectSkillSlot(2);
  if (e.code === 'Digit3') selectSkillSlot(3);
  if (e.code === 'Digit4') selectSkillSlot(4);
  if (e.code === 'Digit5') castSanctuary();
  if (e.code === 'Digit6') usePotion();

  if (e.code === 'KeyC') toggleModal('modal-stats');
  if (e.code === 'KeyI') {
    renderInventory();
    toggleModal('modal-inventory');
  }
  if (e.code === 'KeyH') toggleModal('modal-guide');
  if (e.code === 'KeyR') {
    state.camYaw = 0;
    state.camPitch = 0.62;
    state.camDist = 28;
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function selectSkillSlot(slot) {
  if (slot === 5) {
    castSanctuary();
    return;
  }
  if (slot === 6) {
    usePotion();
    return;
  }
  state.activeSlot = slot;
  sfx.playClick();
  document.querySelectorAll('.skill-slot').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.slot) === slot);
  });

  // If a monster is already targeted and in range, cast immediately!
  if (state.targetMonster && !state.targetMonster.dead) {
    const dist = playerMesh.position.distanceTo(state.targetMonster.position);
    const spell = SPELL_DEFS[state.activeSlot];
    if (dist <= spell.range) {
      performOffensiveSpell(state.activeSlot, state.targetMonster);
    }
  }
}

// Skillbar Click Handlers
document.querySelectorAll('.skill-slot').forEach((el) => {
  el.addEventListener('click', () => {
    selectSkillSlot(Number(el.dataset.slot));
  });
});

// Prevent context menu on right-click camera orbit
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    isRightDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    return;
  }
  if (e.button !== 0) return;

  // Left-Click Raycast: Check Monsters first, then NPCs, then Ground
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // 1. Check Living Monsters
  const aliveMonsterMeshes = monsters.filter((m) => !m.dead).map((m) => m.mesh);
  const monsterHits = raycaster.intersectObjects(aliveMonsterMeshes, true);
  if (monsterHits.length > 0) {
    let hitObj = monsterHits[0].object;
    while (hitObj.parent && !aliveMonsterMeshes.includes(hitObj)) {
      hitObj = hitObj.parent;
    }
    const monster = monsters.find((m) => m.mesh === hitObj);
    if (monster) {
      state.targetMonster = monster;
      state.targetNPC = null;
      state.moveTarget = null;
      clickCursor.visible = false;
      updateHUD();

      const spell = SPELL_DEFS[state.activeSlot];
      if (playerMesh.position.distanceTo(monster.position) <= spell.range) {
        performOffensiveSpell(state.activeSlot, monster);
      }
      return;
    }
  }

  // 2. Check NPCs
  const npcMeshes = npcs.map((n) => n.mesh);
  const npcHits = raycaster.intersectObjects(npcMeshes, true);
  if (npcHits.length > 0) {
    let hitObj = npcHits[0].object;
    while (hitObj.parent && !npcMeshes.includes(hitObj)) {
      hitObj = hitObj.parent;
    }
    const npc = npcs.find((n) => n.mesh === hitObj);
    if (npc) {
      state.targetNPC = npc;
      state.targetMonster = null;
      state.moveTarget = npc.position.clone();
      return;
    }
  }

  // 3. Check Ground for Classic RO Click-to-Move
  const groundMeshes = scene.children.filter((c) => c.name === 'ground' || c.type === 'Group');
  const groundHits = raycaster.intersectObjects(groundMeshes, true);
  if (groundHits.length > 0) {
    const pt = groundHits[0].point;
    state.moveTarget = new THREE.Vector3(pt.x, 0, pt.z);
    state.targetNPC = null;
    clickCursor.position.set(pt.x, 0.05, pt.z);
    clickCursor.visible = true;
    sfx.playMoveClick();
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isRightDragging) return;
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;

  state.camYaw -= dx * 0.0075;
  state.camPitch = Math.max(0.28, Math.min(1.25, state.camPitch + dy * 0.006));
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 2) isRightDragging = false;
});

window.addEventListener(
  'wheel',
  (e) => {
    state.camDist = Math.max(12, Math.min(62, state.camDist + e.deltaY * 0.025));
  },
  { passive: true }
);

// ============================================================================
// 9. UI BUTTONS, MODALS, ENVIRONMENT & TELEPORT HANDLERS
// ============================================================================
function toggleModal(id) {
  sfx.playClick();
  const el = document.getElementById(id);
  el.classList.toggle('hidden');
}

document.getElementById('btn-toggle-stats').addEventListener('click', () => toggleModal('modal-stats'));
document.getElementById('btn-toggle-inv').addEventListener('click', () => {
  renderInventory();
  toggleModal('modal-inventory');
});
document.getElementById('btn-toggle-guide').addEventListener('click', () => toggleModal('modal-guide'));

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.close).classList.add('hidden');
  });
});

document.querySelectorAll('.stat-plus-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.statPoints <= 0) return;
    const key = btn.dataset.stat;
    state.stats[key] += 1;
    state.statPoints -= 1;
    recalcDerivedStats();
    sfx.playClick();
    updateHUD();
  });
});

document.getElementById('btn-sell-loot').addEventListener('click', sellAllMonsterLoot);

document.getElementById('btn-center-cam').addEventListener('click', () => {
  state.camYaw = 0;
  state.camPitch = 0.62;
  state.camDist = 28;
});

// Time of Day Lighting Presets
function setTimeOfDay(mode) {
  state.timeOfDay = mode;
  document.querySelectorAll('#hud-minimap .env-btn').forEach((b) => {
    if (b.id.startsWith('btn-time-')) b.classList.remove('active');
  });

  if (mode === 'day') {
    document.getElementById('btn-time-day').classList.add('active');
    scene.background.setHex(0x8ec5fc);
    scene.fog.color.setHex(0x8ec5fc);
    hemiLight.intensity = 0.9;
    dirLight.color.setHex(0xfff4d6);
    dirLight.intensity = 1.45;
  } else if (mode === 'sunset') {
    document.getElementById('btn-time-sunset').classList.add('active');
    scene.background.setHex(0xeb8c6b);
    scene.fog.color.setHex(0xd97b6c);
    hemiLight.intensity = 0.65;
    dirLight.color.setHex(0xff9e5e);
    dirLight.intensity = 1.25;
  } else if (mode === 'night') {
    document.getElementById('btn-time-night').classList.add('active');
    scene.background.setHex(0x0d152e);
    scene.fog.color.setHex(0x0d152e);
    hemiLight.intensity = 0.35;
    dirLight.color.setHex(0x6e9eff);
    dirLight.intensity = 0.65;
  }
}

document.getElementById('btn-time-day').addEventListener('click', () => setTimeOfDay('day'));
document.getElementById('btn-time-sunset').addEventListener('click', () => setTimeOfDay('sunset'));
document.getElementById('btn-time-night').addEventListener('click', () => setTimeOfDay('night'));

document.getElementById('btn-audio').addEventListener('click', (e) => {
  const on = sfx.toggle();
  e.currentTarget.textContent = on ? '🔊 SFX' : '🔇 Mute';
});

function warpPlayerTo(pos) {
  sfx.playWarp();
  playerMesh.position.copy(pos);
  state.moveTarget = null;
  state.targetMonster = null;
  clickCursor.visible = false;
  vfx.spawnLevelUpPillar(playerMesh.position);
}

document.querySelectorAll('.tp-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dest = btn.dataset.warp;
    if (dest === 'tower') warpPlayerTo(new THREE.Vector3(0, 0, 17));
    if (dest === 'academy') warpPlayerTo(new THREE.Vector3(-35, 0, -35));
    if (dest === 'field') warpPlayerTo(new THREE.Vector3(0, 0, 79));
    if (dest === 'dungeon') warpPlayerTo(new THREE.Vector3(DUNGEON_CENTER.x, 0, DUNGEON_CENTER.z + 18));
  });
});

// ============================================================================
// 10. MINIMAP RENDERER (GEFFEN CIRCULAR ARCHITECTURE)
// ============================================================================
const minimapCanvas = document.getElementById('minimap-canvas');
const mmCtx = minimapCanvas.getContext('2d');

// Allow clicking directly on the Minimap to walk to that location in Geffen!
minimapCanvas.addEventListener('click', (e) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width - 0.5;
  const ny = (e.clientY - rect.top) / rect.height - 0.5;

  if (state.currentZoneId === 'dungeon') {
    const wx = DUNGEON_CENTER.x + nx * 100;
    const wz = DUNGEON_CENTER.z + ny * 100;
    state.moveTarget = new THREE.Vector3(wx, 0, wz);
  } else {
    const wx = nx * 260;
    const wz = ny * 260;
    state.moveTarget = new THREE.Vector3(wx, 0, wz);
  }
  sfx.playMoveClick();
});

function drawMinimap() {
  const w = minimapCanvas.width;
  const h = minimapCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  mmCtx.clearRect(0, 0, w, h);

  if (state.currentZoneId === 'dungeon') {
    const scale = w / 110;
    mmCtx.fillStyle = '#140e24';
    mmCtx.fillRect(0, 0, w, h);

    mmCtx.fillStyle = '#2d1f4a';
    mmCtx.strokeStyle = '#9e54ff';
    mmCtx.lineWidth = 2;
    mmCtx.beginPath();
    mmCtx.arc(cx, cy, 44 * scale, 0, Math.PI * 2);
    mmCtx.fill();
    mmCtx.stroke();

    // Dungeon Monsters
    monsters.forEach((m) => {
      if (m.dead) return;
      if (Math.hypot(m.position.x - DUNGEON_CENTER.x, m.position.z - DUNGEON_CENTER.z) < 60) {
        const mx = cx + (m.position.x - DUNGEON_CENTER.x) * scale;
        const mz = cy + (m.position.z - DUNGEON_CENTER.z) * scale;
        mmCtx.fillStyle = m.mvp ? '#ffe042' : '#ff4d4d';
        mmCtx.beginPath();
        mmCtx.arc(mx, mz, m.mvp ? 4.5 : 2.8, 0, Math.PI * 2);
        mmCtx.fill();
      }
    });

    // Player Dot
    const px = cx + (playerMesh.position.x - DUNGEON_CENTER.x) * scale;
    const pz = cy + (playerMesh.position.z - DUNGEON_CENTER.z) * scale;
    mmCtx.fillStyle = '#38ff9c';
    mmCtx.beginPath();
    mmCtx.arc(px, pz, 4, 0, Math.PI * 2);
    mmCtx.fill();
    return;
  }

  // Main Geffen Map Minimap (World radius 135 -> Canvas 190)
  const scale = w / 260;

  // Outskirts Grass
  mmCtx.fillStyle = '#2e5930';
  mmCtx.fillRect(0, 0, w, h);

  // Outer Cobblestone Ring
  mmCtx.fillStyle = '#6f7c96';
  mmCtx.beginPath();
  mmCtx.arc(cx, cy, 70 * scale, 0, Math.PI * 2);
  mmCtx.fill();

  // Circular Moat
  mmCtx.fillStyle = '#2474cc';
  mmCtx.beginPath();
  mmCtx.arc(cx, cy, 31.8 * scale, 0, Math.PI * 2);
  mmCtx.fill();

  // 4 Cardinal Bridges
  mmCtx.fillStyle = '#b9c4db';
  mmCtx.fillRect(cx - 3.5 * scale, cy - 33 * scale, 7 * scale, 66 * scale);
  mmCtx.fillRect(cx - 33 * scale, cy - 3.5 * scale, 66 * scale, 7 * scale);

  // Central Plaza Island
  mmCtx.fillStyle = '#8b99b5';
  mmCtx.beginPath();
  mmCtx.arc(cx, cy, 20.5 * scale, 0, Math.PI * 2);
  mmCtx.fill();

  // Central Geffen Tower
  mmCtx.fillStyle = '#3a62cc';
  mmCtx.strokeStyle = '#ffd54f';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.arc(cx, cy, 9.5 * scale, 0, Math.PI * 2);
  mmCtx.fill();
  mmCtx.stroke();

  // NPCs (Yellow Dots)
  npcs.forEach((n) => {
    mmCtx.fillStyle = '#ffdf4d';
    mmCtx.beginPath();
    mmCtx.arc(cx + n.position.x * scale, cy + n.position.z * scale, 3, 0, Math.PI * 2);
    mmCtx.fill();
  });

  // Field Monsters (Red Dots)
  monsters.forEach((m) => {
    if (m.dead || Math.hypot(m.position.x, m.position.z) > 150) return;
    mmCtx.fillStyle = '#ff4f4f';
    mmCtx.beginPath();
    mmCtx.arc(cx + m.position.x * scale, cy + m.position.z * scale, 2.2, 0, Math.PI * 2);
    mmCtx.fill();
  });

  // Player Position (Bright Green Arrow/Dot)
  const px = cx + playerMesh.position.x * scale;
  const pz = cy + playerMesh.position.z * scale;
  mmCtx.fillStyle = '#3dff9b';
  mmCtx.strokeStyle = '#ffffff';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.arc(px, pz, 4, 0, Math.PI * 2);
  mmCtx.fill();
  mmCtx.stroke();
}

// ============================================================================
// 11. MAIN GAME LOOP
// ============================================================================
const clock = new THREE.Clock();
let regenAccumulator = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  // 1. Update Map Animations (Geffen Tower floating rings, water ripples, portals)
  geffenMap.update(elapsed);
  vfx.update(dt);

  // Gentle floating mana particles
  manaParticles.rotation.y = elapsed * 0.025;

  // 2. Camera Keyboard Orbit (Q / E)
  if (keys['KeyQ']) state.camYaw += dt * 1.8;
  if (keys['KeyE']) state.camYaw -= dt * 1.8;

  // 3. Player Movement (WASD / Arrow Keys or Click-to-Move / Auto-Approach Target)
  let moveX = 0;
  let moveZ = 0;
  if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  const moveSpeed = 10.5 + state.stats.agi * 0.15;
  let isMoving = false;

  if (moveX !== 0 || moveZ !== 0) {
    // Direct WASD movement relative to camera yaw
    state.moveTarget = null;
    clickCursor.visible = false;

    const len = Math.hypot(moveX, moveZ);
    moveX /= len;
    moveZ /= len;

    const sin = Math.sin(state.camYaw);
    const cos = Math.cos(state.camYaw);
    const wx = moveX * cos + moveZ * sin;
    const wz = -moveX * sin + moveZ * cos;

    const nextPos = playerMesh.position.clone();
    nextPos.x += wx * moveSpeed * dt;
    nextPos.z += wz * moveSpeed * dt;

    const resolved = geffenMap.resolvePosition(playerMesh.position, nextPos);
    playerMesh.position.copy(resolved);
    playerMesh.rotation.y = Math.atan2(wx, wz);
    isMoving = true;
  } else if (state.targetMonster && !state.targetMonster.dead) {
    // If targeting a monster, walk until within spell casting range
    const spell = SPELL_DEFS[state.activeSlot];
    const dist = playerMesh.position.distanceTo(state.targetMonster.position);
    if (dist > spell.range - 0.8) {
      const dir = state.targetMonster.position.clone().sub(playerMesh.position).normalize();
      const nextPos = playerMesh.position.clone().addScaledVector(dir, moveSpeed * dt);
      playerMesh.position.copy(geffenMap.resolvePosition(playerMesh.position, nextPos));
      playerMesh.rotation.y = Math.atan2(dir.x, dir.z);
      isMoving = true;
    } else if (state.cooldowns[state.activeSlot] <= 0) {
      performOffensiveSpell(state.activeSlot, state.targetMonster);
    }
  } else if (state.moveTarget) {
    const dx = state.moveTarget.x - playerMesh.position.x;
    const dz = state.moveTarget.z - playerMesh.position.z;
    const dist = Math.hypot(dx, dz);

    const stopDist = state.targetNPC ? 2.8 : 0.45;
    if (dist > stopDist) {
      const nextPos = playerMesh.position.clone();
      nextPos.x += (dx / dist) * moveSpeed * dt;
      nextPos.z += (dz / dist) * moveSpeed * dt;
      playerMesh.position.copy(geffenMap.resolvePosition(playerMesh.position, nextPos));
      playerMesh.rotation.y = Math.atan2(dx, dz);
      isMoving = true;
    } else {
      state.moveTarget = null;
      clickCursor.visible = false;
      if (state.targetNPC) {
        openNPCDialog(state.targetNPC);
        state.targetNPC = null;
      }
    }
  }

  // Player walk bounce & staff sway animation
  if (isMoving) {
    playerMesh.position.y = Math.abs(Math.sin(elapsed * 11)) * 0.18;
    playerMesh.userData.staffGroup.rotation.x = Math.sin(elapsed * 11) * 0.25;
  } else {
    playerMesh.position.y = Math.sin(elapsed * 2.5) * 0.04;
    playerMesh.userData.staffGroup.rotation.x = Math.sin(elapsed * 2.5) * 0.05;
  }

  // Check Warp Portals (e.g., Geffen Tower Dungeon Entrance & Return Portal)
  for (const portal of geffenMap.portals) {
    if (Math.hypot(playerMesh.position.x - portal.x, playerMesh.position.z - portal.z) < portal.r) {
      warpPlayerTo(portal.targetPos);
      addChatLog(`Warped to ${portal.label}!`, 'system');
      break;
    }
  }

  // Check Current Map Zone (Town Safe Zone vs Outskirts Field vs Dungeon B1)
  const zoneInfo = geffenMap.getZoneAt(playerMesh.position.x, playerMesh.position.z);
  if (zoneInfo.id !== state.currentZoneId) {
    state.currentZoneId = zoneInfo.id;
    document.getElementById('ui-map-name').textContent = zoneInfo.name;
    const badgeEl = document.getElementById('zone-badge');
    badgeEl.textContent = zoneInfo.badge;
    badgeEl.className = `zone-badge ${zoneInfo.id}`;
    showZoneAnnouncement('Rune-Midgarts Kingdom', zoneInfo.title);
    if (zoneInfo.id === 'dungeon') {
      setTimeOfDay('night');
    }
  }

  // Update Minimap Coordinate Title
  document.getElementById('minimap-title').textContent = `Geffen (${Math.round(
    playerMesh.position.x
  )}, ${Math.round(playerMesh.position.z)})`;

  // 4. Update Cooldowns, Buffs & Natural HP/SP Regeneration
  for (let slot = 1; slot <= 6; slot++) {
    if (state.cooldowns[slot] > 0) {
      state.cooldowns[slot] = Math.max(0, state.cooldowns[slot] - dt);
      const maxCd = SPELL_DEFS[slot]?.cooldown || 1.0;
      const pct = (state.cooldowns[slot] / maxCd) * 100;
      document.getElementById(`cd-${slot}`).style.height = `${pct}%`;
    } else {
      document.getElementById(`cd-${slot}`).style.height = '0%';
    }
  }

  if (state.academyBuffTimer > 0) {
    state.academyBuffTimer = Math.max(0, state.academyBuffTimer - dt);
  }
  if (state.shieldTimer > 0) {
    state.shieldTimer = Math.max(0, state.shieldTimer - dt);
    playerMesh.userData.shieldMesh.rotation.y += dt * 1.5;
    if (state.shieldTimer <= 0) {
      playerMesh.userData.shieldMesh.visible = false;
    }
  }

  regenAccumulator += dt;
  if (regenAccumulator >= 1.5) {
    regenAccumulator = 0;
    const inTownBonus = state.currentZoneId === 'safe' ? 2.2 : 1.0;
    state.hp = Math.min(state.maxHp, state.hp + Math.ceil((4 + state.stats.vit * 0.6) * inTownBonus));
    state.sp = Math.min(state.maxSp, state.sp + Math.ceil((5 + state.stats.int * 0.75) * inTownBonus));
    updateHUD();
  }

  // 5. Update Monsters AI (Wander, Chase, Attack, Respawn)
  monsters.forEach((m) => {
    const labelEl = monsterLabelEls.get(m.id);
    if (m.dead) {
      if (labelEl) labelEl.style.display = 'none';
      m.respawnTimer -= dt;
      if (m.respawnTimer <= 0) {
        m.dead = false;
        m.hp = m.maxHp;
        m.aggroed = false;
        m.position.copy(m.spawnPos);
        m.mesh.visible = true;
      }
      return;
    }

    if (m.slowTimer > 0) m.slowTimer -= dt;
    if (m.attackCooldown > 0) m.attackCooldown -= dt;

    const distToPlayer = m.position.distanceTo(playerMesh.position);
    const shouldChase = (m.aggro && distToPlayer < 13.5) || (m.aggroed && distToPlayer < 26);

    if (shouldChase && state.currentZoneId !== 'safe') {
      if (distToPlayer > 1.85) {
        const dir = playerMesh.position.clone().sub(m.position).normalize();
        const spd = m.speed * (m.slowTimer > 0 ? 0.5 : 1.0);
        m.position.addScaledVector(dir, spd * dt);
        m.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      } else if (m.attackCooldown <= 0) {
        // Monster attacks Player
        m.attackCooldown = 1.35;
        let dmg = Math.max(1, Math.round(m.atk - state.stats.vit * 0.8));
        if (state.shieldTimer > 0) {
          dmg = Math.max(1, Math.round(dmg * 0.45)); // Energy Coat reduces damage!
        }
        state.hp -= dmg;
        spawnFloatingText(playerMesh.position, `-${dmg}`, 'dmg-float player-hit', 2.0);

        if (state.hp <= 0) {
          // Respawn safely in Central Geffen Plaza by Kafra
          state.hp = Math.floor(state.maxHp * 0.5);
          state.sp = Math.floor(state.maxSp * 0.5);
          warpPlayerTo(new THREE.Vector3(0, 0, 17));
          addChatLog('You fainted in battle and were rescued back to Geffen Central Plaza!', 'system');
        }
        updateHUD();
      }
    } else {
      // Gentle idle wandering near spawn point
      m.wanderTimer -= dt;
      if (m.wanderTimer <= 0) {
        m.wanderTimer = 2.5 + Math.random() * 3.5;
        m.wanderAngle = Math.random() * Math.PI * 2;
      }
      if (m.position.distanceTo(m.spawnPos) > 8) {
        m.wanderAngle = Math.atan2(m.spawnPos.z - m.position.z, m.spawnPos.x - m.position.x);
      }
      m.position.x += Math.cos(m.wanderAngle) * m.speed * 0.35 * dt;
      m.position.z += Math.sin(m.wanderAngle) * m.speed * 0.35 * dt;
      m.mesh.rotation.y = Math.atan2(Math.cos(m.wanderAngle), Math.sin(m.wanderAngle));
    }

    // Monster bouncy slime / float animation
    m.mesh.position.y = Math.abs(Math.sin(elapsed * 4.5 + m.bounceOffset)) * 0.25;

    // Update Monster Overhead Label
    if (labelEl && distToPlayer < 48) {
      const screen = projectToScreen(new THREE.Vector3(m.position.x, 2.2 * m.scale, m.position.z));
      if (screen) {
        labelEl.style.display = 'block';
        labelEl.style.left = `${screen.x}px`;
        labelEl.style.top = `${screen.y}px`;
      } else {
        labelEl.style.display = 'none';
      }
    } else if (labelEl) {
      labelEl.style.display = 'none';
    }
  });

  // 6. Update NPC & Player Foot Labels
  npcs.forEach((npc) => {
    const el = npcLabelEls.get(npc.id);
    if (!el) return;
    if (npc.position.distanceTo(playerMesh.position) < 52) {
      const screen = projectToScreen(new THREE.Vector3(npc.position.x, 2.65, npc.position.z));
      if (screen) {
        el.style.display = 'block';
        el.style.left = `${screen.x}px`;
        el.style.top = `${screen.y}px`;
        return;
      }
    }
    el.style.display = 'none';
  });

  const footScreen = projectToScreen(new THREE.Vector3(playerMesh.position.x, -0.15, playerMesh.position.z));
  if (footScreen) {
    playerFootEl.style.left = `${footScreen.x}px`;
    playerFootEl.style.top = `${footScreen.y}px`;
  }

  // 7. Update Orbital Camera Position around Player
  const camX =
    playerMesh.position.x + Math.sin(state.camYaw) * Math.cos(state.camPitch) * state.camDist;
  const camY = playerMesh.position.y + Math.sin(state.camPitch) * state.camDist;
  const camZ =
    playerMesh.position.z + Math.cos(state.camYaw) * Math.cos(state.camPitch) * state.camDist;

  camera.position.set(camX, camY, camZ);
  camera.lookAt(playerMesh.position.x, playerMesh.position.y + 1.2, playerMesh.position.z);

  // 8. Draw Minimap & Render 3D Scene
  drawMinimap();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHUD();
showZoneAnnouncement('Rune-Midgarts Kingdom', 'GEFFEN — CITY OF MAGIC');
animate();
