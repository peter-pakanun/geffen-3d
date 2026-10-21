import * as THREE from 'three';
import { DUNGEON_CENTER } from './map.js';

export function createPlayerMesh() {
  const group = new THREE.Group();

  // Robe Body
  const robeMat = new THREE.MeshStandardMaterial({
    color: 0x2b4ba8,
    roughness: 0.55,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffd24c,
    metalness: 0.6,
    roughness: 0.3,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdfc4,
    roughness: 0.65,
  });

  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.55, 12), robeMat);
  robe.position.y = 0.78;
  robe.castShadow = true;
  group.add(robe);

  // Golden Hem Trim
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.05, 8, 24), trimMat);
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.12;
  group.add(hem);

  // Cape / Mantle
  const cape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.62, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x1c2f6e, roughness: 0.6 })
  );
  cape.position.y = 1.32;
  group.add(cape);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), skinMat);
  head.position.y = 1.82;
  head.castShadow = true;
  group.add(head);

  // Eyes (facing +Z by default)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c2645 });
  [-0.12, 0.12].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), eyeMat);
    eye.position.set(ex, 1.84, 0.32);
    group.add(eye);
  });

  // Iconic Pointed Wizard Hat
  const hatGroup = new THREE.Group();
  hatGroup.position.y = 2.04;
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x243b82, roughness: 0.5 });

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.07, 18), hatMat);
  hatGroup.add(brim);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.14, 16), trimMat);
  band.position.y = 0.08;
  hatGroup.add(band);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 14), hatMat);
  cone.position.y = 0.58;
  cone.rotation.x = -0.15;
  hatGroup.add(cone);

  group.add(hatGroup);

  // Arcane Staff (Right Hand)
  const staffGroup = new THREE.Group();
  staffGroup.position.set(0.55, 1.1, 0.25);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 2.05, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 })
  );
  staffGroup.add(shaft);

  const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), trimMat);
  staffRing.position.y = 1.08;
  staffGroup.add(staffRing);

  const staffOrbMat = new THREE.MeshStandardMaterial({
    color: 0x5ce1ff,
    emissive: 0x29a8ff,
    emissiveIntensity: 1.5,
    roughness: 0.15,
  });
  const staffOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), staffOrbMat);
  staffOrb.position.y = 1.08;
  staffGroup.add(staffOrb);

  group.add(staffGroup);

  // Ground Casting Magic Circle under Player
  const castRingGeo = new THREE.RingGeometry(1.15, 1.45, 32);
  castRingGeo.rotateX(-Math.PI / 2);
  const castRingMat = new THREE.MeshBasicMaterial({
    color: 0x59d2ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const castRing = new THREE.Mesh(castRingGeo, castRingMat);
  castRing.position.y = 0.08;
  castRing.visible = false;
  group.add(castRing);

  // Energy Coat Shield Sphere
  const shieldGeo = new THREE.SphereGeometry(1.25, 20, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.22,
    wireframe: true,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 1.15;
  shieldMesh.visible = false;
  group.add(shieldMesh);

  group.userData = {
    staffGroup,
    staffOrb,
    staffOrbMat,
    castRing,
    shieldMesh,
    hatGroup,
  };

  return group;
}

export function createClickCursor(scene) {
  const group = new THREE.Group();
  const ringGeo = new THREE.RingGeometry(0.55, 0.78, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3dff9b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.09;
  group.add(ring);

  const innerGeo = new THREE.CircleGeometry(0.35, 16);
  innerGeo.rotateX(-Math.PI / 2);
  const inner = new THREE.Mesh(
    innerGeo,
    new THREE.MeshBasicMaterial({ color: 0x80ffc0, transparent: true, opacity: 0.45 })
  );
  inner.position.y = 0.08;
  group.add(inner);

  group.visible = false;
  scene.add(group);
  return group;
}

export function createNPCs(scene) {
  const npcDefs = [
    {
      id: 'kafra',
      name: 'Kafra Clarisse',
      role: 'Kafra Service',
      portrait: '👩‍💼',
      x: 5.2,
      z: 15.2,
      robeColor: 0x3b69c9,
      hatColor: 0xffffff,
    },
    {
      id: 'archmage',
      name: 'Archmage Elion',
      role: 'Quest & Tower Master',
      portrait: '🧙‍♂️',
      x: -5.2,
      z: 14.5,
      robeColor: 0x5c2d9c,
      hatColor: 0x3c1f6e,
    },
    {
      id: 'blacksmith',
      name: 'Hollgrehenn',
      role: 'Master Blacksmith',
      portrait: '⚒️',
      x: 30.5,
      z: 30.5,
      robeColor: 0x8f3424,
      hatColor: 0x3b2a22,
    },
    {
      id: 'merchant',
      name: 'Alchemist Aurelia',
      role: 'Potions & Loot Buyer',
      portrait: '🧪',
      x: -30.5,
      z: 30.5,
      robeColor: 0x287a56,
      hatColor: 0x1d543c,
    },
    {
      id: 'dean',
      name: 'Dean Zephyr',
      role: 'Geffen Magic Academy',
      portrait: '📘',
      x: -31.5,
      z: -31.5,
      robeColor: 0x264c9e,
      hatColor: 0xffd24c,
    },
  ];

  const npcs = [];
  npcDefs.forEach((def) => {
    const group = new THREE.Group();
    group.position.set(def.x, 0, def.z);

    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.55, 12),
      new THREE.MeshStandardMaterial({ color: def.robeColor, roughness: 0.6 })
    );
    body.position.y = 0.78;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffe0c4, roughness: 0.65 })
    );
    head.position.y = 1.8;
    group.add(head);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: def.hatColor })
    );
    hat.position.y = 2.12;
    group.add(hat);

    // Subtle yellow NPC indicator ring on ground
    const ringGeo = new THREE.RingGeometry(0.85, 1.0, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xffdf5e, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    ring.position.y = 0.06;
    group.add(ring);

    scene.add(group);
    npcs.push({
      ...def,
      mesh: group,
      position: group.position,
    });
  });

  return npcs;
}

// Monster Templates inspired by Geffen Field & Geffen Tower Dungeon
export const MONSTER_TEMPLATES = {
  poring: {
    type: 'poring',
    name: 'Poring',
    level: 1,
    element: 'Water',
    maxHp: 75,
    atk: 11,
    exp: 28,
    jobExp: 20,
    zeny: [18, 35],
    speed: 3.1,
    aggro: false,
    color: 0xff7eb6,
    scale: 1.0,
    drops: [
      { id: 'jellopy', name: 'Jellopy', icon: '🍬', price: 15, chance: 0.75 },
      { id: 'apple', name: 'Apple', icon: '🍎', price: 22, chance: 0.4 },
      { id: 'potion', name: 'Arcane Potion', icon: '🧪', price: 50, chance: 0.22, consumable: true },
    ],
  },
  fabre: {
    type: 'fabre',
    name: 'Fabre',
    level: 3,
    element: 'Earth',
    maxHp: 135,
    atk: 18,
    exp: 52,
    jobExp: 38,
    zeny: [32, 58],
    speed: 3.5,
    aggro: false,
    color: 0x5cd65c,
    scale: 1.05,
    drops: [
      { id: 'clover', name: 'Clover', icon: '🍀', price: 28, chance: 0.65 },
      { id: 'herb', name: 'Green Herb', icon: '🌿', price: 42, chance: 0.4 },
    ],
  },
  spore: {
    type: 'spore',
    name: 'Poison Spore',
    level: 6,
    element: 'Poison',
    maxHp: 260,
    atk: 30,
    exp: 105,
    jobExp: 80,
    zeny: [65, 110],
    speed: 3.9,
    aggro: true,
    color: 0x9c4dcc,
    scale: 1.2,
    drops: [
      { id: 'spore_cap', name: 'Mushroom Spore', icon: '🍄', price: 55, chance: 0.7 },
      { id: 'blue_gem', name: 'Blue Gemstone', icon: '💎', price: 120, chance: 0.3 },
      { id: 'potion', name: 'Arcane Potion', icon: '🧪', price: 50, chance: 0.3, consumable: true },
    ],
  },
  whisper: {
    type: 'whisper',
    name: 'Whisper',
    level: 10,
    element: 'Ghost',
    maxHp: 460,
    atk: 46,
    exp: 210,
    jobExp: 165,
    zeny: [120, 210],
    speed: 4.3,
    aggro: true,
    color: 0xd9e6ff,
    scale: 1.25,
    drops: [
      { id: 'fabric', name: 'Transparent Cloth', icon: '👻', price: 110, chance: 0.65 },
      { id: 'oridecon', name: 'Oridecon Ore', icon: '🔮', price: 240, chance: 0.35 },
    ],
  },
  doppel: {
    type: 'doppel',
    name: 'Arch-Doppel [MVP]',
    level: 15,
    element: 'Shadow',
    maxHp: 1650,
    atk: 78,
    exp: 900,
    jobExp: 750,
    zeny: [650, 1100],
    speed: 4.8,
    aggro: true,
    mvp: true,
    color: 0x26173d,
    scale: 1.65,
    drops: [
      { id: 'mvp_crown', name: 'Geffen Diadem', icon: '👑', price: 850, chance: 0.9 },
      { id: 'oridecon', name: 'Oridecon Ore', icon: '🔮', price: 240, chance: 0.85 },
      { id: 'potion', name: 'Arcane Potion', icon: '🧪', price: 50, chance: 0.9, consumable: true },
    ],
  },
};

export function createMonsterMesh(template) {
  const group = new THREE.Group();
  const s = template.scale || 1;

  if (template.type === 'poring') {
    // Translucent bouncy pink slime droplet
    const bodyMat = new THREE.MeshStandardMaterial({
      color: template.color,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.75 * s, 18, 14), bodyMat);
    body.scale.set(1.12, 0.86, 1.12);
    body.position.y = 0.62 * s;
    body.castShadow = true;
    group.add(body);

    // Cute droplet tip on top
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.45 * s, 10), bodyMat);
    tip.position.y = 1.28 * s;
    group.add(tip);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a091e });
    [-0.22, 0.22].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), eyeMat);
      eye.position.set(ex, 0.68 * s, 0.72 * s);
      group.add(eye);
    });
  } else if (template.type === 'spore') {
    // Stalk + Purple Spotted Mushroom Cap
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * s, 0.48 * s, 0.85 * s, 12),
      new THREE.MeshStandardMaterial({ color: 0xf2e6d8, roughness: 0.7 })
    );
    stalk.position.y = 0.42 * s;
    stalk.castShadow = true;
    group.add(stalk);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.85 * s, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.5 })
    );
    cap.position.y = 0.75 * s;
    cap.castShadow = true;
    group.add(cap);
  } else if (template.type === 'whisper' || template.type === 'doppel') {
    // Floating Phantom / MVP Dark Knight Mage
    const cloakMat = new THREE.MeshStandardMaterial({
      color: template.color,
      emissive: template.mvp ? 0x6a1bbd : 0x3c5899,
      emissiveIntensity: 0.45,
      transparent: !template.mvp,
      opacity: template.mvp ? 1.0 : 0.78,
    });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.75 * s, 1.8 * s, 12), cloakMat);
    body.position.y = 1.05 * s;
    group.add(body);

    const eyeColor = template.mvp ? 0xff2a55 : 0x70f8ff;
    [-0.18, 0.18].forEach((ex) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 * s, 8, 8),
        new THREE.MeshBasicMaterial({ color: eyeColor })
      );
      eye.position.set(ex * s, 1.45 * s, 0.42 * s);
      group.add(eye);
    });

    if (template.mvp) {
      // Golden MVP Halo Ring
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.08, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xffd740 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.12;
      group.add(halo);
    }
  } else {
    // Fabre / Forest Creature
    const segMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.5 });
    [0, -0.45, -0.85].forEach((oz, idx) => {
      const r = (0.52 - idx * 0.08) * s;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), segMat);
      seg.position.set(0, r, oz * s);
      seg.castShadow = true;
      group.add(seg);
    });
  }

  return group;
}

export function spawnInitialMonsters(scene) {
  const monsters = [];
  let nextId = 1;

  const addMonster = (templateKey, x, z) => {
    const tpl = MONSTER_TEMPLATES[templateKey];
    const mesh = createMonsterMesh(tpl);
    mesh.position.set(x, 0, z);
    scene.add(mesh);

    monsters.push({
      id: nextId++,
      ...tpl,
      hp: tpl.maxHp,
      mesh,
      position: mesh.position,
      spawnPos: new THREE.Vector3(x, 0, z),
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: Math.random() * 3,
      attackCooldown: 0,
      slowTimer: 0,
      dead: false,
      respawnTimer: 0,
      bounceOffset: Math.random() * Math.PI * 2,
    });
  };

  // 1. Spawn Porings & Fabres around the 4 Geffen Gates (r = 76..106)
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI * 2) / 18 + 0.1;
    const r = 77 + (i % 3) * 9;
    addMonster(i % 3 === 0 ? 'fabre' : 'poring', Math.cos(a) * r, Math.sin(a) * r);
  }

  // 2. Spawn Poison Spores in outer Geffen Field (r = 104..128)
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12 + 0.25;
    const r = 108 + (i % 2) * 12;
    addMonster('spore', Math.cos(a) * r, Math.sin(a) * r);
  }

  // 3. Spawn Whispers & Arch-Doppel MVP inside Geffen Tower Dungeon B1
  for (let i = 0; i < 9; i++) {
    const a = (i * Math.PI * 2) / 9;
    const r = 16 + (i % 2) * 10;
    addMonster(
      'whisper',
      DUNGEON_CENTER.x + Math.cos(a) * r,
      DUNGEON_CENTER.z + Math.sin(a) * r
    );
  }
  addMonster('doppel', DUNGEON_CENTER.x, DUNGEON_CENTER.z - 6);

  return monsters;
}
