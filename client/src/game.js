(() => {
"use strict";
const canvas=document.querySelector("#world"),ctx=canvas.getContext("2d"),notice=document.querySelector("#notice"),coords=document.querySelector("#coords");
ctx.imageSmoothingEnabled=false;
const W=2400,H=1800,camera={x:0,y:0};
const player={x:520,y:500,tx:520,ty:500,step:0,running:false};
const guardian={x:760,y:390},slime={x:1240,y:720};
const scenery=[];
const heroSprite=new Image(),slimeSprite=new Image();
heroSprite.src="assets/sprites/player-walk.svg";slimeSprite.src="assets/sprites/slime-idle.svg";
const effects=[];
const classData={soldier:{name:"Soldado",hp:130,mp:35,damage:14,speed:185,range:52,cooldown:.72,color:"#547c9b",accent:"#c5d5dc",weapon:"sword",style:"melee"},assassin:{name:"Assassino",hp:85,mp:45,damage:19,speed:235,range:48,cooldown:.58,color:"#294d87",accent:"#51c9d5",weapon:"dagger",style:"melee"},mage:{name:"Mago",hp:75,mp:110,damage:24,speed:175,range:300,cooldown:1.05,color:"#9b3041",accent:"#c69aff",weapon:"staff",style:"magic"},priest:{name:"Clérigo",hp:100,mp:100,damage:15,speed:180,range:230,cooldown:1.15,color:"#d5d8d0",accent:"#c84e55",weapon:"staff",style:"holy"},longbowman:{name:"Arqueiro",hp:90,mp:55,damage:17,speed:205,range:245,cooldown:.95,color:"#8a7047",accent:"#c5a66a",weapon:"bow",style:"arrow"},cavalry:{name:"Cavalaria",hp:145,mp:40,damage:17,speed:195,range:60,cooldown:.82,color:"#456f85",accent:"#d6dbe0",weapon:"lance",style:"melee"}};
let chosenClass="soldier",attackState=0,attackCooldown=0,combatTarget=null,playerHp=130,playerMp=35,playerXp=0,playerLevel=1,xpToNext=100,gold=0,monsterHp=60,monsterAlive=true,slimeAttackCooldown=2.2,playerHitFlash=0,activeMonster=null,skillCooldowns=[0,0,0],questState={guardian:false,slimes:0,wolf:false,skeleton:false,claimed:false};
const monsters=[{id:"slime",name:"Slime Verde",x:1240,y:720,hp:60,maxHp:60,damage:7,range:52,attackRate:2.4,alive:true,kind:"slime",xp:25,respawn:0,spawnX:1240,spawnY:720},{id:"wolf",name:"Lobo Cinzento",x:1510,y:970,hp:105,maxHp:105,damage:11,range:58,attackRate:1.8,alive:true,kind:"wolf",xp:40,respawn:0,spawnX:1510,spawnY:970},{id:"skeleton",name:"Esqueleto",x:930,y:1210,hp:135,maxHp:135,damage:13,range:62,attackRate:2.1,alive:true,kind:"skeleton",xp:55,respawn:0,spawnX:930,spawnY:1210}];activeMonster=monsters[0];
const spriteSheetConfig={frameWidth:64,frameHeight:64,framesPerRow:6,actions:["idle","walk","run","attack"],directions:["down","left","right","up"],files:{assassin:"assets/classes/assassin.svg",mage:"assets/classes/mage.svg",priest:"assets/classes/priest.svg",longbowman:"assets/classes/longbowman.svg",cavalry:"assets/classes/cavalry.svg",soldier:"assets/classes/soldier.svg"}};
const classSpriteSheets={};
for(const [key,src] of Object.entries(spriteSheetConfig.files)){const img=new Image();img.onload=()=>{classSpriteSheets[key]=img;};img.onerror=()=>{};img.src=src;}
function drawClassSpriteSheet(x,y,t){
 const img=classSpriteSheets[chosenClass];if(!img)return false;
 const dx=player.tx-player.x,dy=player.ty-player.y,moving=Math.hypot(dx,dy)>3;
 const dir=Math.abs(dx)>Math.abs(dy)?(dx>=0?"right":"left"):(dy>=0?"down":"up");
 const action=attackState>0?"attack":moving?(player.running?"run":"walk"):"idle";
 const actionIndex=spriteSheetConfig.actions.indexOf(action),dirIndex=spriteSheetConfig.directions.indexOf(dir);
 const frameCount=action==="idle"?4:action==="attack"?6:6;
 const frame=action==="idle"?Math.floor(t/260)%frameCount:Math.floor(t/(action==="attack"?65:105))%frameCount;
 const sx=frame*spriteSheetConfig.frameWidth,sy=(actionIndex*4+dirIndex)*spriteSheetConfig.frameHeight;
 if(sx+64>img.width||sy+64>img.height)return false;
 ctx.drawImage(img,sx,sy,64,64,x-24,y-53,48,60);
 return true;
}

const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const pathPoints=[[0,570],[250,560],[440,610],[650,570],[850,660],[1040,740],[1240,730],[1440,770],[1660,720],[1840,810],[2030,850],[2400,900]];
function segDistance(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;const t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/(l||1)));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy);}
function roadDistance(x,y){let d=1e9;for(let i=1;i<pathPoints.length;i++)d=Math.min(d,segDistance(x,y,pathPoints[i-1],pathPoints[i]));return d;}
function drawGround(c){
 for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){
  const n=rand(x*3+y*7),road=roadDistance(x+8,y+8)<(n>.88?75:63);
  c.fillStyle=road?(n>.75?"#9b7650":n>.45?"#ad875b":"#b99366"):(n>.82?"#568d4c":n>.45?"#4e8248":"#477a45");
  c.fillRect(x,y,16,16);
  if(!road&&n>.45){c.fillStyle=n>.8?"#83a957":"#396e40";c.fillRect(x+3+Math.floor(n*7),y+4,2,2);}
  if(road&&n>.7){c.fillStyle="#c8a477";c.fillRect(x+3,y+5,3,2);}
 }
 // Stone village square
 c.fillStyle="#3e5144";c.beginPath();c.ellipse(760,390,155,112,0,0,Math.PI*2);c.fill();
 c.fillStyle="#9b9d8d";c.beginPath();c.ellipse(760,383,148,105,0,0,Math.PI*2);c.fill();
 for(let y=290;y<480;y+=18)for(let x=620;x<900;x+=20){
  if(((x-760)/148)**2+((y-383)/105)**2<.96){c.fillStyle=rand(x+y)>.5?"#c1c2ad":"#aeb4a2";c.fillRect(x,y,17,14);c.strokeStyle="#828e7d";c.lineWidth=1;c.strokeRect(x,y,17,14);}
 }
 // Water and bank
 c.fillStyle="#335f50";c.beginPath();c.moveTo(1680,0);c.bezierCurveTo(1570,180,1770,290,1680,450);c.bezierCurveTo(1600,610,1780,650,1710,850);c.lineTo(1930,860);c.bezierCurveTo(1880,640,1800,520,1900,360);c.bezierCurveTo(1980,190,1840,100,1900,0);c.closePath();c.fill();
 c.fillStyle="#478b9a";c.beginPath();c.moveTo(1695,0);c.bezierCurveTo(1600,180,1790,290,1700,450);c.bezierCurveTo(1630,600,1800,660,1730,830);c.lineTo(1890,830);c.bezierCurveTo(1840,640,1770,510,1870,350);c.bezierCurveTo(1940,190,1810,100,1870,0);c.closePath();c.fill();
 for(let i=0;i<60;i++){const x=1700+rand(i+22)*180,y=rand(i+400)*810;c.fillStyle="#a4d7c5";c.globalAlpha=.12+rand(i+900)*.15;c.fillRect(x,y,10+rand(i)*18,2);c.globalAlpha=1;}
 // Cliff wall on eastern edge
 for(let y=120;y<1500;y+=48){const x=2100+Math.sin(y/130)*70;c.fillStyle="#61412f";c.fillRect(x,y,300,50);c.fillStyle="#805337";c.fillRect(x+8,y+5,292,38);c.fillStyle="#a06a43";c.fillRect(x+5,y+4,290,5);for(let k=0;k<5;k++){c.fillStyle="#563b2c";c.fillRect(x+20+k*45,y+20+rand(y+k)*18,18,5);}}
}
function drawTree(c,x,y,s=1,seed=0){
 c.save();c.translate(x,y);c.scale(s,s);
 c.fillStyle="#263c2b";c.beginPath();c.ellipse(3,17,25,12,0,0,Math.PI*2);c.fill();
 c.fillStyle="#66472e";c.fillRect(-6,-4,12,31);
 const layers=[[-1,-17,25,"#24543a"],[-15,-7,17,"#2c6841"],[14,-8,17,"#347447"],[0,-30,15,"#4c8c4d"],[-7,-20,10,"#5b9d50"],[10,-22,11,"#43874a"]];
 for(let i=0;i<layers.length;i++){const [ox,oy,r,col]=layers[i];c.fillStyle=col;c.beginPath();c.arc(ox,oy,r,0,Math.PI*2);c.fill();}
 for(let i=0;i<18;i++){const a=rand(seed*31+i)*Math.PI*2,r=rand(seed*71+i+9)*18;c.fillStyle=i%3===0?"#8dbb56":i%3===1?"#6cab4e":"#3d8145";c.fillRect(Math.cos(a)*r-2,Math.sin(a)*r-20,4,4);}
 c.restore();
}
function drawHouse(c,x,y,scale=1,kind=0){
 c.save();c.translate(x,y);c.scale(scale,scale);
 const w=kind?190:160,h=105;
 c.fillStyle="#243b30";c.fillRect(7,25,w,h);
 c.fillStyle="#725238";c.fillRect(0,12,w,h-10);
 c.fillStyle="#d7c49a";c.fillRect(8,22,w-16,h-28);
 // timber frame
 c.fillStyle="#65452f";c.fillRect(8,22,8,h-28);c.fillRect(w-16,22,8,h-28);c.fillRect(w/2-4,22,8,h-28);c.fillRect(8,58,w-16,7);
 // roof
 c.fillStyle="#3e403b";c.beginPath();c.moveTo(-18,24);c.lineTo(w/2,-58);c.lineTo(w+18,24);c.closePath();c.fill();
 c.fillStyle=kind?"#52624e":"#66645a";c.beginPath();c.moveTo(-9,21);c.lineTo(w/2,-48);c.lineTo(w+9,21);c.closePath();c.fill();
 for(let r=0;r<5;r++){c.strokeStyle="#7b7768";c.lineWidth=2;c.beginPath();c.moveTo(4+r*8,18-r*10);c.lineTo(w/2, -47+r*2);c.lineTo(w-4-r*8,18-r*10);c.stroke();}
 // door and windows
 c.fillStyle="#49372b";c.fillRect(w*.43,68,32,44);c.fillStyle="#a58a5e";c.fillRect(w*.43+4,72,24,40);
 for(const wx of [23,w-48]){c.fillStyle="#634a34";c.fillRect(wx,39,26,25);c.fillStyle="#8bc0bd";c.fillRect(wx+3,42,20,19);c.fillStyle="#d9c28c";c.fillRect(wx+12,42,3,19);c.fillRect(wx+3,50,20,3);}
 c.fillStyle="#d7b86e";c.fillRect(w-25,76,5,5);
 c.restore();
}
function drawDecoration(c,x,y,type,seed){c.save();c.translate(x,y);if(type==="torch"){c.fillStyle="#60472d";c.fillRect(-3,-1,6,26);c.fillStyle="#e18a37";c.beginPath();c.arc(0,-5,7,0,Math.PI*2);c.fill();c.fillStyle="#ffe18a";c.beginPath();c.arc(0,-7,3,0,Math.PI*2);c.fill();}else if(type==="flower"){c.fillStyle="#2c623b";c.fillRect(-1,0,2,10);c.fillStyle=seed%2?"#e9a3ca":"#f4d36f";for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.arc(Math.cos(a)*4,-3+Math.sin(a)*4,2.5,0,Math.PI*2);c.fill();}}else{c.fillStyle="#827e70";c.fillRect(-5,0,11,6);c.fillStyle="#b2aa91";c.fillRect(-3,-3,6,4);}c.restore();}
function buildWorld(){
 const off=document.createElement("canvas");off.width=W;off.height=H;const c=off.getContext("2d");c.imageSmoothingEnabled=false;
 drawGround(c);
 scenery.push({type:"house",x:420,y:900,scale:1.12,kind:1,depth:1008},{type:"house",x:1480,y:320,scale:.95,kind:0,depth:420},{type:"house",x:1040,y:1130,scale:.82,kind:1,depth:1216});
 // Trees clustered around clearings, river and paths
 for(let i=0;i<430;i++){let x=rand(i+5)*W,y=rand(i+805)*H;const nearRoad=roadDistance(x,y)<92,nearSquare=Math.hypot((x-760)/1.1,(y-390))<180,nearHouse=[ [420,900],[1480,320],[1040,1130] ].some(([hx,hy])=>Math.abs(x-hx)<155&&Math.abs(y-hy)<145),inRiver=x>1660&&x<1950&&y<870;
 if(!nearRoad&&!nearSquare&&!nearHouse&&!inRiver&&!(x>2050)){const scale=.62+rand(i+1300)*.7;scenery.push({type:"tree",x,y,scale,depth:y+17*scale,seed:i});}
 }
 // More deliberate forest edge clusters
 for(let i=0;i<70;i++){let x=rand(i+1800)*W,y=rand(i+2400)*H;if(Math.hypot(x-760,y-390)>185&&roadDistance(x,y)>95){const scale=.9+rand(i+2600)*.45;scenery.push({type:"tree",x,y,scale,depth:y+17*scale,seed:i+700});}}
 for(let i=0;i<160;i++){let x=rand(i+3000)*W,y=rand(i+3600)*H;if(roadDistance(x,y)>85&&Math.hypot(x-760,y-390)>165)drawDecoration(c,x,y,i%5===0?"stone":"flower",i);}
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]])drawDecoration(c,x,y,"torch",0);
 // Fountain in the village square
 c.fillStyle="#59665f";c.fillRect(744,365,32,35);c.fillStyle="#b5c6c0";c.fillRect(749,360,22,30);c.fillStyle="#65a9b4";c.beginPath();c.arc(760,358,12,0,Math.PI*2);c.fill();c.fillStyle="#dce8d8";c.fillRect(757,340,6,20);
 return off;
}
const world=buildWorld();
function label(text,x,y,color="#f5f0d7"){ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#243226";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawPixelHero(x,y,t){
 const d=classData[chosenClass];
 const dx=player.tx-player.x,dy=player.ty-player.y;
 const moving=Math.hypot(dx,dy)>3;
 const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
 const runFrame=moving?Math.floor(t/95)%4:0;
 const attackProgress=attackState>0?1-attackState:0;
 const swing=attackState>0?Math.sin(attackProgress*Math.PI):0;
 const bob=moving?Math.abs(Math.sin(t/70))*2:Math.sin(t/310)*.5;
 const stride=moving?Math.sin(t/70)*4:0;
 ctx.save();ctx.translate(Math.round(x),Math.round(y+bob));if(direction==="left")ctx.scale(-1,1);
 // desenhado em escala de pixel art: contornos escuros, volumes e detalhes por classe
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle="#17251f99";ctx.fillRect(-13,9,27,5);
 // pernas e botas animadas
 ctx.fillStyle="#302b2a";
 ctx.fillRect(-9+stride,-2,8,12);ctx.fillRect(2-stride,-2,8,12);
 ctx.fillStyle=d.accent;ctx.fillRect(-9+stride,7,9,5);ctx.fillRect(1-stride,7,9,5);
 ctx.fillStyle="#4a3529";ctx.fillRect(-10+stride,11,11,3);ctx.fillRect(1-stride,11,11,3);
 // capa
 ctx.fillStyle=d.color;ctx.fillRect(-13,-24,26,25);ctx.fillRect(-15,-20,4,16);ctx.fillRect(11,-20,4,16);
 ctx.fillStyle="#172b36";ctx.fillRect(-11,-22,22,19);
 ctx.fillStyle=d.color;ctx.fillRect(-9,-21,18,17);
 // peitoral e cinto
 ctx.fillStyle=d.accent;ctx.fillRect(-10,-21,20,4);ctx.fillRect(-3,-15,6,10);
 ctx.fillStyle="#d6b66e";ctx.fillRect(-5,-7,10,3);
 // braços
 ctx.fillStyle="#d9ad87";ctx.fillRect(-17,-19,5,12);ctx.fillRect(12,-19,5,12);
 ctx.fillStyle=d.color;ctx.fillRect(-17,-21,6,8);ctx.fillRect(11,-21,6,8);
 // cabeça/capuz
 ctx.fillStyle="#332b2c";ctx.fillRect(-10,-42,20,20);
 ctx.fillStyle=chosenClass==="assassin"?"#183768":chosenClass==="mage"?"#8f2635":chosenClass==="priest"?"#e5e1d3":chosenClass==="longbowman"?"#735331":chosenClass==="cavalry"?"#465e70":"#55412e";
 ctx.fillRect(-9,-41,18,17);ctx.fillRect(-7,-45,14,5);
 ctx.fillStyle="#e0b992";ctx.fillRect(-6,-36,12,10);
 if(direction==="up"){ctx.fillStyle=d.color;ctx.fillRect(-9,-42,18,16);ctx.fillRect(-6,-46,12,5);}
 else{ctx.fillStyle="#252b32";ctx.fillRect(-4,-32,2,2);ctx.fillRect(3,-32,2,2);}
 // acessórios de classe e arma
 ctx.lineWidth=3;ctx.strokeStyle=d.accent;ctx.beginPath();
 if(d.weapon==="sword"||d.weapon==="dagger"){
  const reach=attackState>0?22*swing:0;
  ctx.moveTo(13,-15);ctx.lineTo(19+reach,-34);ctx.stroke();
  ctx.strokeStyle="#d7c9a9";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,-18);ctx.lineTo(17,-15);ctx.stroke();
  if(chosenClass==="assassin"){ctx.beginPath();ctx.moveTo(-13,-15);ctx.lineTo(-20-reach,-28);ctx.stroke();}
 }
 if(d.weapon==="staff"){
  ctx.moveTo(15,-15);ctx.lineTo(15,-49);ctx.stroke();
  ctx.fillStyle="#c6a0ff";ctx.fillRect(10,-54,10,9);ctx.fillStyle="#fff0c5";ctx.fillRect(13,-57,4,4);
  if(attackState>0){ctx.shadowColor="#9cecff";ctx.shadowBlur=16;ctx.fillStyle="#a9efff";ctx.fillRect(7,-59,16,16);ctx.shadowBlur=0;}
 }
 if(d.weapon==="bow"){
  ctx.beginPath();ctx.arc(15,-25,13,-1.2,1.2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(15,-38);ctx.lineTo(15,-12);ctx.stroke();
  if(attackState>0){ctx.strokeStyle="#f2dfad";ctx.beginPath();ctx.moveTo(15,-25);ctx.lineTo(29,-25);ctx.stroke();}
 }
 if(d.weapon==="lance"){
  ctx.moveTo(14,-12);ctx.lineTo(23,-54);ctx.stroke();ctx.fillStyle="#e7e1d0";ctx.fillRect(20,-59,6,10);
  ctx.fillStyle="#9d3135";ctx.fillRect(-12,-27,7,10);
 }
 // detalhe do elmo/insígnia
 if(chosenClass==="cavalry"||chosenClass==="soldier"){ctx.fillStyle="#c3cbd1";ctx.fillRect(-8,-45,16,4);ctx.fillStyle="#b43c3c";ctx.fillRect(-2,-21,4,9);}
 if(chosenClass==="priest"){ctx.fillStyle="#bd4149";ctx.fillRect(-2,-22,4,13);ctx.fillRect(-7,-18,14,4);}
 ctx.restore();
}
function drawSlime(x,y,t){
 const phase=t/170,hop=Math.max(0,Math.sin(phase))*5,squash=1+Math.sin(phase*2)*.08;
 ctx.save();ctx.translate(x,y-hop);ctx.scale(squash,1/squash);
 ctx.fillStyle="#142d2188";ctx.beginPath();ctx.ellipse(0,7,22,6,0,0,Math.PI*2);ctx.fill();
 const g=ctx.createRadialGradient(-7,-16,2,0,-9,28);g.addColorStop(0,"#b9ffd1");g.addColorStop(.48,"#55d98a");g.addColorStop(1,"#168653");
 ctx.fillStyle=g;ctx.strokeStyle="#14563a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-21,2);ctx.quadraticCurveTo(-26,-17,-12,-25);ctx.quadraticCurveTo(0,-34,13,-24);ctx.quadraticCurveTo(27,-14,21,2);ctx.quadraticCurveTo(0,13,-21,2);ctx.fill();ctx.stroke();
 ctx.fillStyle="#e7fff0";ctx.beginPath();ctx.ellipse(-8,-13,4,6,0,0,Math.PI*2);ctx.ellipse(8,-13,4,6,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#173b30";ctx.fillRect(-8,-13,3,4);ctx.fillRect(7,-13,3,4);
 ctx.strokeStyle="#174c36";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-5,5,.15,Math.PI-.15);ctx.stroke();
 ctx.fillStyle="#d6ffe1";ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(-11,-22,4,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle="#26352d";ctx.fillRect(x-24,y-43-hop,48,6);ctx.fillStyle="#d94f58";ctx.fillRect(x-23,y-42-hop,46*Math.max(0,monsterHp/60),4);
 label("Slime Verde",x,y-49-hop,"#caffc8");
}
function drawMonster(m,t){if(!m.alive)return;if(m.kind==="slime"){drawSlime(m.x,m.y,t);return;}const bob=Math.sin(t/(m.kind==="wolf"?105:190))*2;ctx.save();ctx.translate(m.x,m.y+bob);ctx.fillStyle="#14251f88";ctx.beginPath();ctx.ellipse(0,5,19,5,0,0,Math.PI*2);ctx.fill();if(m.kind==="wolf"){ctx.fillStyle="#46515b";ctx.beginPath();ctx.ellipse(0,-12,19,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#697783";ctx.beginPath();ctx.ellipse(10,-22,11,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#39434c";ctx.beginPath();ctx.moveTo(5,-28);ctx.lineTo(6,-39);ctx.lineTo(13,-29);ctx.moveTo(16,-28);ctx.lineTo(24,-36);ctx.lineTo(22,-24);ctx.fill();ctx.fillStyle="#e9c1a0";ctx.fillRect(15,-22,3,3);ctx.fillRect(7,-22,3,3);}else{ctx.fillStyle="#c1b59a";ctx.fillRect(-9,-31,18,28);ctx.fillStyle="#e2d5b8";ctx.fillRect(-8,-42,16,13);ctx.fillStyle="#453e38";ctx.fillRect(-5,-37,3,3);ctx.fillRect(3,-37,3,3);ctx.strokeStyle="#8e8c7f";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,-25);ctx.lineTo(-17,-10);ctx.moveTo(8,-25);ctx.lineTo(17,-10);ctx.moveTo(-5,-3);ctx.lineTo(-8,7);ctx.moveTo(5,-3);ctx.lineTo(8,7);ctx.stroke();ctx.fillStyle="#8b8170";ctx.fillRect(15,-28,3,20);ctx.fillStyle="#c9c4b2";ctx.fillRect(12,-32,9,7);}ctx.restore();ctx.fillStyle="#26352d";ctx.fillRect(m.x-24,m.y-48,48,5);ctx.fillStyle="#d94f58";ctx.fillRect(m.x-23,m.y-47,46*(m.hp/m.maxHp),3);label(m.name,m.x,m.y-54,m.kind==="wolf"?"#e0e9f2":"#e8ddc6");}
function drawActor(x,y,type,t){
 if(type==="player"){ctx.fillStyle="#08120d88";ctx.beginPath();ctx.ellipse(x,y+3,17,6,0,0,Math.PI*2);ctx.fill();if(!drawClassSpriteSheet(x,y,t))drawPixelHero(x,y,t);if(equipment.armor){ctx.save();ctx.globalAlpha=.82;ctx.fillStyle="#b7c7d0";ctx.fillRect(x-8,y-35,16,5);ctx.fillStyle="#6f8798";ctx.fillRect(x-10,y-29,20,4);ctx.restore();}if(equipment.weapon){ctx.save();ctx.strokeStyle="#f0d18a";ctx.lineWidth=3;ctx.shadowColor="#f0d18a";ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(x+15,y-18);ctx.lineTo(x+23,y-39);ctx.stroke();ctx.restore();}label("Viajante",x,y-57);return;}
 if(type==="monster"){const m=monsters.find(v=>v.x===x&&v.y===y);if(m)drawMonster(m,t);return;}
 ctx.fillStyle="#1b2c24";ctx.beginPath();ctx.ellipse(x,y+5,13,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9b7843";ctx.fillRect(x-9,y-18,18,22);ctx.fillStyle="#dfbd91";ctx.beginPath();ctx.arc(x,y-24,8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57402f";ctx.fillRect(x-9,y-31,18,6);ctx.fillStyle="#d4b66f";ctx.fillRect(x-12,y-18,24,4);label("Guardião",x,y-38,"#ffe2a0");
}
const projectiles=[];
function maxPlayerHp(){return classData[chosenClass].hp+(playerLevel-1)*10;}function maxPlayerMp(){return classData[chosenClass].mp+(playerLevel-1)*5;}
function refreshProgressUI(){const xpLabel=document.querySelector(".xp-line b"),xpBar=document.querySelector(".xp-track i"),levelBadge=document.querySelector(".level-badge"),classLabel=document.querySelector("#class-name"),profile=document.querySelector(".profile-chip small");if(xpLabel)xpLabel.textContent=playerXp+" / "+xpToNext;if(xpBar)xpBar.style.width=Math.min(100,playerXp/xpToNext*100)+"%";if(levelBadge)levelBadge.textContent=playerLevel;if(classLabel)classLabel.textContent=classData[chosenClass].name.toUpperCase()+" · NÍVEL "+playerLevel;if(profile)profile.textContent="Nível "+playerLevel+" · "+classData[chosenClass].name;}
function awardExperience(amount){playerXp+=amount;let gained=0;while(playerXp>=xpToNext){playerXp-=xpToNext;playerLevel++;xpToNext=Math.round(xpToNext*1.35);gained++;}if(gained){playerHp=maxPlayerHp();playerMp=maxPlayerMp();const hpText=document.querySelector(".stat-block .stat-label b"),mpText=document.querySelectorAll(".stat-label b")[1],hpBar=document.querySelector(".hp i"),mpBar=document.querySelector(".mp i");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";if(mpText)mpText.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";if(hpBar)hpBar.style.width="100%";if(mpBar)mpBar.style.width="100%";notice.innerHTML="<b>[NÍVEL UP]</b> Você alcançou o nível "+playerLevel+"! Vida e mana restauradas."; }refreshProgressUI();}
function dropLoot(target){gold+=target.kind==="slime"?3:target.kind==="wolf"?6:8;if(Math.random()<.14&&target.kind!=="slime"&&bag.length<24){const gear=target.kind==="wolf"?{id:"wolf-blade-"+Date.now(),name:"Lâmina do Caçador",kind:"weapon",attack:7,icon:"⚔"}:{id:"bone-armor-"+Date.now(),name:"Couraça Óssea",kind:"armor",defense:5,icon:"🛡"};bag.push(gear);notice.innerHTML+=" <b>[EQUIPAMENTO RARO]</b> "+gear.name+"!";}else if(Math.random()<.55&&bag.length<24){bag.push({id:"potion-"+Date.now(),name:"Poção de Vida",kind:"consumable",icon:"🧪"});notice.innerHTML+=" <b>[DROP]</b> Você encontrou uma Poção de Vida!";}else if(bag.length<24){const name=target.kind==="wolf"?"Presa de Lobo":target.kind==="skeleton"?"Osso Antigo":"Gosma Verde";bag.push({id:"material-"+Date.now(),name,kind:"material",icon:target.kind==="wolf"?"🦷":target.kind==="skeleton"?"🦴":"🟢"});notice.innerHTML+=" <b>[DROP]</b> Item obtido: "+name+".";}else notice.innerHTML+=" <b>[DROP]</b> Mochila cheia. Ouro recebido: "+(target.kind==="slime"?3:target.kind==="wolf"?6:8)+".";renderInventory();}
function updateQuestUI(){const a=document.querySelector("#quest-guardian"),b=document.querySelector("#quest-slimes"),c=document.querySelector("#quest-wolf"),d=document.querySelector("#quest-skeleton"),status=document.querySelector("#quest-status");if(a)a.textContent=questState.guardian?"1/1":"0/1";if(b)b.textContent=Math.min(3,questState.slimes)+"/3";if(c)c.textContent=questState.wolf?"1/1":"0/1";if(d)d.textContent=questState.skeleton?"1/1":"0/1";if(status)status.textContent=questState.claimed?"Jornada concluída · Recompensa recebida": "Recompensa: 100 ouro + 100 EXP";}
function progressQuest(target){if(target.id==="slime")questState.slimes=Math.min(3,questState.slimes+1);if(target.id==="wolf")questState.wolf=true;if(target.id==="skeleton")questState.skeleton=true;updateQuestUI();if(questState.guardian&&questState.slimes>=3&&questState.wolf&&questState.skeleton&&!questState.claimed){questState.claimed=true;gold+=100;awardExperience(100);notice.innerHTML="<b>[MISSÃO CONCLUÍDA]</b> Primeiros passos: +100 ouro e +100 EXP!";updateQuestUI();}}
function resolveHit(damage,target=activeMonster){if(!target||!target.alive)return;target.hp=Math.max(0,target.hp-damage);if(target.id==="slime"){monsterHp=target.hp;monsterAlive=target.alive;}effects.push({kind:"ring",x:target.x,y:target.y-10,life:0,duration:360},{kind:"number",x:target.x,y:target.y-35,text:"-"+damage,life:0,duration:850});for(let i=0;i<10;i++)effects.push({kind:"spark",x:target.x,y:target.y-8,vx:(rand(i+performance.now())-.5)*3,vy:(rand(i+90+performance.now())-.5)*3,life:0,duration:500});if(target.hp<=0){target.alive=false;target.respawn=18;combatTarget=null;notice.innerHTML="<b>[COMBATE]</b> "+target.name+" derrotado! +"+target.xp+" EXP.";awardExperience(target.xp);progressQuest(target);dropLoot(target);}else notice.innerHTML="<b>[COMBATE]</b> Dano em "+target.name+": "+target.hp+"/"+target.maxHp+".";}
function fireProjectile(style,damage,target=activeMonster){if(!target||!target.alive)return;const dx=target.x-player.x,dy=target.y-player.y,len=Math.max(1,Math.hypot(dx,dy)),speed=style==="arrow"?570:style==="holy"?390:330;projectiles.push({style,x:player.x,y:player.y-24,tx:target.x,ty:target.y-10,vx:dx/len,vy:dy/len,speed,damage,life:0,maxLife:len/speed,target});}
function drawProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i],step=p.speed*dt;p.life+=dt;p.x+=p.vx*step;p.y+=p.vy*step;ctx.save();ctx.globalCompositeOperation="lighter";if(p.style==="arrow"){ctx.strokeStyle="#f1d49a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-p.vx*17,p.y-p.vy*17);ctx.lineTo(p.x+p.vx*8,p.y+p.vy*8);ctx.stroke();ctx.fillStyle="#eaf5ff";ctx.beginPath();ctx.arc(p.x+p.vx*8,p.y+p.vy*8,3,0,Math.PI*2);ctx.fill();}else{const col=p.style==="holy"?"#fff0a0":"#a77cff";ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(p.x,p.y,8+Math.sin(p.life*25)*2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x-2,p.y-2,3,0,Math.PI*2);ctx.fill();}ctx.restore();if(Math.hypot(p.tx-p.x,p.ty-p.y)<12||p.life>p.maxLife+.2){projectiles.splice(i,1);if(p.target&&p.target.alive)resolveHit(p.damage,p.target);}}}
function attack(){const target=activeMonster;if(!target||!target.alive)return;const def=classData[chosenClass],dist=Math.hypot(target.x-player.x,target.y-player.y);combatTarget=target.id;if(dist>def.range){const ratio=(dist-def.range+5)/Math.max(1,dist);player.tx=target.x-(target.x-player.x)*ratio;player.ty=target.y-(target.y-player.y)*ratio;notice.innerHTML="<b>[COMBATE]</b> Aproximando-se de "+target.name+"...";return;}if(attackCooldown>0)return;attackCooldown=def.cooldown;attackState=1;if(def.style==="magic"||def.style==="arrow"||def.style==="holy")fireProjectile(def.style,def.damage,target);else resolveHit(def.damage+(equipment.weapon),target);}
const skillNames={soldier:["Golpe de Escudo","Determinação","Investida Real"],assassin:["Lâminas Sombrias","Passo das Sombras","Execução"],mage:["Míssil Arcano","Concentração","Chuva de Estrelas"],priest:["Luz Restauradora","Benção","Julgamento Sagrado"],longbowman:["Disparo Preciso","Foco do Caçador","Chuva de Flechas"],cavalry:["Estocada","Postura Defensiva","Carga de Cavalaria"]};
function castSkill(slot){const def=classData[chosenClass],cost=[12,18,25][slot],target=activeMonster;if(skillCooldowns[slot]>0||playerMp<cost){notice.innerHTML="<b>[HABILIDADE]</b> Habilidade recarregando ou mana insuficiente.";return;}if(slot!==1&&(!target||!target.alive)){notice.innerHTML="<b>[HABILIDADE]</b> Selecione um monstro primeiro.";return;}if(slot!==1&&Math.hypot(target.x-player.x,target.y-player.y)>def.range+115){notice.innerHTML="<b>[HABILIDADE]</b> Alvo fora do alcance.";return;}playerMp-=cost;skillCooldowns[slot]=[5,9,16][slot];const mpBar=document.querySelector(".mp i");if(mpBar)mpBar.style.width=(playerMp/def.mp*100)+"%";const mpText=document.querySelectorAll(".stat-label b")[1];if(mpText)mpText.innerHTML=playerMp+" <small>/ "+def.mp+"</small>";const name=skillNames[chosenClass][slot];if(slot===1){const heal=chosenClass==="priest"?32:chosenClass==="soldier"||chosenClass==="cavalry"?20:16;playerHp=Math.min(maxPlayerHp(),playerHp+heal);effects.push({kind:"heal",x:player.x,y:player.y-18,life:0,duration:750});const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";notice.innerHTML="<b>[HABILIDADE]</b> "+name+" recuperou "+heal+" de vida.";return;}const dist=Math.hypot(target.x-player.x,target.y-player.y),power=slot===0?1.8:2.7,damage=Math.round(def.damage*power+(equipment.weapon?4:0));if(chosenClass==="assassin"||chosenClass==="soldier"||chosenClass==="cavalry"){if(dist>def.range+18){playerMp+=cost;skillCooldowns[slot]=0;notice.innerHTML="<b>[HABILIDADE]</b> Você precisa se aproximar para usar "+name+".";return;}resolveHit(damage,target);effects.push({kind:"slash",x:target.x,y:target.y-12,life:0,duration:360});}else{const style=def.style==="arrow"?"arrow":def.style==="holy"?"holy":"magic";fireProjectile(style,damage,target);effects.push({kind:"ring",x:target.x,y:target.y-8,life:0,duration:550});}attackState=1;notice.innerHTML="<b>[HABILIDADE]</b> "+name+"!";}
function drawEffects(dt,t){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life+=dt;const p=Math.min(1,e.life/e.duration);if(e.kind==="number"){ctx.save();ctx.globalAlpha=1-p;ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#18251d";ctx.strokeText(e.text,e.x,e.y-p*28);ctx.fillStyle="#ffe39a";ctx.fillText(e.text,e.x,e.y-p*28);ctx.restore();}else if(e.kind==="heal"){ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle="#8df0b0";ctx.shadowColor="#8df0b0";ctx.shadowBlur=14;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,8+p*26,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#b9ffd0";ctx.font="bold 14px Arial";ctx.textAlign="center";ctx.fillText("+"+(chosenClass==="priest"?32:16),e.x,e.y-18-p*20);ctx.restore();}else if(e.kind==="ring"||e.kind==="slash"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=1-p;ctx.strokeStyle=e.kind==="ring"?"#d7ffd9":"#fff0bd";ctx.lineWidth=e.kind==="ring"?3:5;ctx.beginPath();if(e.kind==="ring")ctx.arc(e.x,e.y,8+p*30,0,Math.PI*2);else ctx.arc(e.x,e.y,20+p*24,-1.1,1.1);ctx.stroke();ctx.restore();}else if(e.kind==="bolt"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="#91eaff";ctx.shadowColor="#58cfff";ctx.shadowBlur=15;ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+(e.tx-e.x)*p,e.y+(e.ty-e.y)*p);ctx.stroke();ctx.restore();}else{e.x+=e.vx;e.y+=e.vy;e.vy+=.02;ctx.save();ctx.globalAlpha=1-p;ctx.fillStyle=i%2?"#9ff3ff":"#c3a0ff";ctx.shadowBlur=8;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(e.x,e.y,3,3);ctx.restore();}if(p>=1)effects.splice(i,1);}}
const ambientMotes=Array.from({length:52},(_,i)=>({x:rand(i+500)*W,y:rand(i+900)*H,phase:rand(i+1300)*Math.PI*2,size:1+rand(i+1700)*2}));
function drawAtmosphere(t){
 // Animated river glints
 ctx.save();ctx.globalCompositeOperation="screen";
 for(let i=0;i<34;i++){const x=1710+rand(i+33)*165,y=(rand(i+89)*810+t*.012*(i%3+1))%810;ctx.globalAlpha=.12+.12*Math.sin(t/500+i);ctx.fillStyle="#b5e8e4";ctx.fillRect(x,y,8+rand(i+200)*15,2);}
 // Floating pollen and fireflies
 for(const m of ambientMotes){const x=m.x+Math.sin(t/1700+m.phase)*12,y=(m.y-t*(.006+m.size*.002)+H*2)%(H);const glow=.25+.35*(.5+.5*Math.sin(t/420+m.phase));ctx.globalAlpha=glow;ctx.fillStyle=m.size>2?"#f4d88b":"#d9edb0";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillRect(x,y,m.size,m.size);}
 ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
}
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.drawImage(world,0,0);drawAtmosphere(t);
 // firelight glow and ambient light pools
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]]){const g=ctx.createRadialGradient(x,y-8,2,x,y-8,55);g.addColorStop(0,"#ffd47a44");g.addColorStop(1,"#ffd47a00");ctx.fillStyle=g;ctx.fillRect(x-55,y-63,110,110);}
 const depthActors=[...scenery.filter(o=>o.x>camera.x-100&&o.x<camera.x+canvas.width+100&&o.y>camera.y-160&&o.y<camera.y+canvas.height+100).map(o=>({depth:o.depth,draw:()=>o.type==="tree"?drawTree(ctx,o.x,o.y,o.scale,o.seed):drawHouse(ctx,o.x,o.y,o.scale,o.kind)})),{depth:guardian.y,draw:()=>drawActor(guardian.x,guardian.y,"guardian",t)},...monsters.filter(m=>m.alive).map(m=>({depth:m.y,draw:()=>drawActor(m.x,m.y,"monster",t)})),{depth:player.y,draw:()=>drawActor(player.x,player.y,"player",t)}];depthActors.sort((a,b)=>a.depth-b.depth);for(const actor of depthActors)actor.draw();if(playerHitFlash>0){ctx.fillStyle="#ff555566";ctx.fillRect(player.x-20,player.y-52,40,56);}drawEffects(16,t);drawProjectiles(1/60);
 ctx.strokeStyle="#f7df9b99";ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.tx,player.ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffe19a";ctx.beginPath();ctx.arc(player.tx,player.ty,4+Math.sin(t/90)*2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe19a66";ctx.lineWidth=1;ctx.beginPath();ctx.arc(player.tx,player.ty,10+Math.sin(t/130)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
function frame(t){const dt=Math.min((t-(frame.last||t))/1000,.04);frame.last=t;for(const m of monsters){if(!m.alive){m.respawn=Math.max(0,m.respawn-dt);if(m.respawn===0){m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;}}}attackCooldown=Math.max(0,attackCooldown-((dt)||0));skillCooldowns=skillCooldowns.map(v=>Math.max(0,v-dt));slimeAttackCooldown=Math.max(0,slimeAttackCooldown-dt);playerHitFlash=Math.max(0,playerHitFlash-dt);attackState=Math.max(0,attackState-((dt)||0)*3.5);const dx=player.tx-player.x,dy=player.ty-player.y,d=Math.hypot(dx,dy);if(combatTarget){const target=monsters.find(m=>m.id===combatTarget&&m.alive);if(target){const cd=classData[chosenClass],dist=Math.hypot(target.x-player.x,target.y-player.y);if(dist>cd.range){const ratio=(dist-cd.range+5)/Math.max(1,dist);player.tx=target.x-(target.x-player.x)*ratio;player.ty=target.y-(target.y-player.y)*ratio;}else{player.tx=player.x;player.ty=player.y;if(attackCooldown<=0)attack();}}else combatTarget=null;}if(d>2){const step=Math.min(d,classData[chosenClass].speed*(player.running?1.48:1)*dt);player.x+=dx/d*step;player.y+=dy/d*step;player.step+=dt*9;}const nearby=monsters.find(m=>m.alive&&Math.hypot(m.x-player.x,m.y-player.y)<m.range);if(nearby&&slimeAttackCooldown<=0){slimeAttackCooldown=nearby.attackRate;playerHp=Math.max(0,playerHp-Math.max(1,nearby.damage-(equipment.armor)));playerHitFlash=.22;effects.push({kind:"number",x:player.x,y:player.y-48,text:"-"+Math.max(1,nearby.damage-(equipment.armor?3:0)),life:0,duration:750});notice.innerHTML="<b>[COMBATE]</b> "+nearby.name+" acertou você!";const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";}camera.x=Math.max(0,Math.min(W-canvas.width,player.x-canvas.width/2));camera.y=Math.max(0,Math.min(H-canvas.height,player.y-canvas.height/2));coords.textContent="X: "+Math.round(player.x)+" · Y: "+Math.round(player.y);draw(t);requestAnimationFrame(frame);}
const equipment={weapon:0,armor:0,charm:false,weaponName:"Arma inicial",armorName:"Armadura de viajante"};
const bag=[{id:"iron-sword",name:"Espada de Ferro",kind:"weapon",attack:4,defense:0},{id:"leather-armor",name:"Armadura de Couro",kind:"armor",attack:0,defense:3},{id:"health-potion",name:"Poção de Vida",kind:"consumable"}];
function renderInventory(){const goldLabel=document.querySelector("#gold-count");if(goldLabel)goldLabel.textContent=gold+" ouro";document.querySelector("#equip-weapon").textContent=equipment.weaponName;document.querySelector("#equip-armor").textContent=equipment.armorName;document.querySelector("#equip-charm").textContent="Amuleto simples";document.querySelector("#equipment-bonus").textContent="Bônus: +"+equipment.weapon+" ATQ · +"+equipment.armor+" DEF";document.querySelector("#bag-count").textContent=bag.length+" / 24";document.querySelector("#bag-grid").innerHTML=bag.map(item=>`<button data-item="${item.id}" class="${(item.kind==="weapon"&&equipment.weapon===item.attack)||(item.kind==="armor"&&equipment.armor===item.defense)?"equipped":""}"><span>${item.icon||(item.kind==="weapon"?"⚔":item.kind==="armor"?"🛡":"🧪")}</span><b>${item.name}</b><small>${item.kind==="weapon"?"+"+item.attack+" ATQ":item.kind==="armor"?"+"+item.defense+" DEF":item.kind==="consumable"?"Consumível":"Material"}</small></button>`).join("");}
function toggleInventory(open){const el=document.querySelector("#inventory");el.classList.toggle("visible",open);el.setAttribute("aria-hidden",String(!open));if(open)renderInventory();}
function useBagItem(id){const item=bag.find(x=>x.id===id);if(!item)return;if(item.kind==="weapon"){equipment.weapon=equipment.weapon===item.attack?0:item.attack;equipment.weaponName=equipment.weapon===0?"Arma inicial":item.name;notice.innerHTML="<b>[EQUIPAMENTO]</b> "+(equipment.weapon?item.name+" equipada (+"+item.attack+" ATQ).":"Arma removida.");}else if(item.kind==="armor"){equipment.armor=equipment.armor===item.defense?0:item.defense;equipment.armorName=equipment.armor===0?"Armadura de viajante":item.name;notice.innerHTML="<b>[EQUIPAMENTO]</b> "+(equipment.armor?item.name+" equipada (+"+item.defense+" DEF).":"Armadura removida.");}else if(item.kind==="consumable"){const heal=Math.min(maxPlayerHp()-playerHp,45);if(heal<=0){notice.innerHTML="<b>[INVENTÁRIO]</b> Sua vida já está cheia.";return;}playerHp+=heal;bag.splice(bag.indexOf(item),1);notice.innerHTML="<b>[INVENTÁRIO]</b> Poção usada: +"+heal+" de vida.";const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";}renderInventory();}
document.querySelector("#inventory-open").addEventListener("click",()=>toggleInventory(true));document.querySelector("#inventory-close").addEventListener("click",()=>toggleInventory(false));document.querySelector("#inventory").addEventListener("click",e=>{if(e.target.id==="inventory")toggleInventory(false);});document.querySelector("#bag-grid").addEventListener("click",e=>{const btn=e.target.closest("button[data-item]");if(btn)useBagItem(btn.dataset.item);});

function chooseClass(id){if(!classData[id])return;chosenClass=id;const d=classData[id];playerHp=maxPlayerHp();playerMp=maxPlayerMp();document.querySelector("#class-name").textContent=d.name.toUpperCase()+" · NÍVEL "+playerLevel;document.querySelector("#skill-1").title=skillNames[id][0]+" (1)";document.querySelector("#skill-2").title=skillNames[id][1]+" (2)";document.querySelector("#skill-3").title=skillNames[id][2]+" (3)";document.querySelectorAll(".class-choice").forEach(b=>b.classList.toggle("selected",b.dataset.class===id));document.querySelector(".profile-chip small").textContent="Nível "+playerLevel+" · "+d.name;const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";const mpText=document.querySelectorAll(".stat-label b")[1];if(mpText)mpText.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";const hpBar=document.querySelector(".hp i"),mpBar=document.querySelector(".mp i");if(hpBar)hpBar.style.width="100%";if(mpBar)mpBar.style.width="100%";document.querySelector(".profile-icon").textContent=id==="mage"?"✦":id==="priest"?"✚":id==="longbowman"?"➶":id==="cavalry"?"♞":id==="assassin"?"🗡":"🛡";notice.innerHTML="<b>[CLASSE]</b> Classe alterada para "+d.name+". Experimente caminhar e atacar o Slime.";}
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width+camera.x,y:(e.clientY-r.top)*canvas.height/r.height+camera.y};}
canvas.addEventListener("click",e=>{const p=pointer(e);if(Math.hypot(p.x-guardian.x,p.y-guardian.y)<45){questState.guardian=true;updateQuestUI();notice.innerHTML="<b>[GUARDIÃO]</b> Bem-vindo! Derrote 3 Slimes, 1 Lobo e 1 Esqueleto para provar seu valor.";if(questState.slimes>=3&&questState.wolf&&questState.skeleton&&!questState.claimed){questState.claimed=true;gold+=100;awardExperience(100);notice.innerHTML="<b>[MISSÃO CONCLUÍDA]</b> +100 ouro e +100 EXP!";}renderInventory();return;}const clicked=monsters.find(m=>m.alive&&Math.hypot(p.x-m.x,p.y-m.y)<58);if(clicked){activeMonster=clicked;if(clicked.id==="slime"&&questState.slimes===0)notice.innerHTML="<b>[MISSÃO]</b> Slimes encontrados. Derrote 3 para avançar.";attack();return;}player.tx=Math.max(20,Math.min(W-20,p.x));player.ty=Math.max(20,Math.min(H-20,p.y));notice.innerHTML="<b>[MUNDO]</b> Você está explorando as trilhas de Eldoria.";});
function center(){player.tx=player.x;player.ty=player.y;notice.innerHTML="<b>[SISTEMA]</b> Personagem centralizado.";}
function help(){notice.innerHTML="<b>[AJUDA]</b> Clique no terreno para caminhar; clique nos monstros para atacar. Use 1, 2 e 3 para habilidades, I para inventário e Shift para correr. Monstros derrotados retornam após 18 segundos.";}
document.querySelectorAll(".class-choice").forEach(b=>b.addEventListener("click",()=>chooseClass(b.dataset.class)));document.querySelector("#attack").addEventListener("click",attack);document.querySelector("#skill-1").addEventListener("click",()=>castSkill(0));document.querySelector("#skill-2").addEventListener("click",()=>castSkill(1));document.querySelector("#skill-3").addEventListener("click",()=>castSkill(2));document.querySelector("#center").addEventListener("click",center);document.querySelector("#center-side").addEventListener("click",center);document.querySelector("#help").addEventListener("click",help);document.querySelector("#quest-help").addEventListener("click",help);window.addEventListener("keydown",e=>{if(e.key==="Shift")player.running=true;if(e.key.toLowerCase()==="h")help();if(e.key.toLowerCase()==="i")toggleInventory(true);if(e.key==="Escape")toggleInventory(false);if(e.code==="Space"){e.preventDefault();attack();}if(["1","2","3"].includes(e.key))castSkill(Number(e.key)-1);});window.addEventListener("keyup",e=>{if(e.key==="Shift")player.running=false;});
updateQuestUI();renderInventory();requestAnimationFrame(frame);
})();