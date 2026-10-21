import * as THREE from 'three';

export const SPELL_DEFS = {
  1: {
    slot: 1,
    id: 'fire_bolt',
    name: 'Fire Bolt',
    shout: 'Fire Bolt !!',
    element: 'Fire',
    spCost: 12,
    cooldown: 1.1,
    hits: 3,
    power: 1.15,
    range: 17,
    color: 0xff5a1f,
    sfxType: 'fire',
  },
  2: {
    slot: 2,
    id: 'cold_bolt',
    name: 'Cold Bolt',
    shout: 'Cold Bolt !!',
    element: 'Water',
    spCost: 12,
    cooldown: 1.2,
    hits: 3,
    power: 1.1,
    range: 17,
    chill: 3.5,
    color: 0x52d1ff,
    sfxType: 'ice',
  },
  3: {
    slot: 3,
    id: 'jupitel',
    name: 'Jupitel Thunder',
    shout: 'Jupitel Thunder !!',
    element: 'Wind',
    spCost: 15,
    cooldown: 1.4,
    hits: 4,
    power: 1.05,
    range: 18,
    color: 0xffe84d,
    sfxType: 'lightning',
  },
  4: {
    slot: 4,
    id: 'meteor',
    name: 'Meteor Storm',
    shout: 'Meteor Storm !!',
    element: 'Fire',
    spCost: 35,
    cooldown: 3.8,
    hits: 4,
    power: 1.45,
    range: 18,
    aoeRadius: 8.5,
    color: 0xff3b2f,
    sfxType: 'meteor',
  },
  5: {
    slot: 5,
    id: 'sanctuary',
    name: 'Arcane Sanctuary',
    shout: 'Energy Coat & Heal !!',
    element: 'Holy',
    spCost: 25,
    cooldown: 4.5,
    selfBuff: true,
    color: 0x6bffa8,
    sfxType: 'heal',
  },
};

// Classic RO Elemental Bonus Multiplier
export function getElementalMultiplier(spellElement, targetElement) {
  if (spellElement === 'Wind' && targetElement === 'Water') return 1.75; // Lightning crushes Porings!
  if (spellElement === 'Fire' && (targetElement === 'Earth' || targetElement === 'Poison' || targetElement === 'Shadow')) return 1.5;
  if (spellElement === 'Water' && targetElement === 'Fire') return 1.5;
  return 1.0;
}

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.effects = [];
  }

  spawnBoltEffect(spell, targetPos) {
    const group = new THREE.Group();
    const count = spell.hits || 3;

    for (let i = 0; i < count; i++) {
      let mesh;
      if (spell.id === 'fire_bolt') {
        mesh = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 1.3, 8),
          new THREE.MeshBasicMaterial({ color: 0xff621a })
        );
        mesh.rotation.x = Math.PI;
      } else if (spell.id === 'cold_bolt') {
        mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.38, 0),
          new THREE.MeshBasicMaterial({ color: 0x6ce2ff })
        );
        mesh.scale.set(0.7, 1.9, 0.7);
      } else {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.36, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xfff066 })
        );
      }

      const angle = (i * Math.PI * 2) / count;
      mesh.position.set(
        targetPos.x + Math.cos(angle) * 0.65,
        8.5 + i * 2.2,
        targetPos.z + Math.sin(angle) * 0.65
      );
      group.add(mesh);
    }

    // Ground target shockwave ring
    const ringGeo = new THREE.RingGeometry(0.4, 1.4, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: spell.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(targetPos.x, 0.12, targetPos.z);
    group.add(ring);

    this.scene.add(group);
    this.effects.push({
      group,
      age: 0,
      duration: 0.55,
      update: (dt, age) => {
        group.children.forEach((child, idx) => {
          if (child !== ring) {
            child.position.y = Math.max(0.5, child.position.y - dt * 26);
            child.rotation.y += dt * 8;
          }
        });
        const s = 1 + age * 2.6;
        ring.scale.set(s, s, 1);
        ringMat.opacity = Math.max(0, 1 - age / 0.55);
      },
    });
  }

  spawnMeteorStormEffect(centerPos, radius) {
    const group = new THREE.Group();

    // Large Ground Arcane Circle
    const circleGeo = new THREE.RingGeometry(radius * 0.82, radius, 40);
    circleGeo.rotateX(-Math.PI / 2);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xff4929,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.position.set(centerPos.x, 0.12, centerPos.z);
    group.add(circle);

    // 6 Falling Meteors
    const meteors = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6 + Math.random() * 0.4;
      const r = Math.random() * (radius * 0.7);
      const tx = centerPos.x + Math.cos(a) * r;
      const tz = centerPos.z + Math.sin(a) * r;

      const m = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.65, 0),
        new THREE.MeshBasicMaterial({ color: 0xff7722 })
      );
      m.position.set(tx - 3, 12 + i * 2.4, tz - 3);
      group.add(m);
      meteors.push({ mesh: m, tx, tz });
    }

    this.scene.add(group);
    this.effects.push({
      group,
      age: 0,
      duration: 0.95,
      update: (dt, age) => {
        circle.rotation.z += dt * 2.2;
        circleMat.opacity = Math.max(0, 1 - age / 0.95);
        meteors.forEach((m) => {
          m.mesh.position.y = Math.max(0.4, m.mesh.position.y - dt * 22);
          m.mesh.position.x += (m.tx - m.mesh.position.x) * dt * 4;
          m.mesh.position.z += (m.tz - m.mesh.position.z) * dt * 4;
          m.mesh.rotation.x += dt * 6;
          m.mesh.rotation.y += dt * 6;
        });
      },
    });
  }

  spawnLevelUpPillar(playerPos) {
    const group = new THREE.Group();
    group.position.copy(playerPos);

    const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 14, 24, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xffe46b,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 7;
    group.add(pillar);

    this.scene.add(group);
    this.effects.push({
      group,
      age: 0,
      duration: 1.4,
      update: (dt, age) => {
        pillar.rotation.y += dt * 3;
        const scale = 1 + age * 0.7;
        pillar.scale.set(scale, 1, scale);
        pillarMat.opacity = Math.max(0, 0.65 * (1 - age / 1.4));
      },
    });
  }

  update(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.age += dt;
      fx.update(dt, fx.age);
      if (fx.age >= fx.duration) {
        this.scene.remove(fx.group);
        this.effects.splice(i, 1);
      }
    }
  }
}
