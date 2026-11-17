import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const lbar = $('#lbar');
lbar.style.width = '40%';

/* ---------------- colourways ---------------- */
const CW = {
  forest:  { name:'Forest',  dial:['#2a7356','#0b2a1f'], idx:'#ece6d6', acc:'#d9b36c', strap:'#3b2416', bg:['#16503d','#04140f'] },
  graphite:{ name:'Graphite',dial:['#4a4e55','#141619'], idx:'#e8e8e8', acc:'#ff6a2b', strap:'#161616', bg:['#34373d','#0b0c0e'] },
  sand:    { name:'Sand',    dial:['#efe4cc','#c4ac83'], idx:'#2b2418', acc:'#a3401c', strap:'#6b4a2b', bg:['#e9dcc2','#bda57c'] },
  ember:   { name:'Ember',   dial:['#c4602f','#5a1d0a'], idx:'#f6e7c8', acc:'#f3d9a4', strap:'#2a1a12', bg:['#9a3b17','#1e0802'] },
};
let cw = 'forest';

/* ---------------- renderer ---------------- */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0, 8);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xffe2b8, 1.2); rim.position.set(-4, 2, -3); scene.add(rim);

/* ---------------- materials ---------------- */
const steel = new THREE.MeshStandardMaterial({ color:0xaeb3b9, metalness:1, roughness:0.3 });
const polished = new THREE.MeshStandardMaterial({ color:0xd5d9de, metalness:1, roughness:0.1 });
const dark = new THREE.MeshStandardMaterial({ color:0x1a1a1a, metalness:0.4, roughness:0.5 });
const gold = new THREE.MeshStandardMaterial({ color:0xe0b45c, metalness:1, roughness:0.25 });
const rhod = new THREE.MeshStandardMaterial({ color:0xc9ccd1, metalness:1, roughness:0.4 });
const ruby = new THREE.MeshPhysicalMaterial({ color:0xc0102a, roughness:0.05, metalness:0, clearcoat:1, emissive:0x3a0008 });
const glassM = new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0, roughness:0, transparent:true, opacity:0.14, clearcoat:1, clearcoatRoughness:0, depthWrite:false });
const strapM = new THREE.MeshStandardMaterial({ color:CW[cw].strap, roughness:0.82, metalness:0 });
const handM = new THREE.MeshStandardMaterial({ color:0xf2f2f2, metalness:1, roughness:0.18 });
const secM = new THREE.MeshStandardMaterial({ color:CW[cw].acc, metalness:0.3, roughness:0.35, emissive:CW[cw].acc, emissiveIntensity:0.15 });

/* ---------------- dial texture ---------------- */
const dialCanvas = document.createElement('canvas'); dialCanvas.width = dialCanvas.height = 1024;
const dialTex = new THREE.CanvasTexture(dialCanvas); dialTex.colorSpace = THREE.SRGBColorSpace; dialTex.anisotropy = 8;
function drawDial(c){
  const g = dialCanvas.getContext('2d'), S = 1024, C = S/2;
  g.clearRect(0,0,S,S);
  const rad = g.createRadialGradient(C*0.85, C*0.7, 40, C, C, C);
  rad.addColorStop(0, c.dial[0]); rad.addColorStop(1, c.dial[1]);
  g.fillStyle = rad; g.fillRect(0,0,S,S);
  // sunburst
  for(let i=0;i<720;i++){ const a = i/720*Math.PI*2; g.strokeStyle = `rgba(255,255,255,${0.025 + 0.03*Math.abs(Math.sin(a*2))})`; g.lineWidth = 1; g.beginPath(); g.moveTo(C,C); g.lineTo(C+Math.cos(a)*C, C+Math.sin(a)*C); g.stroke(); }
  const vg = g.createRadialGradient(C,C,C*0.6,C,C,C); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle = vg; g.fillRect(0,0,S,S);
  // minute track
  g.save(); g.translate(C,C);
  for(let i=0;i<60;i++){ g.save(); g.rotate(i/60*Math.PI*2); g.fillStyle = c.idx; g.globalAlpha = i%5 ? 0.6 : 1; g.fillRect(-1.5, -C+18, 3, i%5?18:26); g.restore(); }
  // applied indices
  for(let i=0;i<12;i++){
    if(i===3 || i===9) continue;
    g.save(); g.rotate(i/12*Math.PI*2);
    const w = i===0 ? 44 : 22, h = i===0 ? 104 : 88, y = -C+62;
    const lg = g.createLinearGradient(-w/2,0,w/2,0); lg.addColorStop(0,'#ffffff'); lg.addColorStop(0.5,c.idx); lg.addColorStop(1,'#8a8a8a');
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
    g.fillStyle = lg;
    if(i===0){ g.fillRect(-w/2-4,y,18,h); g.fillRect(w/2-14,y,18,h); } else g.fillRect(-w/2,y,w,h);
    g.shadowColor = 'transparent'; g.fillStyle = 'rgba(200,255,220,.9)'; g.fillRect(-5, y+10, 10, h-20);
    g.restore();
  }
  // subdials at 3 and 9
  for(const sx of [-1,1]){
    const x = sx*230;
    const sg = g.createRadialGradient(x,0,10,x,0,118); sg.addColorStop(0,'rgba(0,0,0,.18)'); sg.addColorStop(1,'rgba(0,0,0,.32)');
    g.fillStyle = sg; g.beginPath(); g.arc(x,0,118,0,Math.PI*2); g.fill();
    for(let r=20;r<116;r+=7){ g.strokeStyle='rgba(255,255,255,.05)'; g.lineWidth=2; g.beginPath(); g.arc(x,0,r,0,Math.PI*2); g.stroke(); }
    g.strokeStyle = c.idx; g.lineWidth = 3; g.beginPath(); g.arc(x,0,118,0,Math.PI*2); g.stroke();
    for(let i=0;i<30;i++){ const a=i/30*Math.PI*2; g.strokeStyle=c.idx; g.lineWidth=i%5?2:4; g.beginPath(); g.moveTo(x+Math.cos(a)*104,Math.sin(a)*104); g.lineTo(x+Math.cos(a)*(i%5?94:86),Math.sin(a)*(i%5?94:86)); g.stroke(); }
    g.save(); g.translate(x,0); g.rotate(sx>0?0.8:-2.2); g.fillStyle = sx>0 ? c.acc : c.idx; g.fillRect(-3,-92,6,104); g.beginPath(); g.arc(0,0,9,0,Math.PI*2); g.fill(); g.restore();
  }
  // text
  g.fillStyle = c.idx; g.textAlign = 'center';
  g.font = '700 54px Unbounded, sans-serif'; g.fillText('KOVA', 0, -205);
  g.font = '500 22px Manrope, sans-serif'; g.globalAlpha = 0.85; g.fillText('M E R I D I A N', 0, -168);
  g.font = '600 20px Manrope, sans-serif'; g.fillStyle = c.acc; g.globalAlpha = 1; g.fillText('CHRONOGRAPH · AUTOMATIC', 0, 200);
  g.fillStyle = c.idx; g.globalAlpha = 0.6; g.font = '500 16px Manrope'; g.fillText('VILNIUS', 0, 232);
  g.restore();
  dialTex.needsUpdate = true;
}

/* ---------------- watch model ---------------- */
const watch = new THREE.Group(); scene.add(watch);
const parts = {}; // groups that move in the exploded view
const P = (name, z) => { const g = new THREE.Group(); g.userData.z = z; watch.add(g); parts[name] = g; return g; };
const lathe = (pts, mat, seg=128) => { const geo = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); geo.rotateX(Math.PI/2); return new THREE.Mesh(geo, mat); };

// case
const caseG = P('case', 0);
caseG.add(lathe([[0.79,-0.24],[0.95,-0.24],[1.01,-0.18],[1.035,-0.02],[1.02,0.12],[0.99,0.17],[0.8,0.17]], steel));
const chamfer = lathe([[0.99,0.17],[1.02,0.12],[1.035,0.11]], polished); caseG.add(chamfer);
// lugs: curved horns that slope down toward the wrist
{ const sh = new THREE.Shape();
  sh.moveTo(0.72,-0.24); sh.lineTo(0.72,0.13); sh.quadraticCurveTo(1.02,0.13,1.2,-0.05); sh.quadraticCurveTo(1.25,-0.13,1.2,-0.2); sh.quadraticCurveTo(1.05,-0.27,0.85,-0.26); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth:0.15, bevelEnabled:true, bevelThickness:0.025, bevelSize:0.025, bevelSegments:4, curveSegments:24 });
  geo.applyMatrix4(new THREE.Matrix4().set(0,0,1,0, 1,0,0,0, 0,1,0,0, 0,0,0,1));
  for(const sx of [-1,1]) for(const sy of [-1,1]){ const lug = new THREE.Mesh(geo, steel); lug.position.x = sx > 0 ? 0.5 : -0.65; lug.scale.y = sy; caseG.add(lug); } }
// crown + pushers
const crownG = P('crown', 0);
const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 48), polished); crown.rotation.z = Math.PI/2; crown.position.set(1.13,0,-0.03); crownG.add(crown);
for(let i=0;i<28;i++){ const a=i/28*Math.PI*2; const r = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.018,0.018), steel); r.position.set(1.13, Math.cos(a)*0.132, -0.03+Math.sin(a)*0.132); r.rotation.x = a; crownG.add(r); }
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.12,24), steel); stem.rotation.z = Math.PI/2; stem.position.set(1.02,0,-0.03); crownG.add(stem);
for(const a of [0.75,-0.75]){ const p = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.2,32), polished); p.rotation.z = Math.PI/2 - a*0; p.position.set(Math.cos(a)*1.08, Math.sin(a)*1.08, -0.03); p.rotation.z = Math.PI/2 + a; crownG.add(p); }
// bezel
const bezelG = P('bezel', 0.95);
bezelG.add(lathe([[0.8,0.17],[0.985,0.17],[0.985,0.21],[0.94,0.27],[0.83,0.275],[0.8,0.25]], polished));
for(let i=0;i<60;i++){ const a=i/60*Math.PI*2; const t = new THREE.Mesh(new THREE.BoxGeometry(i%5?0.012:0.022, i%5?0.05:0.08, 0.01), dark); t.position.set(Math.sin(a)*0.9, Math.cos(a)*0.9, 0.245); t.rotation.z = -a; t.rotation.x = -0.5*Math.cos(0); bezelG.add(t); }
// glass
const glassG = P('glass', 1.25);
const glass = new THREE.Mesh(new THREE.SphereGeometry(2.2, 64, 16, 0, Math.PI*2, 0, Math.asin(0.84/2.2)), glassM); glass.rotation.x = Math.PI/2; glass.position.z = 0.27 - 2.2*Math.cos(Math.asin(0.84/2.2)); glassG.add(glass);
// dial
const dialG = P('dial', 0.4);
const dial = new THREE.Mesh(new THREE.CircleGeometry(0.8, 96), new THREE.MeshStandardMaterial({ map:dialTex, metalness:0.35, roughness:0.38 }));
dial.position.z = 0.1; dialG.add(dial);
const rehaut = lathe([[0.8,0.1],[0.8,0.16],[0.83,0.17]], new THREE.MeshStandardMaterial({ color:0x111111, metalness:0.6, roughness:0.4 })); dialG.add(rehaut);
// hands
const handsG = P('hands', 0.7);
function handGeo(len, w, tail){ const s = new THREE.Shape(); s.moveTo(-w*0.35, -tail); s.lineTo(w*0.35, -tail); s.lineTo(w/2, len*0.15); s.lineTo(0, len); s.lineTo(-w/2, len*0.15); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth:0.012, bevelEnabled:true, bevelThickness:0.006, bevelSize:0.004, bevelSegments:2 }); return g; }
const hourH = new THREE.Mesh(handGeo(0.42, 0.075, 0.08), handM); hourH.position.z = 0.115;
const minH = new THREE.Mesh(handGeo(0.66, 0.06, 0.1), handM); minH.position.z = 0.135;
const secGeo = new THREE.BoxGeometry(0.012, 0.86, 0.008); secGeo.translate(0, 0.28, 0);
const secH = new THREE.Mesh(secGeo, secM); secH.position.z = 0.158;
const secTail = new THREE.Mesh(new THREE.CircleGeometry(0.035, 32), secM); secTail.position.set(0,-0.12,0.004); secH.add(secTail);
const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.03,24), polished); cap.rotation.x = Math.PI/2; cap.position.z = 0.168;
handsG.add(hourH, minH, secH, cap);
// movement
const moveG = P('movement', -0.55);
const perl = document.createElement('canvas'); perl.width = perl.height = 512; { const g = perl.getContext('2d'); g.fillStyle='#bfc3c8'; g.fillRect(0,0,512,512); for(let y=0;y<540;y+=26) for(let x=(y/26%2)*13;x<540;x+=26){ const r=g.createRadialGradient(x,y,1,x,y,18); r.addColorStop(0,'#eef0f3'); r.addColorStop(.6,'#c4c8cd'); r.addColorStop(1,'#9fa4aa'); g.fillStyle=r; g.beginPath(); g.arc(x,y,18,0,7); g.fill(); } }
const perlTex = new THREE.CanvasTexture(perl); perlTex.colorSpace = THREE.SRGBColorSpace;
const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.78,0.06,96), new THREE.MeshStandardMaterial({ map:perlTex, metalness:0.9, roughness:0.35 })); plate.rotation.x = Math.PI/2; plate.position.z = -0.1; moveG.add(plate);
const gearsG = P('gears', -0.95);
function gear(r, teeth, mat){ const s = new THREE.Shape(); const n = teeth*4; for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2, rr = (i%4<2) ? r : r*0.9; i ? s.lineTo(Math.cos(a)*rr, Math.sin(a)*rr) : s.moveTo(Math.cos(a)*rr, Math.sin(a)*rr); }
  for(let k=0;k<5;k++){ const h = new THREE.Path(); const a0=k/5*Math.PI*2+0.25, a1=a0+Math.PI*2/5-0.5; h.absarc(0,0,r*0.75,a0,a1,false); h.absarc(0,0,r*0.3,a1,a0,true); s.holes.push(h); }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:0.025, bevelEnabled:false, curveSegments:6 }), mat); const j = new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12), ruby); j.position.z = -0.01; m.add(j); return m; }
const gearList = [[0.34,40,-0.25,0.22,0.6],[0.2,24,0.33,0.18,-1.0],[0.15,18,0.12,-0.36,1.4],[0.24,30,-0.3,-0.3,-0.8],[0.11,14,0.45,-0.22,2]];
const gears = gearList.map(([r,t,x,y,sp],i) => { const g = gear(r,t, i%2?gold:rhod); g.position.set(x,y,-0.16); g.userData.sp = sp; gearsG.add(g); return g; });
for(const [x,y] of [[0.55,0.3],[-0.55,0.05],[0.05,0.6],[-0.1,-0.6]]){ const j = new THREE.Mesh(new THREE.SphereGeometry(0.03,12,10), ruby); j.position.set(x,y,-0.14); gearsG.add(j); }
const rotorG = P('rotor', -1.3);
{ const s = new THREE.Shape(); s.absarc(0,0,0.74,0,Math.PI,false); s.absarc(0,0,0.16,Math.PI,0,true);
  const rotor = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:0.03, bevelEnabled:true, bevelThickness:0.008, bevelSize:0.008, bevelSegments:2, curveSegments:48 }), gold);
  rotor.position.z = -0.21; rotorG.add(rotor); rotorG.userData.rotor = rotor;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.06,32), polished); hub.rotation.x = Math.PI/2; hub.position.z = -0.2; rotorG.add(hub); }
// caseback with sapphire window
const backG = P('caseback', -1.75);
backG.add(lathe([[0.55,-0.24],[0.9,-0.24],[0.9,-0.27],[0.84,-0.31],[0.6,-0.31],[0.55,-0.29]], steel));
const ring = lathe([[0.55,-0.29],[0.6,-0.31]], polished); backG.add(ring);
const bglass = new THREE.Mesh(new THREE.CircleGeometry(0.56, 64), glassM); bglass.position.z = -0.3; bglass.rotation.y = Math.PI; backG.add(bglass);
// straps
const strapG = P('strap', 0);
// leather texture: grain, painted edges, saddle stitching
const lc = document.createElement('canvas'); lc.width = 256; lc.height = 1024;
{ const g = lc.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0,0,256,1024);
  for(let i=0;i<9000;i++){ const v = 200 + Math.random()*55; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(Math.random()*256, Math.random()*1024, 1.5, 1.5); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0,0,10,1024); g.fillRect(246,0,10,1024);
  g.strokeStyle = 'rgba(255,248,235,.95)'; g.lineWidth = 4; g.lineCap = 'round';
  for(const x of [24, 232]) for(let y=6;y<1024;y+=22){ g.beginPath(); g.moveTo(x, y); g.lineTo(x+1, y+12); g.stroke(); } }
const leatherTex = new THREE.CanvasTexture(lc); leatherTex.colorSpace = THREE.SRGBColorSpace; leatherTex.wrapT = THREE.RepeatWrapping; leatherTex.anisotropy = 8;
strapM.map = leatherTex; strapM.roughness = 0.7;
const edgeM = new THREE.MeshStandardMaterial({ color:0x1b120c, roughness:0.6 });
function strap(sign){
  const pts = [[0,1.1,-0.1],[0,1.3,-0.3],[0,1.42,-0.7],[0,1.38,-1.12],[0,1.18,-1.5],[0,0.92,-1.72]].map(p => new THREE.Vector3(p[0], p[1]*sign, p[2]));
  const curve = new THREE.CatmullRomCurve3(pts);
  const N = 90, len = curve.getLength(), t = 0.05;
  const top = [], bot = [], uvs = [], idx = [], side = [], sidx = [];
  for(let i=0;i<=N;i++){
    const u = i/N, P = curve.getPointAt(u), T = curve.getTangentAt(u);
    const nrm = new THREE.Vector3(0, -T.z, T.y).normalize().multiplyScalar(sign); // points away from the wrist
    const w = 0.49 - 0.07*u;
    for(const [arr, off] of [[top, t], [bot, -t]]){
      const c = P.clone().addScaledVector(nrm, off);
      arr.push(-w, c.y, c.z, w, c.y, c.z);
    }
    uvs.push(0, u*len*1.6, 1, u*len*1.6);
  }
  const mk = (arr, flip) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const ix = []; for(let i=0;i<N;i++){ const a=i*2, b=a+1, c=a+2, d=a+3; (flip ^ (sign<0)) ? ix.push(a,c,b, b,c,d) : ix.push(a,b,c, b,d,c); } g.setIndex(ix); g.computeVertexNormals(); return g; };
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(mk(top, false), strapM), new THREE.Mesh(mk(bot, true), strapM));
  // painted edges
  for(const sx of [0, 1]){ const arr = []; for(let i=0;i<=N;i++){ const k = i*6 + sx*3; arr.push(top[k], top[k+1], top[k+2], bot[k], bot[k+1], bot[k+2]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const ix = []; for(let i=0;i<N;i++){ const a=i*2; ix.push(a,a+1,a+2, a+1,a+3,a+2); } g.setIndex(ix); g.computeVertexNormals();
    grp.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color:0x1b120c, roughness:0.6, side:THREE.DoubleSide }))); }
  // keeper loop on one side
  if(sign < 0){ const kp = new THREE.Mesh(new RoundedBox(1.04, 0.12, 0.16), strapM); const P = curve.getPointAt(0.35); kp.position.copy(P); kp.lookAt(P.clone().add(curve.getTangentAt(0.35))); kp.rotateX(Math.PI/2); grp.add(kp); }
  return grp;
}
function RoundedBox(w,h,d){ return new THREE.BoxGeometry(w,h,d); }
const s1 = strap(1), s2 = strap(-1); strapG.add(s1, s2);
// spring bars
for(const sy of [-1,1]){ const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.0,16), steel); b.rotation.z = Math.PI/2; b.position.set(0, sy*1.1, -0.1); strapG.add(b); }

function applyCW(name){
  cw = name; const c = CW[name];
  drawDial(c); strapM.color.set(c.strap); secM.color.set(c.acc); secM.emissive.set(c.acc);
  handM.color.set(name === 'sand' ? 0x2b2b2b : 0xf2f2f2);
  document.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.cw === name));
  KS[2].bg = c.bg;
}

/* ---------------- swatches ---------------- */
$('#swatches').innerHTML = Object.entries(CW).map(([k,c]) => `<button class="sw" data-cw="${k}"><i style="background:radial-gradient(circle at 35% 30%,${c.dial[0]},${c.dial[1]})"></i>${c.name}</button>`).join('');
$('#swatches').addEventListener('click', e => { const b = e.target.closest('.sw'); if(b) applyCW(b.dataset.cw); });

/* ---------------- scroll keyframes ---------------- */
const TAU = Math.PI*2;
const KS = [
  { rx:0.32, ry:-0.42, rz:0.06, x:0,    y:-0.12, s:1.0,  ex:0, bg:CW.forest.bg },
  { rx:0.08, ry:1.45,  rz:0.05, x:1.35, y:0,     s:1.12, ex:0, bg:['#0e3a2c','#020b07'] },
  { rx:0.14, ry:-0.3,  rz:-0.06,x:-1.35,y:0,     s:1.05, ex:0, bg:CW.forest.bg },
  { rx:0.55, ry:-1.05, rz:0.12, x:1.3,  y:0.05,  s:0.78, ex:1, bg:['#33363c','#0a0b0d'] },
  { rx:0.12, ry:Math.PI+0.38, rz:0, x:-1.35, y:0, s:0.98, ex:0, bg:['#ece0c6','#b9a074'] },
  { rx:0.28, ry:TAU-0.5, rz:0.05, x:1.35, y:0, s:0.95, ex:0, bg:['#9a3b17','#1e0802'] },
];
const MOB = [ {x:0,y:0.45,s:0.72}, {x:0,y:1.55,s:0.55}, {x:0,y:1.6,s:0.58}, {x:0,y:1.6,s:0.45}, {x:0,y:1.55,s:0.55}, {x:0,y:1.6,s:0.5} ];
const cur = { rx:0.32, ry:-1.6, rz:0.06, x:0, y:-0.12, s:0.6, ex:0 };
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const lerp = (a,b,t) => a + (b-a)*t;
const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
const mix = (a,b,t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')})`; };
const sections = [...document.querySelectorAll('main section')];
$('#progress').innerHTML = sections.map(() => '<i></i>').join('');
const dots = [...document.querySelectorAll('#progress i')];

function target(){
  const mid = scrollY + innerHeight/2;
  const centers = sections.map(s => s.offsetTop + s.offsetHeight/2);
  let i = 0; while(i < centers.length-2 && mid > centers[i+1]) i++;
  let t = (mid - centers[i]) / (centers[i+1] - centers[i]); t = Math.min(1, Math.max(0, t));
  const e = ease(t), mob = innerWidth < 820;
  const A = { ...KS[i], ...(mob ? MOB[i] : {}) }, B = { ...KS[i+1], ...(mob ? MOB[i+1] : {}) };
  const o = {}; for(const k of ['rx','ry','rz','x','y','s','ex']) o[k] = lerp(A[k], B[k], e);
  // page decoration
  const r = document.documentElement.style;
  const bg1 = mix(A.bg[0], B.bg[0], e), bg2 = mix(A.bg[1], B.bg[1], e);
  r.setProperty('--bg1', bg1); r.setProperty('--bg2', bg2);
  const L = (c => { const [rr,gg,bb] = c.match(/\d+/g).map(Number); return (0.299*rr+0.587*gg+0.114*bb)/255; })(bg1);
  const light = L > 0.62;
  r.setProperty('--fg', light ? '#211a10' : '#f3eee2'); r.setProperty('--mut', light ? 'rgba(33,26,16,.68)' : 'rgba(243,238,226,.62)'); r.setProperty('--line', light ? 'rgba(33,26,16,.2)' : 'rgba(243,238,226,.18)');
  r.setProperty('--acc', light ? '#8a3a12' : (i >= 2 && i <= 3 && e < .5 ? CW[cw].acc : '#d9b36c'));
  const act = t < .5 ? i : i+1; dots.forEach((d,k) => d.classList.toggle('on', k === act));
  const bt = $('#bigtitle'), hp = Math.min(1, scrollY / (innerHeight*0.7));
  bt.style.opacity = 1 - hp; bt.style.transform = `translateY(calc(${mob ? '-120%' : '-58%'} - ${hp*80}px)) scale(${1 + hp*0.15})`;
  return o;
}

/* ---------------- resize ---------------- */
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = w < 820 ? 42 : 30; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------------- mouse tilt ---------------- */
let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; });

/* ---------------- loop ---------------- */
const clock = new THREE.Clock();
function frame(){
  const dt = Math.min(clock.getDelta(), 0.05), T = target(), k = 1 - Math.pow(0.0015, dt);
  for(const p in T) cur[p] = lerp(cur[p], T[p], k);
  watch.rotation.set(cur.rx + my*0.12, cur.ry + mx*0.25, cur.rz);
  watch.position.set(cur.x, cur.y + Math.sin(performance.now()/1400)*0.025, 0);
  watch.scale.setScalar(cur.s);
  for(const n in parts){ const g = parts[n]; g.position.z = g.userData.z * cur.ex; }
  parts.crown.position.x = 0.45*cur.ex;
  parts.strap.position.z = -0.6*cur.ex; parts.strap.scale.setScalar(1 - 0.25*cur.ex);
  // live time — 8 beats per second
  const now = new Date(), ms = Math.floor(now.getMilliseconds()/125)*125;
  const sec = now.getSeconds() + ms/1000, min = now.getMinutes() + sec/60, hr = (now.getHours()%12) + min/60;
  secH.rotation.z = -sec/60*TAU; minH.rotation.z = -min/60*TAU; hourH.rotation.z = -hr/12*TAU;
  for(const g of gears) g.rotation.z += g.userData.sp * dt;
  rotorG.userData.rotor.rotation.z += dt * (0.6 + Math.abs(T.ry - cur.ry)*4);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ---------------- reveal + counters ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if(!e.isIntersecting) return; e.target.classList.add('in');
  e.target.querySelectorAll('[data-count]').forEach(el => { if(el.dataset.done) return; el.dataset.done = 1; const to = +el.dataset.count, t0 = performance.now();
    const step = n => { const p = Math.min(1, (n - t0)/1600), v = Math.round(to * (1 - Math.pow(1-p, 3))); el.textContent = v.toLocaleString('en-US'); if(p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}), { threshold:0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------------- modal + nav ---------------- */
document.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => $('#modal').classList.add('on')));
$('#mclose').onclick = () => $('#modal').classList.remove('on');
$('#modal').onclick = e => { if(e.target.id === 'modal') $('#modal').classList.remove('on'); };
document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const s = document.querySelector(a.getAttribute('href')); scrollTo({ top: s.offsetTop, behavior:'smooth' }); }));

/* ---------------- start ---------------- */
lbar.style.width = '75%';
document.fonts.ready.then(() => {
  applyCW('forest');
  renderer.compile(scene, camera);
  lbar.style.width = '100%';
  setTimeout(() => { $('#loader').classList.add('gone'); }, 350);
  frame();
});
window.__meridian = { applyCW, cur, watch };
