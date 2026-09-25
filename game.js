import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const root=document.getElementById('game'),speedEl=document.getElementById('speed'),driftEl=document.getElementById('drift'),scoreEl=document.getElementById('score'),overlay=document.getElementById('overlay'),start=document.getElementById('start');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x071019);scene.fog=new THREE.Fog(0x071019,70,230);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9fd8ff,0x11151c,1.5));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-60,100,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const mats={road:new THREE.MeshStandardMaterial({color:0x252a31,roughness:.88}),edge:new THREE.MeshStandardMaterial({color:0x56606b,roughness:.7}),grass:new THREE.MeshStandardMaterial({color:0x15241c,roughness:1}),wall:new THREE.MeshStandardMaterial({color:0x26323d,roughness:.7}),ramp:new THREE.MeshStandardMaterial({color:0x384a58,metalness:.2,roughness:.65}),neon:new THREE.MeshBasicMaterial({color:0x7df7ff}),red:new THREE.MeshBasicMaterial({color:0xff426e})};
function box(x,y,z,sx,sy,sz,mat,rot=0){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
// city island
box(0,-.7,0,220,1,180,mats.grass);for(let x=-100;x<=100;x+=20)for(let z=-80;z<=80;z+=20){if(Math.abs(x)<45&&Math.abs(z)<40)continue;box(x,1+Math.random()*3,z,12,3+Math.random()*6,12,mats.wall,Math.random()*Math.PI)}
// main drift circuit: connected road slabs
const roads=[];function road(x,z,w,d,rot=0){const r=box(x,.05,z,w,.18,d,mats.road,rot);roads.push(r);for(const side of [-1,1]){const off=w/2-0.35;const e=box(x+Math.cos(rot)*0,z+.0,w>.0?0:0,1,1,1,mats.edge);e.visible=false}return r}
road(0,0,125,18);road(45,-30,18,75);road(-45,30,18,75);road(0,65,110,18);road(0,-65,110,18);road(0,0,18,125,Math.PI/2);road(75,0,45,18);road(-75,0,45,18);
// ramps and jump pads
function ramp(x,z,rot=0){const r=box(x,2.5,z,12,5,22,mats.ramp,rot);r.geometry.translate(0,-1.8,-6);return r}ramp(15,-65,0);ramp(-15,65,Math.PI);ramp(75,0,-Math.PI/2);ramp(-75,0,Math.PI/2);
// barriers, cones and neon markers
for(let i=-95;i<=95;i+=10){box(i,.9,-75,.25,1.8,.25,mats.red);box(i,.9,75,.25,1.8,.25,mats.neon)}
for(let i=-70;i<=70;i+=14){box(-85,.9,i,.25,1.8,.25,mats.neon);box(85,.9,i,.25,1.8,.25,mats.red)}
// decorative towers
for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const x=Math.cos(a)*98,z=Math.sin(a)*78;box(x,6,z,5,12,5,mats.wall)}
// car
const car=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(2.2,.65,4),new THREE.MeshStandardMaterial({color:0xdfe9f0,metalness:.55,roughness:.25}));body.position.y=.9;body.castShadow=true;car.add(body);const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.65,.55,1.7),new THREE.MeshStandardMaterial({color:0x172432,metalness:.2,roughness:.15}));cabin.position.set(0,1.38,-.2);cabin.castShadow=true;car.add(cabin);for(const x of [-1,1])for(const z of [-1.25,1.25]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.25,16),new THREE.MeshStandardMaterial({color:0x08090b,roughness:.9}));w.rotation.z=Math.PI/2;w.position.set(x*1.05,.55,z);car.add(w)}car.position.set(0,.1,0);scene.add(car);
const smoke=[];function puff(){const p=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),new THREE.MeshBasicMaterial({color:0xb9c2ca,transparent:true,opacity:.5}));p.position.copy(car.position);p.position.y=.35;p.position.x+=(Math.random()-.5)*1.5;p.position.z+=(Math.random()-.5)*1.5;scene.add(p);smoke.push({m:p,t:0})}
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();if(e.key.toLowerCase()==='r')reset()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let running=false,speed=0,steer=0,air=0,score=0,drift=0,bestDrift=0,last=performance.now();
function reset(){car.position.set(0,.1,0);car.rotation.y=0;speed=0;steer=0;air=0;score=0;drift=0;scoreEl.textContent=0;running=true;overlay.classList.add('hidden');last=performance.now()}
start.onclick=reset;
function update(dt){const gas=keys.w||keys.arrowup,brake=keys.s||keys.arrowdown,left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright,hand=keys[' '];const throttle=gas?1:brake?-.65:0;speed+=throttle*34*dt;speed*=Math.pow(hand?.965:.985,dt*60);speed=THREE.MathUtils.clamp(speed,-18,52);const steerInput=(right?1:0)-(left?1:0);steer=THREE.MathUtils.lerp(steer,steerInput,dt*8);const turn=.95*(speed/28)*steer*dt*(hand?1.7:1);car.rotation.y-=turn;
// drift physics: lateral velocity is damped heavily normally, but handbrake releases grip
const forward=new THREE.Vector3(Math.sin(car.rotation.y),0,Math.cos(car.rotation.y));const velocity=forward.clone().multiplyScalar(speed);const side=new THREE.Vector3(forward.z,0,-forward.x);let lateral=side.dot(velocity);lateral*=hand?.82:.18;const move=forward.multiplyScalar(speed).add(side.multiplyScalar(lateral));car.position.addScaledVector(move,dt);
// jumps / gravity
if(car.position.y>.11||Math.abs(speed)>32&&Math.abs(car.position.x)>8&&Math.abs(car.position.z)>55){air-=20*dt;car.position.y+=air*dt;if(car.position.y<=.1){if(air< -8)score+=Math.round(Math.abs(air)*2);car.position.y=.1;air=0}}
if(Math.abs(lateral)>5&&Math.abs(speed)>12){drift+=Math.abs(lateral)*dt;bestDrift=Math.max(bestDrift,drift);score+=Math.floor(Math.abs(lateral)*dt*2);if(Math.random()<.35)puff()}else if(drift>0){score+=Math.floor(drift*10);drift=0}
car.position.x=THREE.MathUtils.clamp(car.position.x,-106,106);car.position.z=THREE.MathUtils.clamp(car.position.z,-86,86);speedEl.textContent=Math.round(Math.abs(speed)*3.6);driftEl.textContent=Math.round(bestDrift);scoreEl.textContent=score;
for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.t+=dt;s.m.position.y+=dt*.5;s.m.scale.multiplyScalar(1+dt*1.4);s.m.material.opacity=.5*(1-s.t/1.2);if(s.t>1.2){scene.remove(s.m);smoke.splice(i,1)}}
}
function cameraUpdate(dt){const behind=new THREE.Vector3(-Math.sin(car.rotation.y)*10,6.2,-Math.cos(car.rotation.y)*10);const target=car.position.clone().add(behind);camera.position.lerp(target,1-Math.pow(.001,dt));const look=car.position.clone();look.y+=1;camera.lookAt(look)}
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.033);last=now;if(running){update(dt);cameraUpdate(dt)}renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});camera.position.set(0,7,-11);camera.lookAt(0,0,0);loop(performance.now());