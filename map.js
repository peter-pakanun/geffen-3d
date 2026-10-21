import * as THREE from 'three';

export const DUNGEON_CENTER = new THREE.Vector3(320, 0, 320);

// Create procedural canvas textures so everything looks crisp with zero external asset dependencies
function createCobbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8b93a6';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 16;
  const w = 512 / cols;
  const h = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (r % 2) * (w * 0.5);
      const x = ((c * w + offsetX) % 512);
      const y = r * h;
      const shade = 135 + Math.floor(Math.random() * 35);
      ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 18})`;
      ctx.strokeStyle = '#5e6678';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 5);
      ctx.fill();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(18, 18);
  return tex;
}

function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#4f9e4d';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#5cb356' : '#428a40';
    ctx.fillRect(x, y, 3, 6);
  }
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = ['#fff48f', '#ff9ec6', '#a8d8ff'][i % 3];
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  return tex;
}

function createMagicCircleTexture(primaryColor = '#66b3ff', bgGlow = 'rgba(60, 130, 255, 0.16)') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 240);
  grad.addColorStop(0, bgGlow);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;

  [235, 220, 165, 110, 55].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Octagram star inside the magic circle
  for (let offset = 0; offset < 2; offset++) {
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const a = (i * Math.PI) / 2 + (offset * Math.PI) / 4;
      const x = cx + Math.cos(a) * 218;
      const y = cy + Math.sin(a) * 218;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Runic ticks around outer ring
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 220, cy + Math.sin(a) * 220);
    ctx.lineTo(cx + Math.cos(a) * 235, cy + Math.sin(a) * 235);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createBuildingFacadeTexture(wallColor = '#f2ead8', timberColor = '#4a3525') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 256, 256);

  // Half-timbered framing
  ctx.fillStyle = timberColor;
  ctx.fillRect(0, 0, 256, 12);
  ctx.fillRect(0, 122, 256, 10);
  ctx.fillRect(0, 244, 256, 12);
  for (let x = 0; x <= 256; x += 64) {
    ctx.fillRect(x - 5, 0, 10, 256);
  }

  // Diagonal braces
  ctx.strokeStyle = timberColor;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 122);
  ctx.lineTo(64, 12);
  ctx.moveTo(192, 12);
  ctx.lineTo(256, 122);
  ctx.stroke();

  // Warm illuminated windows
  const winColors = ['#ffe58f', '#ffd269', '#99d6ff'];
  for (let row = 0; row < 2; row++) {
    for (let col = 1; col <= 2; col++) {
      const wx = col * 64 + 14;
      const wy = row * 124 + 28;
      ctx.fillStyle = winColors[(row + col) % winColors.length];
      ctx.fillRect(wx, wy, 36, 54);
      ctx.strokeStyle = timberColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, 36, 54);
      // Window muntins
      ctx.beginPath();
      ctx.moveTo(wx + 18, wy);
      ctx.lineTo(wx + 18, wy + 54);
      ctx.moveTo(wx, wy + 27);
      ctx.lineTo(wx + 36, wy + 27);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class GeffenMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // { x, z, r } circular obstacles for smooth sliding collision
    this.portals = [];   // { x, z, r, targetPos, targetZone, label }
    this.lanternLights = [];
    this.animatedObjects = [];
    this.waterMesh = null;

    this.cobbleTex = createCobbleTexture();
    this.grassTex = createGrassTexture();
    this.magicCircleTex = createMagicCircleTexture('#6ec6ff', 'rgba(70, 150, 255, 0.22)');
    this.dungeonCircleTex = createMagicCircleTexture('#c678ff', 'rgba(165, 70, 255, 0.24)');

    this.buildWorld();
  }

  buildWorld() {
    this.buildTerrainAndMoat();
    this.buildCentralGeffenTower();
    this.buildFourCardinalBridges();
    this.buildOuterRingDistricts();
    this.buildFourTownGates();
    this.buildGeffenOutskirts();
    this.buildGeffenDungeonB1();
  }

  buildTerrainAndMoat() {
    // 1. Outer Field Grass Ground (extends across entire world)
    const fieldGeo = new THREE.CircleGeometry(155, 64);
    fieldGeo.rotateX(-Math.PI / 2);
    const fieldMat = new THREE.MeshStandardMaterial({
      map: this.grassTex,
      roughness: 0.9,
      metalness: 0.05,
    });
    const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
    fieldMesh.position.y = -0.05;
    fieldMesh.receiveShadow = true;
    fieldMesh.name = 'ground';
    this.scene.add(fieldMesh);

    // 2. Outer Ring Cobblestone Town Plaza (r = 31.5 to 70)
    const outerRingGeo = new THREE.RingGeometry(31.5, 70, 64);
    outerRingGeo.rotateX(-Math.PI / 2);
    const cobbleMat = new THREE.MeshStandardMaterial({
      map: this.cobbleTex,
      roughness: 0.8,
      metalness: 0.08,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, cobbleMat);
    outerRing.position.y = 0.02;
    outerRing.receiveShadow = true;
    outerRing.name = 'ground';
    this.scene.add(outerRing);

    // Decorative circular inner boulevard curb & outer town wall base
    const innerCurbGeo = new THREE.TorusGeometry(31.8, 0.45, 12, 64);
    innerCurbGeo.rotateX(Math.PI / 2);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xbec7d9, roughness: 0.7 });
    const innerCurb = new THREE.Mesh(innerCurbGeo, stoneMat);
    innerCurb.position.y = 0.2;
    this.scene.add(innerCurb);

    // 3. The Sunken Circular Moat around Geffen Tower (r = 20.5 to 31.8)
    const moatBedGeo = new THREE.RingGeometry(19.5, 32.2, 64);
    moatBedGeo.rotateX(-Math.PI / 2);
    const moatBedMat = new THREE.MeshStandardMaterial({ color: 0x162b4d, roughness: 0.9 });
    const moatBed = new THREE.Mesh(moatBedGeo, moatBedMat);
    moatBed.position.y = -1.2;
    this.scene.add(moatBed);

    const waterGeo = new THREE.RingGeometry(20.2, 31.8, 64);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2d8cf0,
      emissive: 0x0d3c73,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.86,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = -0.38;
    this.scene.add(this.waterMesh);

    // 4. Central Island Platform (r = 21) where Geffen Tower stands
    const centerIslandGeo = new THREE.CylinderGeometry(21, 21.6, 0.9, 48);
    const centerIsland = new THREE.Mesh(centerIslandGeo, cobbleMat);
    centerIsland.position.y = -0.35;
    centerIsland.receiveShadow = true;
    centerIsland.name = 'ground';
    this.scene.add(centerIsland);

    const islandRimGeo = new THREE.TorusGeometry(21, 0.45, 12, 64);
    islandRimGeo.rotateX(Math.PI / 2);
    const islandRim = new THREE.Mesh(islandRimGeo, stoneMat);
    islandRim.position.y = 0.18;
    this.scene.add(islandRim);

    // Glowing Arcane Magic Circle decal on the Central Plaza
    const runeGeo = new THREE.CircleGeometry(19.2, 64);
    runeGeo.rotateX(-Math.PI / 2);
    const runeMat = new THREE.MeshBasicMaterial({
      map: this.magicCircleTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.position.y = 0.12;
    this.scene.add(runeMesh);
    this.animatedObjects.push({
      mesh: runeMesh,
      update: (t) => {
        runeMesh.rotation.z = t * 0.08;
      },
    });
  }

  buildCentralGeffenTower() {
    const towerGroup = new THREE.Group();

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xdbe3f2,
      roughness: 0.55,
      metalness: 0.12,
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x627399,
      roughness: 0.65,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2c4b9e,
      roughness: 0.45,
      metalness: 0.2,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd24c,
      emissive: 0x996b00,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.8,
    });
    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: 0x8CE8FF,
      emissive: 0x38b6ff,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    // Stepped octagonal foundation
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.4, 1.4, 12), darkStoneMat);
    step1.position.y = 0.7;
    step1.castShadow = true;
    step1.receiveShadow = true;
    towerGroup.add(step1);

    // Lower Tier Base
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(7.8, 9.2, 12, 12), marbleMat);
    tier1.position.y = 7.2;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    towerGroup.add(tier1);

    // 8 Flying Buttresses / Pillars around the base
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + Math.PI / 8;
      const bx = Math.cos(angle) * 8.8;
      const bz = Math.sin(angle) * 8.8;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 13, 2.2), darkStoneMat);
      pillar.position.set(bx, 6.8, bz);
      pillar.rotation.y = -angle + Math.PI / 2;
      pillar.castShadow = true;
      towerGroup.add(pillar);

      // Spirelet on each buttress
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.2, 6), roofMat);
      cap.position.set(bx, 14.8, bz);
      towerGroup.add(cap);
    }

    // Mid-Tier Gallery Skirt Roof
    const midRoof = new THREE.Mesh(new THREE.ConeGeometry(10.2, 4.2, 12, 1, true), roofMat);
    midRoof.position.y = 14.5;
    towerGroup.add(midRoof);

    // Mid-Tier Shaft
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 6.8, 15, 12), marbleMat);
    tier2.position.y = 22.5;
    tier2.castShadow = true;
    towerGroup.add(tier2);

    // Tall glowing stained-glass lancet windows around Tier 2
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const wx = Math.cos(angle) * 6.35;
      const wz = Math.sin(angle) * 6.35;
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.3, 7.5, 0.4), windowGlowMat);
      win.position.set(wx, 22.5, wz);
      win.rotation.y = -angle + Math.PI / 2;
      towerGroup.add(win);
    }

    // Upper Observatory Balcony & Collar
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 6.4, 1.8, 12), darkStoneMat);
    balcony.position.y = 30.5;
    towerGroup.add(balcony);

    // Upper Spire Shaft
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.4, 11, 12), marbleMat);
    tier3.position.y = 36.5;
    tier3.castShadow = true;
    towerGroup.add(tier3);

    // High Conical Wizard Spire Roof
    const topRoof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 13.5, 12), roofMat);
    topRoof.position.y = 48.5;
    topRoof.castShadow = true;
    towerGroup.add(topRoof);

    // Golden Finial & Levitating Mana Crystal at Peak
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(1.7, 0), goldMat);
    finial.position.y = 56.8;
    towerGroup.add(finial);

    // Rotating Levitating Arcane Rings around Geffen Tower
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(9.6, 0.22, 12, 48),
      goldMat
    );
    ring1.position.y = 23;
    ring1.rotation.x = Math.PI / 2.2;
    towerGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(7.6, 0.18, 12, 48),
      windowGlowMat
    );
    ring2.position.y = 35;
    ring2.rotation.x = -Math.PI / 2.3;
    towerGroup.add(ring2);

    this.animatedObjects.push({
      mesh: towerGroup,
      update: (t) => {
        ring1.rotation.z = t * 0.45;
        ring1.rotation.x = Math.PI / 2 + Math.sin(t * 0.7) * 0.18;
        ring2.rotation.z = -t * 0.6;
        ring2.rotation.y = Math.cos(t * 0.5) * 0.22;
        finial.rotation.y = t * 1.2;
        finial.position.y = 56.8 + Math.sin(t * 2) * 0.4;
      },
    });

    // South Portal Entrance into Geffen Tower Dungeon B1
    this.createWarpPortal(
      0,
      11.5,
      0x4dc3ff,
      new THREE.Vector3(DUNGEON_CENTER.x, 0, DUNGEON_CENTER.z + 18),
      'Geffen Tower Dungeon B1',
      'dungeon'
    );

    this.scene.add(towerGroup);
    // Central Tower Collider
    this.colliders.push({ x: 0, z: 0, r: 9.6 });
  }

  buildFourCardinalBridges() {
    const bridgeDirs = [
      { name: 'North Bridge', x: 0, z: -26.2, rotY: 0 },
      { name: 'South Bridge', x: 0, z: 26.2, rotY: 0 },
      { name: 'East Bridge', x: 26.2, z: 0, rotY: Math.PI / 2 },
      { name: 'West Bridge', x: -26.2, z: 0, rotY: Math.PI / 2 },
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd3e3, roughness: 0.65 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8e9bb5, roughness: 0.6 });

    bridgeDirs.forEach((b) => {
      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);
      group.rotation.y = b.rotY;

      // Bridge Deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.6, 13.2), stoneMat);
      deck.position.y = 0.05;
      deck.receiveShadow = true;
      deck.name = 'ground';
      group.add(deck);

      // Left & Right Stone Parapets / Balustrades
      [-3.3, 3.3].forEach((sideX) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 13.0), railMat);
        rail.position.set(sideX, 0.75, 0);
        rail.castShadow = true;
        group.add(rail);

        // End pillars with lanterns
        [-5.8, 5.8].forEach((endZ) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.95), stoneMat);
          post.position.set(sideX, 1.1, endZ);
          post.castShadow = true;
          group.add(post);

          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xffe484 })
          );
          orb.position.set(sideX, 2.35, endZ);
          group.add(orb);
        });
      });

      this.scene.add(group);
    });
  }

  buildOuterRingDistricts() {
    // Place stylized Geffen houses, Magic Academy, Blacksmith, Shops around the circular ring (r = 52..61)
    const buildings = [
      // NW: Geffen Magic Academy & Mage Guild
      { angle: Math.PI * 1.25, r: 54, w: 13, h: 11, d: 9, roofColor: 0x2d4ea3, wallColor: '#e8eefc', dome: true, label: 'Magic Academy' },
      { angle: Math.PI * 1.14, r: 55, w: 9, h: 8.5, d: 8, roofColor: 0x3b5eb8, wallColor: '#f0ebdc' },
      { angle: Math.PI * 1.36, r: 55, w: 9, h: 9, d: 8, roofColor: 0x4b3b9e, wallColor: '#efe8f8' },

      // NE: Weapon & Armor Shop + Geffen Inn
      { angle: Math.PI * 1.75, r: 54, w: 11, h: 9.5, d: 8.5, roofColor: 0x9e3b3b, wallColor: '#f5ebd6' },
      { angle: Math.PI * 1.64, r: 55, w: 8.5, h: 8, d: 7.5, roofColor: 0x8a4236, wallColor: '#f2e6cf' },
      { angle: Math.PI * 1.86, r: 55, w: 9, h: 8.5, d: 8, roofColor: 0x2d6b5f, wallColor: '#eef5f0' },

      // SE: Geffen Blacksmith & Forge
      { angle: Math.PI * 0.25, r: 54, w: 11, h: 9, d: 8.5, roofColor: 0x7d3629, wallColor: '#e3dcd2', forge: true },
      { angle: Math.PI * 0.14, r: 55, w: 8.5, h: 8, d: 7.5, roofColor: 0x5c4738, wallColor: '#ede4d5' },
      { angle: Math.PI * 0.36, r: 55, w: 9, h: 8.5, d: 7.5, roofColor: 0x8c3f2b, wallColor: '#f2e8dc' },

      // SW: Alchemist Potion Shop & Tavern
      { angle: Math.PI * 0.75, r: 54, w: 11, h: 9, d: 8.5, roofColor: 0x2f7556, wallColor: '#ebf5ed' },
      { angle: Math.PI * 0.64, r: 55, w: 8.5, h: 8.5, d: 7.5, roofColor: 0x3c5291, wallColor: '#f2ecdf' },
      { angle: Math.PI * 0.86, r: 55, w: 9, h: 8, d: 7.5, roofColor: 0x6e3b8a, wallColor: '#f3ebf7' },
    ];

    buildings.forEach((b) => {
      const bx = Math.cos(b.angle) * b.r;
      const bz = Math.sin(b.angle) * b.r;
      const group = new THREE.Group();
      group.position.set(bx, 0, bz);
      // Face toward the center of Geffen
      group.rotation.y = -b.angle - Math.PI / 2;

      const facadeTex = createBuildingFacadeTexture(b.wallColor, '#4a3525');
      const wallMat = new THREE.MeshStandardMaterial({
        map: facadeTex,
        roughness: 0.75,
      });
      const roofMat = new THREE.MeshStandardMaterial({
        color: b.roofColor,
        roughness: 0.55,
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Pitched Roof (4-sided pyramid/hip roof)
      const roofRadius = Math.hypot(b.w, b.d) * 0.56;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(roofRadius, b.h * 0.65, 4), roofMat);
      roof.position.y = b.h + (b.h * 0.65) / 2 - 0.2;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      if (b.dome) {
        // Magic Academy Observatory Dome & Floating Crystal
        const dome = new THREE.Mesh(
          new THREE.SphereGeometry(3.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x4c78db, metalness: 0.4, roughness: 0.3 })
        );
        dome.position.set(0, b.h + 2.8, 0);
        group.add(dome);
      }

      if (b.forge) {
        // Glowing Blacksmith Brazier in front of SE Forge
        const brazier = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 0.8, 1.3, 8),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        brazier.position.set(3.2, 0.65, 5.4);
        group.add(brazier);

        const fire = new THREE.Mesh(
          new THREE.ConeGeometry(0.85, 1.6, 8),
          new THREE.MeshBasicMaterial({ color: 0xff6a00 })
        );
        fire.position.set(3.2, 1.8, 5.4);
        group.add(fire);
      }

      this.scene.add(group);
      this.colliders.push({ x: bx, z: bz, r: Math.max(b.w, b.d) * 0.54 });
    });

    // Place Streetlamps & Trees along the Outer Circular Boulevard (r = 36 and r = 46)
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16 + Math.PI / 16;
      const lx = Math.cos(a) * 35.2;
      const lz = Math.sin(a) * 35.2;
      this.createStreetLamp(lx, lz, i % 4 === 0);

      // Decorative Town Trees between buildings
      if (i % 2 === 1) {
        const tx = Math.cos(a) * 45.5;
        const tz = Math.sin(a) * 45.5;
        this.createTree(tx, tz, 0.85, 0x3b8c52);
      }
    }
  }

  buildFourTownGates() {
    const gates = [
      { x: 0, z: -69, rotY: 0 },
      { x: 0, z: 69, rotY: 0 },
      { x: 69, z: 0, rotY: Math.PI / 2 },
      { x: -69, z: 0, rotY: Math.PI / 2 },
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xc2cce0, roughness: 0.6 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f4fa3, roughness: 0.5 });

    gates.forEach((g) => {
      const group = new THREE.Group();
      group.position.set(g.x, 0, g.z);
      group.rotation.y = g.rotY;

      // Left & Right Gate Towers
      [-6.2, 6.2].forEach((sideX) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 9.5, 10), stoneMat);
        col.position.set(sideX, 4.75, 0);
        col.castShadow = true;
        group.add(col);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(2.7, 3.8, 10), roofMat);
        cap.position.set(sideX, 11.2, 0);
        group.add(cap);

        // Colliders for gate pillars
        const worldPillar = new THREE.Vector3(sideX, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotY);
        this.colliders.push({ x: g.x + worldPillar.x, z: g.z + worldPillar.z, r: 2.3 });
      });

      // Archway Beam overhead
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(14.5, 1.8, 2.6), stoneMat);
      lintel.position.set(0, 8.8, 0);
      lintel.castShadow = true;
      group.add(lintel);

      this.scene.add(group);
    });
  }

  buildGeffenOutskirts() {
    // Scatter lush trees, rocks, ruins, and glowing mushrooms in the field ring (r = 76..136)
    const rng = (seed) => {
      const x = Math.sin(seed * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 68; i++) {
      const angle = rng(i + 1) * Math.PI * 2;
      // Leave clear paths directly outside the 4 cardinal gates
      const gateDist = Math.min(
        Math.abs(Math.sin(angle)),
        Math.abs(Math.cos(angle))
      );
      if (gateDist < 0.12) continue;

      const r = 78 + rng(i + 100) * 56;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const scale = 0.85 + rng(i + 200) * 0.65;
      const color = i % 5 === 0 ? 0x529e49 : 0x3b8542;
      this.createTree(x, z, scale, color);
      this.colliders.push({ x, z, r: 1.4 * scale });
    }

    // Ancient Arcane Ruins in the North Field (0, -108)
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const rx = Math.cos(a) * 10 + 18;
      const rz = Math.sin(a) * 10 - 102;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.1, 5.5 + (i % 2) * 2, 8),
        new THREE.MeshStandardMaterial({ color: 0x9aa6bd, roughness: 0.8 })
      );
      pillar.position.set(rx, 2.75, rz);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.colliders.push({ x: rx, z: rz, r: 1.2 });
    }
  }

  buildGeffenDungeonB1() {
    // Subterranean Arcane Dungeon Chamber located at DUNGEON_CENTER (320, 0, 320)
    const cx = DUNGEON_CENTER.x;
    const cz = DUNGEON_CENTER.z;

    const floorGeo = new THREE.CircleGeometry(48, 48);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1c1630,
      roughness: 0.75,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    floor.name = 'ground';
    this.scene.add(floor);

    // Glowing Violet Arcane Circle on Dungeon Floor
    const runeGeo = new THREE.CircleGeometry(24, 48);
    runeGeo.rotateX(-Math.PI / 2);
    const runeMat = new THREE.MeshBasicMaterial({
      map: this.dungeonCircleTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(cx, 0.08, cz);
    this.scene.add(rune);

    // 12 Gothic Pillars & Glowing Violet Mana Crystals around the chamber
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2d2447, roughness: 0.7 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xc76bff,
      emissive: 0x9b30ff,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      const px = cx + Math.cos(a) * 38;
      const pz = cz + Math.sin(a) * 38;

      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 14, 8), pillarMat);
      col.position.set(px, 7, pz);
      this.scene.add(col);

      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), crystalMat);
      crystal.position.set(cx + Math.cos(a) * 33, 2.2, cz + Math.sin(a) * 33);
      this.scene.add(crystal);
      this.colliders.push({ x: px, z: pz, r: 2.1 });
    }

    // Return Portal to Geffen Central Plaza
    this.createWarpPortal(
      cx,
      cz + 24,
      0xbd68ff,
      new THREE.Vector3(0, 0, 16),
      'Return to Geffen Plaza',
      'safe'
    );
  }

  createWarpPortal(x, z, colorHex, targetPos, label, targetZone) {
    const group = new THREE.Group();
    group.position.set(x, 0.1, z);

    const ringGeo = new THREE.TorusGeometry(2.1, 0.16, 12, 36);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    const innerGeo = new THREE.CylinderGeometry(1.9, 1.9, 3.2, 24, 1, true);
    const innerMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = 1.6;
    group.add(inner);

    this.scene.add(group);
    this.animatedObjects.push({
      mesh: group,
      update: (t) => {
        inner.scale.y = 0.9 + Math.sin(t * 3) * 0.12;
        ring.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
      },
    });

    this.portals.push({
      x,
      z,
      r: 2.3,
      targetPos,
      label,
      targetZone,
    });
  }

  createStreetLamp(x, z, withPointLight = false) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c354d, metalness: 0.6, roughness: 0.4 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 4.4, 8), poleMat);
    pole.position.y = 2.2;
    pole.castShadow = true;
    group.add(pole);

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe48f });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), bulbMat);
    bulb.position.y = 4.55;
    group.add(bulb);

    if (withPointLight) {
      const light = new THREE.PointLight(0xffcb6b, 0.8, 22);
      light.position.y = 4.6;
      group.add(light);
      this.lanternLights.push(light);
    }

    this.scene.add(group);
  }

  createTree(x, z, scale = 1, foliageColor = 0x3b8542) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, 2.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x69482d, roughness: 0.9 })
    );
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    group.add(trunk);

    const crownMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.78 });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.6, 9), crownMat);
    c1.position.y = 3.7;
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.75, 3.0, 9), crownMat);
    c2.position.y = 5.4;
    c2.castShadow = true;
    group.add(c2);

    this.scene.add(group);
  }

  // Check if a position (x, z) is walkable in Geffen (not inside the moat except on bridges, and not inside buildings)
  resolvePosition(oldPos, newPos) {
    const out = newPos.clone();

    // Check if in Dungeon area
    const distDungeon = Math.hypot(out.x - DUNGEON_CENTER.x, out.z - DUNGEON_CENTER.z);
    if (distDungeon < 90) {
      // Keep inside Dungeon circular chamber (r <= 44)
      if (distDungeon > 44) {
        const angle = Math.atan2(out.z - DUNGEON_CENTER.z, out.x - DUNGEON_CENTER.x);
        out.x = DUNGEON_CENTER.x + Math.cos(angle) * 44;
        out.z = DUNGEON_CENTER.z + Math.sin(angle) * 44;
      }
    } else {
      // Main Geffen Map: Keep within outer field radius (r <= 136)
      const r = Math.hypot(out.x, out.z);
      if (r > 136) {
        const a = Math.atan2(out.z, out.x);
        out.x = Math.cos(a) * 136;
        out.z = Math.sin(a) * 136;
      }

      // Moat check (r between 20.4 and 31.6 is water UNLESS on one of the 4 cardinal bridges!)
      const onVerticalBridge = Math.abs(out.x) < 3.1;
      const onHorizontalBridge = Math.abs(out.z) < 3.1;
      if (r > 20.4 && r < 31.6 && !onVerticalBridge && !onHorizontalBridge) {
        // Push back to whichever bank the player came from
        const oldR = Math.hypot(oldPos.x, oldPos.z);
        const targetR = oldR <= 26 ? 20.3 : 31.7;
        const a = Math.atan2(out.z, out.x);
        out.x = Math.cos(a) * targetR;
        out.z = Math.sin(a) * targetR;
      }
    }

    // Check building / pillar circular colliders
    for (const col of this.colliders) {
      const dx = out.x - col.x;
      const dz = out.z - col.z;
      const dist = Math.hypot(dx, dz);
      const minDist = col.r + 0.75;
      if (dist < minDist && dist > 0.0001) {
        out.x = col.x + (dx / dist) * minDist;
        out.z = col.z + (dz / dist) * minDist;
      }
    }

    return out;
  }

  getZoneAt(x, z) {
    const distDungeon = Math.hypot(x - DUNGEON_CENTER.x, z - DUNGEON_CENTER.z);
    if (distDungeon < 90) {
      return { id: 'dungeon', name: 'geffen_dun01.rsw', title: 'GEFFEN TOWER DUNGEON B1', badge: 'Dungeon Combat' };
    }
    const r = Math.hypot(x, z);
    if (r < 71) {
      return { id: 'safe', name: 'geffen.rsw', title: 'GEFFEN — CITY OF MAGIC', badge: 'Town Safe Zone' };
    }
    return { id: 'combat', name: 'gef_fild00.rsw', title: 'GEFFEN OUTSKIRTS FIELD', badge: 'Field Combat Zone' };
  }

  update(elapsedTime) {
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.38 + Math.sin(elapsedTime * 2.2) * 0.06;
    }
    for (const item of this.animatedObjects) {
      item.update(elapsedTime);
    }
  }
}
