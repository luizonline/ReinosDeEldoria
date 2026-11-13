(() => {
"use strict";
const canvas=document.querySelector("#world"),ctx=canvas.getContext("2d"),notice=document.querySelector("#notice"),coords=document.querySelector("#coords");
ctx.imageSmoothingEnabled=false;
const W=4200,H=3000,camera={x:0,y:0};
const player={x:520,y:500,tx:520,ty:500,step:0,running:false};
const guardian={x:760,y:390},slime={x:1240,y:720};
const scenery=[];
const heroSprite=new Image(),slimeSprite=new Image();
heroSprite.src="assets/sprites/player-walk.svg";slimeSprite.src="assets/sprites/slime-idle.svg";
const mageEldoriaSprite=new Image();mageEldoriaSprite.src="assets/classes/mage-eldoria.svg";
const mageEldoriaSheet=new Image();mageEldoriaSheet.src="assets/classes/mage-eldoria-sheet.svg";
const effects=[];
const classData={soldier:{name:"Soldado",hp:130,mp:35,damage:14,speed:185,range:52,cooldown:.72,color:"#547c9b",accent:"#c5d5dc",weapon:"sword",style:"melee"},assassin:{name:"Assassino",hp:85,mp:45,damage:19,speed:235,range:48,cooldown:.58,color:"#294d87",accent:"#51c9d5",weapon:"dagger",style:"melee"},mage:{name:"Mago",hp:75,mp:110,damage:24,speed:175,range:300,cooldown:1.05,color:"#9b3041",accent:"#c69aff",weapon:"staff",style:"magic"},priest:{name:"Clérigo",hp:100,mp:100,damage:15,speed:180,range:230,cooldown:1.15,color:"#d5d8d0",accent:"#c84e55",weapon:"staff",style:"holy"},longbowman:{name:"Arqueiro",hp:90,mp:55,damage:17,speed:205,range:245,cooldown:.95,color:"#8a7047",accent:"#c5a66a",weapon:"bow",style:"arrow"},cavalry:{name:"Cavalaria",hp:145,mp:40,damage:17,speed:195,range:60,cooldown:.82,color:"#456f85",accent:"#d6dbe0",weapon:"lance",style:"melee"}};
let chosenClass="soldier",attackState=0,attackCooldown=0,combatTarget=null,playerHp=130,playerMp=35,playerXp=0,playerLevel=1,xpToNext=100,gold=0,monsterHp=60,monsterAlive=true,slimeAttackCooldown=2.2,playerHitFlash=0,activeMonster=null,skillCooldowns=[0,0,0],questState={guardian:false,slimes:0,wolf:false,skeleton:false,claimed:false},attributePoints=0,attributes={strength:0,agility:0,intelligence:0,vitality:0};
const monsters=[{id:"slime",name:"Slime Verde",x:1240,y:720,hp:60,maxHp:60,damage:7,range:52,attackRate:2.4,alive:true,kind:"slime",xp:25,respawn:0,spawnX:1240,spawnY:720},{id:"wolf",name:"Lobo Cinzento",x:1510,y:970,hp:105,maxHp:105,damage:11,range:58,attackRate:1.8,alive:true,kind:"wolf",xp:40,respawn:0,spawnX:1510,spawnY:970},{id:"skeleton",name:"Esqueleto",x:930,y:1210,hp:135,maxHp:135,damage:13,range:62,attackRate:2.1,alive:true,kind:"skeleton",xp:55,respawn:0,spawnX:930,spawnY:1210}];activeMonster=monsters[0];
// Grupos adicionais de criaturas distribuídos pelas novas regiões exploráveis
const extraSpawns=[
 ["slime","Slime Musgoso",680,1320],["slime","Slime do Bosque",1120,1580],["slime","Slime da Clareira",1780,520],["slime","Slime da Margem",2050,1180],["slime","Slime Antigo",2480,1480],["slime","Slime Selvagem",3320,1780],
 ["wolf","Lobo da Floresta",580,1450],["wolf","Lobo Sombrio",1580,1320],["wolf","Lobo da Colina",2260,720],["wolf","Lobo Errante",2860,1680],["wolf","Lobo Alfa",3560,2250],
 ["skeleton","Esqueleto Errante",820,1850],["skeleton","Guardião Ósseo",1900,1980],["skeleton","Esqueleto Antigo",2640,2240],["skeleton","Cavaleiro Caído",3280,2520]
];
for(let i=0;i<extraSpawns.length;i++){const [kind,name,x,y]=extraSpawns[i],base=kind==="slime"?60:kind==="wolf"?105:135;monsters.push({id:kind+"-roam-"+i,name,x,y,hp:base,maxHp:base,damage:kind==="slime"?8:kind==="wolf"?12:14,range:kind==="slime"?48:kind==="wolf"?58:62,attackRate:kind==="slime"?2.5:kind==="wolf"?1.9:2.1,alive:true,kind,xp:kind==="slime"?25:kind==="wolf"?40:55,respawn:0,spawnX:x,spawnY:y});}
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
const pathPoints=[[0,570],[250,560],[440,610],[650,570],[850,660],[1040,740],[1240,730],[1440,770],[1660,720],[1840,810],[2030,850],[2400,900],[2700,1080],[3000,1260],[3300,1420],[3600,1660],[3900,1900],[4200,2100]];
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
 // Reflexos, espuma e vegetação nas margens
 for(let i=0;i<60;i++){const x=1700+rand(i+22)*180,y=rand(i+400)*810;c.fillStyle="#bce8db";c.globalAlpha=.12+rand(i+900)*.15;c.fillRect(x,y,10+rand(i)*18,2);c.globalAlpha=1;}
 for(let i=0;i<48;i++){
  const side=i%2?1685:1900, y=rand(i+720)*820, x=side+Math.sin(y/105)*35;
  c.save();c.translate(x,y);c.rotate((rand(i+88)-.5)*.7);
  c.strokeStyle=i%3?"#527b48":"#799454";c.lineWidth=2;c.beginPath();c.moveTo(0,8);c.quadraticCurveTo(-4,-2,-2,-13-rand(i+5)*9);c.moveTo(0,8);c.quadraticCurveTo(5,-1,7,-10-rand(i+8)*10);c.stroke();
  c.restore();
 }
 // Pedras e pequenas manchas úmidas na margem
 for(let i=0;i<38;i++){const x=1680+rand(i+100)*230,y=rand(i+300)*840;c.fillStyle=i%2?"#8d9278":"#a6a38a";c.globalAlpha=.35;c.beginPath();c.ellipse(x,y,3+rand(i)*5,2+rand(i+7)*3,rand(i+9),0,Math.PI*2);c.fill();c.globalAlpha=1;}
 // Cliff wall on eastern edge
 for(let y=120;y<1500;y+=48){const x=2100+Math.sin(y/130)*70;c.fillStyle="#61412f";c.fillRect(x,y,300,50);c.fillStyle="#805337";c.fillRect(x+8,y+5,292,38);c.fillStyle="#a06a43";c.fillRect(x+5,y+4,290,5);for(let k=0;k<5;k++){c.fillStyle="#563b2c";c.fillRect(x+20+k*45,y+20+rand(y+k)*18,18,5);}}
}
function drawTree(c,x,y,s=1,seed=0){
 c.save();c.translate(x,y);c.scale(s,s);
 // Sombra projetada e raízes para dar volume ao cenário
 c.fillStyle="#17271f66";c.beginPath();c.ellipse(5,19,31,13,-.12,0,Math.PI*2);c.fill();
 c.fillStyle="#4a3527";c.beginPath();c.moveTo(-7,4);c.lineTo(-10,25);c.lineTo(-4,29);c.lineTo(0,18);c.lineTo(6,29);c.lineTo(11,25);c.lineTo(7,3);c.closePath();c.fill();
 c.strokeStyle="#8a6240";c.lineWidth=3;c.beginPath();c.moveTo(0,15);c.lineTo(-15,27);c.moveTo(3,16);c.lineTo(18,25);c.stroke();
 const canopy=[
  [-18,-13,19,"#244d35"],[5,-17,23,"#2d603b"],[23,-8,17,"#326b40"],
  [-27,1,14,"#326b3e"],[-5,1,23,"#397849"],[17,4,18,"#28613a"],
  [-8,-34,17,"#4c8950"],[12,-34,15,"#559653"],[-23,-28,13,"#3c7946"],
  [0,-23,20,"#43834a"]
 ];
 for(let i=0;i<canopy.length;i++){
  const [ox,oy,r,col]=canopy[i];
  const g=c.createRadialGradient(ox-r*.35,oy-r*.55,2,ox,oy,r*1.35);
  g.addColorStop(0,i%3===0?"#80ad5b":i%3===1?"#659c50":"#477f47");
  g.addColorStop(.58,col);g.addColorStop(1,"#1d4932");
  c.fillStyle=g;c.beginPath();c.arc(ox,oy,r,0,Math.PI*2);c.fill();
 }
 // Folhas iluminadas e pequenas aberturas entre os galhos
 for(let i=0;i<34;i++){
  const a=rand(seed*31+i)*Math.PI*2,rad=Math.sqrt(rand(seed*71+i+9))*27;
  const lx=Math.cos(a)*rad,ly=Math.sin(a)*rad-18;
  c.fillStyle=i%4===0?"#a4c96a":i%3===0?"#78ad58":"#376f40";
  c.globalAlpha=.55+rand(seed+i)*.35;c.beginPath();c.ellipse(lx,ly,2+rand(i+seed)*3,1.5+rand(i+seed+90)*2,a,0,Math.PI*2);c.fill();
 }
 c.globalAlpha=1;
 // Luz suave no topo da copa
 const glow=c.createRadialGradient(-9,-38,1,-9,-28,34);glow.addColorStop(0,"#d2e79b30");glow.addColorStop(1,"#d2e79b00");
 c.fillStyle=glow;c.beginPath();c.arc(-9,-28,34,0,Math.PI*2);c.fill();
 c.restore();
}
function drawHouse(c,x,y,scale=1,kind=0){
 c.save();c.translate(x,y);c.scale(scale,scale);
 const w=kind?190:160,h=105;
 // Sombra de contato e fundação de pedra
 c.fillStyle="#17241e88";c.beginPath();c.ellipse(w/2+8,h+17,w*.68,19,0,0,Math.PI*2);c.fill();
 c.fillStyle="#625846";c.fillRect(-5,h-5,w+10,13);
 for(let i=0;i<Math.ceil(w/18);i++){c.fillStyle=i%2?"#928a73":"#aaa087";c.fillRect(i*18-3,h-4,15,8);c.strokeStyle="#514c40";c.lineWidth=1;c.strokeRect(i*18-3,h-4,15,8);}
 // Paredes em madeira e reboco com luz lateral
 const wall=c.createLinearGradient(0,15,w,100);wall.addColorStop(0,"#e4d3a9");wall.addColorStop(.55,"#cdbb91");wall.addColorStop(1,"#9e8c6a");
 c.fillStyle="#493728";c.fillRect(4,16,w,h-12);
 c.fillStyle=wall;c.fillRect(8,22,w-16,h-28);
 // Estrutura de madeira aparente
 c.fillStyle="#5b3d2a";c.fillRect(8,22,9,h-28);c.fillRect(w-17,22,9,h-28);c.fillRect(w/2-4,22,8,h-28);c.fillRect(8,58,w-16,7);
 c.strokeStyle="#8c6845";c.lineWidth=3;c.beginPath();c.moveTo(18,28);c.lineTo(w/2-8,55);c.moveTo(w/2+8,55);c.lineTo(w-18,28);c.stroke();
 // Telhado com duas águas e textura de telhas
 c.fillStyle="#302d2a";c.beginPath();c.moveTo(-20,25);c.lineTo(w/2,-61);c.lineTo(w+20,25);c.closePath();c.fill();
 const roof=c.createLinearGradient(0,-55,0,28);roof.addColorStop(0,kind?"#68705a":"#777064");roof.addColorStop(1,"#353b35");
 c.fillStyle=roof;c.beginPath();c.moveTo(-10,21);c.lineTo(w/2,-51);c.lineTo(w+10,21);c.closePath();c.fill();
 for(let row=0;row<5;row++){
  const yy=-38+row*12,spread=(row+1)*10;
  c.strokeStyle=row%2?"#a19a7e":"#8a8068";c.globalAlpha=.55;c.lineWidth=2;
  c.beginPath();c.moveTo(w/2-spread,yy+9);c.lineTo(w/2,yy-8);c.lineTo(w/2+spread,yy+9);c.stroke();
 }
 c.globalAlpha=1;c.strokeStyle="#b0a184";c.lineWidth=2;c.beginPath();c.moveTo(-10,21);c.lineTo(w/2,-51);c.lineTo(w+10,21);c.stroke();
 // Porta, janelas com reflexo e molduras
 c.fillStyle="#3e3027";c.fillRect(w*.43,68,32,44);c.fillStyle="#795638";c.fillRect(w*.43+4,72,24,40);c.fillStyle="#b18a50";c.fillRect(w*.43+22,89,3,3);
 for(const wx of [23,w-48]){
  c.fillStyle="#4a3528";c.fillRect(wx-3,36,32,31);c.fillStyle="#8f7954";c.fillRect(wx,39,26,25);
  const glass=c.createLinearGradient(wx,40,wx+24,62);glass.addColorStop(0,"#b9e0d6");glass.addColorStop(1,"#477e83");
  c.fillStyle=glass;c.fillRect(wx+3,42,20,19);c.fillStyle="#d9c69b";c.fillRect(wx+12,42,3,19);c.fillRect(wx+3,50,20,3);
 }
 // Beiral e pequenos detalhes de construção
 c.fillStyle="#493728";c.fillRect(-8,18,w+16,6);c.fillStyle="#9a754b";c.fillRect(-5,18,w+10,2);
 c.fillStyle="#d7b86e";c.beginPath();c.arc(w-25,78,2.5,0,Math.PI*2);c.fill();
 c.restore();
}
function drawDecoration(c,x,y,type,seed){c.save();c.translate(x,y);if(type==="torch"){c.fillStyle="#60472d";c.fillRect(-3,-1,6,26);c.fillStyle="#e18a37";c.beginPath();c.arc(0,-5,7,0,Math.PI*2);c.fill();c.fillStyle="#ffe18a";c.beginPath();c.arc(0,-7,3,0,Math.PI*2);c.fill();}else if(type==="flower"){c.fillStyle="#2c623b";c.fillRect(-1,0,2,10);c.fillStyle=seed%2?"#e9a3ca":"#f4d36f";for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.beginPath();c.arc(Math.cos(a)*4,-3+Math.sin(a)*4,2.5,0,Math.PI*2);c.fill();}}else{c.fillStyle="#827e70";c.fillRect(-5,0,11,6);c.fillStyle="#b2aa91";c.fillRect(-3,-3,6,4);}c.restore();}
function buildWorld(){
 const off=document.createElement("canvas");off.width=W;off.height=H;const c=off.getContext("2d");c.imageSmoothingEnabled=false;
 drawGround(c);
 scenery.push({type:"house",x:420,y:900,scale:1.12,kind:1,depth:1008},{type:"house",x:1480,y:320,scale:.95,kind:0,depth:420},{type:"house",x:1040,y:1130,scale:.82,kind:1,depth:1216});
 // Trees clustered around clearings, river and paths
 for(let i=0;i<1180;i++){let x=rand(i+5)*W,y=rand(i+805)*H;const nearRoad=roadDistance(x,y)<92,nearSquare=Math.hypot((x-760)/1.1,(y-390))<180,nearHouse=[ [420,900],[1480,320],[1040,1130] ].some(([hx,hy])=>Math.abs(x-hx)<155&&Math.abs(y-hy)<145),inRiver=x>1660&&x<1950&&y<870;
 if(!nearRoad&&!nearSquare&&!nearHouse&&!inRiver&&!(x>2050)){const scale=.62+rand(i+1300)*.7;scenery.push({type:"tree",x,y,scale,depth:y+17*scale,seed:i});}
 }
 // More deliberate forest edge clusters
 for(let i=0;i<210;i++){let x=rand(i+1800)*W,y=rand(i+2400)*H;if(Math.hypot(x-760,y-390)>185&&roadDistance(x,y)>95){const scale=.9+rand(i+2600)*.45;scenery.push({type:"tree",x,y,scale,depth:y+17*scale,seed:i+700});}}
 for(let i=0;i<420;i++){let x=rand(i+3000)*W,y=rand(i+3600)*H;if(roadDistance(x,y)>85&&Math.hypot(x-760,y-390)>165)drawDecoration(c,x,y,i%5===0?"stone":"flower",i);}
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]])drawDecoration(c,x,y,"torch",0);
 // Fountain in the village square
 c.fillStyle="#59665f";c.fillRect(744,365,32,35);c.fillStyle="#b5c6c0";c.fillRect(749,360,22,30);c.fillStyle="#65a9b4";c.beginPath();c.arc(760,358,12,0,Math.PI*2);c.fill();c.fillStyle="#dce8d8";c.fillRect(757,340,6,20);
 return off;
}
const world=buildWorld();
function label(text,x,y,color="#f5f0d7"){ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#243226";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawPixelHero(x,y,t){
 const d=classData[chosenClass],dx=player.tx-player.x,dy=player.ty-player.y;
 const moving=Math.hypot(dx,dy)>3;
 const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
 const phase=moving?t/78:t/360,bob=moving?Math.abs(Math.sin(phase))*2.4:Math.sin(phase)*.7;
 const stride=moving?Math.sin(phase)*5:0,attack=attackState>0?Math.sin((1-attackState)*Math.PI):0;
 const skin="#d6a982",metal="#aebdc5",dark="#18232b";
 ctx.save();ctx.translate(Math.round(x),Math.round(y+bob));if(direction==="left")ctx.scale(-1,1);ctx.scale(1.24,1.24);
 // Refinamento de silhueta: luz de recorte, placas sobrepostas e detalhes de metal
 ctx.save();ctx.globalCompositeOperation="screen";const rim=ctx.createRadialGradient(-7,-39,1,0,-28,36);rim.addColorStop(0,"#fff3cf30");rim.addColorStop(1,"#fff3cf00");ctx.fillStyle=rim;ctx.beginPath();ctx.ellipse(0,-25,19,34,0,0,Math.PI*2);ctx.fill();ctx.restore();
 // sombra e pernas articuladas
 ctx.fillStyle="#101b1b88";ctx.beginPath();ctx.ellipse(0,13,17,6,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#342e2a";ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(-10+stride,-1);ctx.lineTo(-11+stride,10);ctx.lineTo(-3+stride,11);ctx.lineTo(0,1);ctx.lineTo(4-stride,11);ctx.lineTo(12-stride,10);ctx.lineTo(9,-5);ctx.closePath();ctx.fill();
 ctx.fillStyle="#6b5948";ctx.fillRect(-11+stride,7,9,5);ctx.fillRect(2-stride,7,9,5);
 ctx.fillStyle="#b4a17e";ctx.fillRect(-12+stride,11,11,3);ctx.fillRect(2-stride,11,11,3);
 // capa com volume e movimento
 ctx.fillStyle="#17252e";ctx.beginPath();ctx.moveTo(-12,-25);ctx.lineTo(12,-25);ctx.lineTo(17,-3);ctx.lineTo(9,5);ctx.lineTo(-10,4);ctx.lineTo(-17,-3);ctx.closePath();ctx.fill();
 ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(-10,-25);ctx.lineTo(10,-25);ctx.lineTo(13,-5);ctx.lineTo(7,1);ctx.lineTo(-8,1);ctx.lineTo(-13,-5);ctx.closePath();ctx.fill();
 ctx.strokeStyle=d.accent;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(0,-2);ctx.stroke();
 // torso, ombreiras e couraça
 const armor=ctx.createLinearGradient(-11,-27,11,-5);armor.addColorStop(0,"#d0d4cf");armor.addColorStop(.35,d.accent);armor.addColorStop(1,d.color);
 ctx.fillStyle=dark;ctx.beginPath();ctx.roundRect(-12,-29,24,25,6);ctx.fill();
 ctx.fillStyle=armor;ctx.beginPath();ctx.moveTo(-9,-27);ctx.lineTo(9,-27);ctx.lineTo(11,-8);ctx.lineTo(0,-4);ctx.lineTo(-11,-8);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#27343a";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(0,-8);ctx.stroke();
 ctx.fillStyle="#d8b66e";ctx.fillRect(-7,-10,14,3);ctx.fillRect(-2,-18,4,7);
 // Placa central em relevo, rebites e filetes de luz
 const plate=ctx.createLinearGradient(-7,-25,7,-8);plate.addColorStop(0,"#f0e6c8");plate.addColorStop(.35,"#b8c7c8");plate.addColorStop(1,"#657d88");
 ctx.fillStyle=plate;ctx.beginPath();ctx.moveTo(-5,-24);ctx.lineTo(5,-24);ctx.lineTo(6,-11);ctx.lineTo(0,-7);ctx.lineTo(-6,-11);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#f2d18a";ctx.lineWidth=.8;ctx.stroke();
 ctx.fillStyle="#f6dda0";for(const px of [-8,8]){ctx.beginPath();ctx.arc(px,-21,1.2,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle="#ffffff88";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-25);ctx.lineTo(-4,-27);ctx.moveTo(7,-25);ctx.lineTo(4,-27);ctx.stroke();
 // Cinto, fivela e bolsas laterais
 ctx.fillStyle="#4a3024";ctx.fillRect(-9,-7,18,3);ctx.fillStyle="#e4c078";ctx.fillRect(-2,-8,5,5);ctx.fillStyle="#5a4732";ctx.fillRect(-1,-7,3,3);
 ctx.fillStyle="#5a4030";ctx.fillRect(-12,-5,4,6);ctx.fillRect(8,-5,4,6);
 ctx.fillStyle=metal;ctx.beginPath();ctx.ellipse(-11,-24,5,5,-.4,0,Math.PI*2);ctx.ellipse(11,-24,5,5,.4,0,Math.PI*2);ctx.fill();
 // braços e luvas
 ctx.strokeStyle=dark;ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-11,-23);ctx.lineTo(-15,-12);ctx.moveTo(11,-23);ctx.lineTo(15+attack*5,-13-attack*5);ctx.stroke();
 ctx.strokeStyle=skin;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-15,-14);ctx.lineTo(-15,-10);ctx.moveTo(15+attack*5,-14-attack*5);ctx.lineTo(15+attack*5,-10-attack*5);ctx.stroke();
 // cabeça e elmo individualizado por classe
 ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-34,8,9,0,0,Math.PI*2);ctx.fill();
 const helm=chosenClass==="assassin"?"#1b3b62":chosenClass==="mage"?"#7f293b":chosenClass==="priest"?"#d7d6c8":chosenClass==="longbowman"?"#765332":chosenClass==="cavalry"?"#526979":"#59636a";
 ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(0,-37,10,9,0,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillStyle=helm;ctx.beginPath();ctx.ellipse(0,-38,9,8,Math.PI,0,Math.PI);ctx.fill();
 if(chosenClass==="mage"||chosenClass==="priest"){
  ctx.fillStyle=helm;ctx.beginPath();ctx.moveTo(-9,-42);ctx.lineTo(0,-57);ctx.lineTo(9,-42);ctx.closePath();ctx.fill();
  ctx.fillStyle=d.accent;ctx.beginPath();ctx.arc(0,-50,2.5,0,Math.PI*2);ctx.fill();
 }else{
  ctx.fillStyle=metal;ctx.fillRect(-8,-38,16,3);ctx.fillStyle="#1b2830";ctx.fillRect(-5,-36,10,3);
  if(chosenClass==="cavalry"){ctx.fillStyle="#9b3e43";ctx.beginPath();ctx.moveTo(0,-45);ctx.lineTo(2,-56);ctx.lineTo(5,-45);ctx.fill();}
 }
 if(direction!=="up"){ctx.fillStyle="#171f25";ctx.fillRect(-4,-34,2,2);ctx.fillRect(3,-34,2,2);}
 // arma com brilho metálico e animação de ataque
 ctx.save();ctx.translate(15,-15);ctx.rotate(-.25-attack*1.1);
 if(d.weapon==="sword"||d.weapon==="dagger"||d.weapon==="lance"){
  ctx.strokeStyle="#49372b";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1,-11);ctx.stroke();
  ctx.strokeStyle="#d8c9a6";ctx.lineWidth=d.weapon==="lance"?3:2.5;ctx.beginPath();ctx.moveTo(1,-10);ctx.lineTo(d.weapon==="lance"?4:-1,-40);ctx.stroke();
  ctx.strokeStyle="#f5e9ca";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2,-14);ctx.lineTo(1,-36);ctx.stroke();
  ctx.strokeStyle="#c69c58";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-4,-10);ctx.lineTo(5,-10);ctx.stroke();
  ctx.save();ctx.globalCompositeOperation="screen";ctx.strokeStyle="#fff0c4";ctx.shadowColor="#f6d58b";ctx.shadowBlur=8;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(1,-13);ctx.lineTo(0,-36);ctx.stroke();ctx.restore();
 }else if(d.weapon==="staff"){
  ctx.strokeStyle="#6c4b36";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,-42);ctx.stroke();
  const orb=chosenClass==="priest"?"#fff0a6":"#b89aff";ctx.fillStyle=orb;ctx.shadowColor=orb;ctx.shadowBlur=attackState>0?22:9;ctx.beginPath();ctx.arc(0,-45,5+attack*.8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 }else{
  ctx.strokeStyle="#6c4b36";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-23,12,-1.25,1.25);ctx.stroke();ctx.strokeStyle="#d8c9a6";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(0,-11);ctx.stroke();
 }
 ctx.restore();ctx.restore();
}
function drawSlime(x,y,t,hp=monsterHp,name="Slime Verde"){
 const phase=t/170,hop=Math.max(0,Math.sin(phase))*5,squash=1+Math.sin(phase*2)*.08;
 ctx.save();ctx.translate(x,y-hop);ctx.scale(squash,1/squash);
 ctx.fillStyle="#142d2188";ctx.beginPath();ctx.ellipse(0,7,22,6,0,0,Math.PI*2);ctx.fill();
 const g=ctx.createRadialGradient(-7,-16,2,0,-9,28);g.addColorStop(0,"#b9ffd1");g.addColorStop(.48,"#55d98a");g.addColorStop(1,"#168653");
 ctx.fillStyle=g;ctx.strokeStyle="#14563a";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-21,2);ctx.quadraticCurveTo(-26,-17,-12,-25);ctx.quadraticCurveTo(0,-34,13,-24);ctx.quadraticCurveTo(27,-14,21,2);ctx.quadraticCurveTo(0,13,-21,2);ctx.fill();ctx.stroke();
 ctx.fillStyle="#e7fff0";ctx.beginPath();ctx.ellipse(-8,-13,4,6,0,0,Math.PI*2);ctx.ellipse(8,-13,4,6,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#173b30";ctx.fillRect(-8,-13,3,4);ctx.fillRect(7,-13,3,4);
 ctx.strokeStyle="#174c36";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-5,5,.15,Math.PI-.15);ctx.stroke();
 ctx.fillStyle="#d6ffe1";ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(-11,-22,4,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle="#26352d";ctx.fillRect(x-24,y-43-hop,48,6);ctx.fillStyle="#d94f58";ctx.fillRect(x-23,y-42-hop,46*Math.max(0,hp/60),4);
 label(name,x,y-49-hop,"#caffc8");
}
function drawMonster(m,t){
 if(!m.alive)return;
 if(m.kind==="slime"){drawSlime(m.x,m.y,t,m.hp,m.name);return;}
 const moving=Math.sin(t/(m.kind==="wolf"?95:175)),bob=moving*1.8;
 ctx.save();ctx.translate(m.x,m.y+bob);ctx.scale(1.18,1.18);
 ctx.fillStyle="#101b1a88";ctx.beginPath();ctx.ellipse(0,6,m.kind==="wolf"?24:18,7,0,0,Math.PI*2);ctx.fill();
 if(m.kind==="wolf"){
  // Lobo: dorso, patas, focinho, orelhas e pelo em camadas
  ctx.strokeStyle="#303b43";ctx.lineWidth=6;ctx.lineCap="round";ctx.beginPath();
  ctx.moveTo(-12,-11);ctx.lineTo(-16,1+moving*2);ctx.moveTo(8,-10);ctx.lineTo(13,1-moving*2);ctx.stroke();
  const fur=ctx.createLinearGradient(-12,-32,14,-4);fur.addColorStop(0,"#89949b");fur.addColorStop(.45,"#586773");fur.addColorStop(1,"#303d48");
  ctx.fillStyle=fur;ctx.beginPath();ctx.ellipse(-1,-16,22,12,-.12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#657681";ctx.beginPath();ctx.ellipse(14,-25,12,9,.25,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#303b43";ctx.beginPath();ctx.moveTo(7,-29);ctx.lineTo(5,-43);ctx.lineTo(16,-32);ctx.lineTo(20,-42);ctx.lineTo(24,-28);ctx.closePath();ctx.fill();
  ctx.fillStyle="#b7c0c0";ctx.beginPath();ctx.ellipse(23,-20,8,5,.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#242b30";ctx.beginPath();ctx.arc(29,-20,2.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e8c56d";ctx.shadowColor="#e8c56d";ctx.shadowBlur=7;ctx.beginPath();ctx.arc(16,-27,2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle="#252e34";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,-16);ctx.lineTo(26,-15);ctx.stroke();
  ctx.strokeStyle="#a9b2b6";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-13,-23);ctx.lineTo(-21,-29);ctx.moveTo(-9,-27);ctx.lineTo(-16,-34);ctx.stroke(); 
  // Mechas de pelo, sobrancelha e focinho com luz lateral
  ctx.strokeStyle="#c1cbd0";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-13,-25);ctx.lineTo(-19,-28);ctx.moveTo(-8,-29);ctx.lineTo(-13,-35);ctx.moveTo(-2,-27);ctx.lineTo(-5,-33);ctx.stroke();
  ctx.fillStyle="#e2e8e5";ctx.beginPath();ctx.ellipse(22,-22,5,2.5,.15,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#202a31";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(13,-30);ctx.quadraticCurveTo(17,-33,20,-30);ctx.stroke();
 }else{
  // Esqueleto: costelas, articulações e armadura antiga
  ctx.strokeStyle="#6f716c";ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();
  ctx.moveTo(-6,-6);ctx.lineTo(-9,7);ctx.moveTo(6,-6);ctx.lineTo(9,7);ctx.moveTo(-9,-27);ctx.lineTo(-18,-10);ctx.moveTo(9,-27);ctx.lineTo(18,-10);ctx.stroke();
  ctx.fillStyle="#d6cdb4";ctx.beginPath();ctx.roundRect(-10,-32,20,27,7);ctx.fill();
  ctx.strokeStyle="#958c78";ctx.lineWidth=2;
  for(let r=0;r<4;r++){ctx.beginPath();ctx.ellipse(0,-27+r*5,9-r*.6,3,0,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle="#e6dcc3";ctx.beginPath();ctx.ellipse(0,-42,9,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#5a5146";ctx.fillRect(-8,-46,16,4);
  ctx.fillStyle="#272b2a";ctx.beginPath();ctx.arc(-3,-42,2.4,0,Math.PI*2);ctx.arc(4,-42,2.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e05d4f";ctx.shadowColor="#e05d4f";ctx.shadowBlur=8;ctx.fillRect(-4,-43,2,2);ctx.fillRect(3,-43,2,2);ctx.shadowBlur=0;
  // ombreira e escudo rachado
  ctx.fillStyle="#716b5c";ctx.beginPath();ctx.moveTo(-12,-29);ctx.lineTo(-20,-24);ctx.lineTo(-15,-18);ctx.lineTo(-8,-22);ctx.fill();
  ctx.fillStyle="#75634c";ctx.beginPath();ctx.moveTo(17,-31);ctx.lineTo(23,-28);ctx.lineTo(22,-12);ctx.lineTo(16,-8);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#b8aa8c";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(19,-27);ctx.lineTo(17,-18);ctx.lineTo(21,-14);ctx.stroke();
  ctx.strokeStyle="#827967";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(16,-25);ctx.lineTo(22,-49);ctx.stroke();
  // Rachaduras, brilho ósseo e rebites do escudo
  ctx.strokeStyle="#fff0d1";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,-47);ctx.lineTo(-2,-43);ctx.lineTo(-5,-39);ctx.moveTo(-7,-25);ctx.lineTo(-3,-22);ctx.stroke();
  ctx.fillStyle="#d8bd7c";ctx.beginPath();ctx.arc(19,-22,1.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#c6bda7";ctx.beginPath();ctx.moveTo(18,-52);ctx.lineTo(24,-44);ctx.lineTo(17,-44);ctx.closePath();ctx.fill();
 }
 ctx.restore();
 const barW=52,barY=m.y-55;
 ctx.fillStyle="#17231f";ctx.fillRect(m.x-barW/2,barY,barW,7);
 ctx.fillStyle="#a73d45";ctx.fillRect(m.x-barW/2+1,barY+1,(barW-2)*Math.max(0,m.hp/m.maxHp),5);
 ctx.strokeStyle="#d5c49a88";ctx.lineWidth=1;ctx.strokeRect(m.x-barW/2,barY,barW,7);
 label(m.name,m.x,barY-6,m.kind==="wolf"?"#e0e9f2":"#e8ddc6");
}
function drawActor(x,y,type,t){
 if(type==="player"){ctx.fillStyle="#08120d88";ctx.beginPath();ctx.ellipse(x,y+3,22,7,0,0,Math.PI*2);ctx.fill();if(chosenClass==="mage"&&mageEldoriaSheet.complete&&mageEldoriaSheet.naturalWidth>=1024){
 const moving=Math.hypot(player.tx-player.x,player.ty-player.y)>2;
 const casting=attackState>0;
 const walkFrame=moving?Math.floor(player.step*1.35)%4:0;
 const castFrame=casting?4+Math.min(3,Math.floor((1-attackState)*14)):4;
 const frame=casting?castFrame:walkFrame;
 const facingLeft=player.tx<player.x-2;
 ctx.save();
 if(facingLeft){ctx.translate(x*2,0);ctx.scale(-1,1);}
 ctx.shadowColor="#a64cff";ctx.shadowBlur=casting?20:10;
 ctx.drawImage(mageEldoriaSheet,frame*128,0,128,144,x-43,y-91,86,97);
 ctx.restore();
 if(casting){const ox=x+(facingLeft?-24:24),oy=y-70;ctx.save();ctx.globalCompositeOperation="lighter";ctx.shadowColor="#d59aff";ctx.shadowBlur=20;for(let n=0;n<4;n++){const a=t/90+n*Math.PI/2;ctx.fillStyle="#e8c5ff";ctx.beginPath();ctx.arc(ox+Math.cos(a)*(8+n*2),oy+Math.sin(a)*(8+n*2),2.1,0,Math.PI*2);ctx.fill();}ctx.restore();}
}else if(mageEldoriaSprite.complete&&mageEldoriaSprite.naturalWidth){ctx.drawImage(mageEldoriaSprite,x-43,y-91,86,97);}else{drawPixelHero(x,y,t);}if(equipment.armor){ctx.save();ctx.globalAlpha=.82;ctx.fillStyle="#b7c7d0";ctx.fillRect(x-8,y-35,16,5);ctx.fillStyle="#6f8798";ctx.fillRect(x-10,y-29,20,4);ctx.restore();}if(equipment.weapon){ctx.save();ctx.strokeStyle="#f0d18a";ctx.lineWidth=3;ctx.shadowColor="#f0d18a";ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(x+15,y-18);ctx.lineTo(x+23,y-39);ctx.stroke();ctx.restore();}label("Viajante",x,y-(chosenClass==="mage"&&mageEldoriaSprite.complete&&mageEldoriaSprite.naturalWidth?99:57));return;}
 if(type==="monster"){const m=monsters.find(v=>v.x===x&&v.y===y);if(m)drawMonster(m,t);return;}
 ctx.fillStyle="#1b2c24";ctx.beginPath();ctx.ellipse(x,y+5,13,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9b7843";ctx.fillRect(x-9,y-18,18,22);ctx.fillStyle="#dfbd91";ctx.beginPath();ctx.arc(x,y-24,8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57402f";ctx.fillRect(x-9,y-31,18,6);ctx.fillStyle="#d4b66f";ctx.fillRect(x-12,y-18,24,4);label("Guardião",x,y-38,"#ffe2a0");
}
const projectiles=[];
function maxPlayerHp(){return classData[chosenClass].hp+(playerLevel-1)*10+attributes.vitality*8+attributes.strength*3;}function maxPlayerMp(){return classData[chosenClass].mp+(playerLevel-1)*5+attributes.intelligence*7;}function playerDamage(){return classData[chosenClass].damage+equipment.weapon+attributes.strength*2+attributes.agility+(classData[chosenClass].style==="magic"||classData[chosenClass].style==="holy"?attributes.intelligence*2:0);}function playerDefense(){return equipment.armor+attributes.vitality;}function playerSpeed(){return classData[chosenClass].speed+attributes.agility*3;}function updateAttributeUI(){const p=document.querySelector("#attribute-points");if(p)p.textContent=attributePoints;for(const key of ["strength","agility","intelligence","vitality"]){const el=document.querySelector("#attr-"+key);if(el)el.textContent=attributes[key];const btn=document.querySelector("[data-attribute=\""+key+"\"]");if(btn)btn.disabled=attributePoints<=0;}const summary=document.querySelector("#attribute-summary");if(summary)summary.textContent="ATQ "+playerDamage()+" · DEF "+playerDefense()+" · MOV "+playerSpeed();}
function refreshProgressUI(){const xpLabel=document.querySelector(".xp-line b"),xpBar=document.querySelector(".xp-track i"),levelBadge=document.querySelector(".level-badge"),classLabel=document.querySelector("#class-name"),profile=document.querySelector(".profile-chip small");if(xpLabel)xpLabel.textContent=playerXp+" / "+xpToNext;if(xpBar)xpBar.style.width=Math.min(100,playerXp/xpToNext*100)+"%";if(levelBadge)levelBadge.textContent=playerLevel;if(classLabel)classLabel.textContent=classData[chosenClass].name.toUpperCase()+" · NÍVEL "+playerLevel;if(profile)profile.textContent="Nível "+playerLevel+" · "+classData[chosenClass].name;}
function awardExperience(amount){playerXp+=amount;let gained=0;while(playerXp>=xpToNext){playerXp-=xpToNext;playerLevel++;attributePoints+=3;xpToNext=Math.round(xpToNext*1.35);gained++;}if(gained){playerHp=maxPlayerHp();playerMp=maxPlayerMp();const hpText=document.querySelector(".stat-block .stat-label b"),mpText=document.querySelectorAll(".stat-label b")[1],hpBar=document.querySelector(".hp i"),mpBar=document.querySelector(".mp i");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";if(mpText)mpText.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";if(hpBar)hpBar.style.width="100%";if(mpBar)mpBar.style.width="100%";notice.innerHTML="<b>[NÍVEL UP]</b> Você alcançou o nível "+playerLevel+"! +3 pontos de atributo. Vida e mana restauradas."; }refreshProgressUI();updateAttributeUI();saveGame();}
function dropLoot(target){gold+=target.kind==="slime"?3:target.kind==="wolf"?6:8;if(Math.random()<.14&&target.kind!=="slime"&&bag.length<24){const gear=target.kind==="wolf"?{id:"wolf-blade-"+Date.now(),name:"Lâmina do Caçador",kind:"weapon",attack:7,icon:"⚔"}:{id:"bone-armor-"+Date.now(),name:"Couraça Óssea",kind:"armor",defense:5,icon:"🛡"};bag.push(gear);notice.innerHTML+=" <b>[EQUIPAMENTO RARO]</b> "+gear.name+"!";}else if(Math.random()<.55&&bag.length<24){bag.push({id:"potion-"+Date.now(),name:"Poção de Vida",kind:"consumable",icon:"🧪"});notice.innerHTML+=" <b>[DROP]</b> Você encontrou uma Poção de Vida!";}else if(bag.length<24){const name=target.kind==="wolf"?"Presa de Lobo":target.kind==="skeleton"?"Osso Antigo":"Gosma Verde";bag.push({id:"material-"+Date.now(),name,kind:"material",icon:target.kind==="wolf"?"🦷":target.kind==="skeleton"?"🦴":"🟢"});notice.innerHTML+=" <b>[DROP]</b> Item obtido: "+name+".";}else notice.innerHTML+=" <b>[DROP]</b> Mochila cheia. Ouro recebido: "+(target.kind==="slime"?3:target.kind==="wolf"?6:8)+".";renderInventory();renderShop();saveGame();}
function updateQuestUI(){const a=document.querySelector("#quest-guardian"),b=document.querySelector("#quest-slimes"),c=document.querySelector("#quest-wolf"),d=document.querySelector("#quest-skeleton"),status=document.querySelector("#quest-status");if(a)a.textContent=questState.guardian?"1/1":"0/1";if(b)b.textContent=Math.min(3,questState.slimes)+"/3";if(c)c.textContent=questState.wolf?"1/1":"0/1";if(d)d.textContent=questState.skeleton?"1/1":"0/1";if(status)status.textContent=questState.claimed?"Jornada concluída · Recompensa recebida": "Recompensa: 100 ouro + 100 EXP";}
function progressQuest(target){if(target.id==="slime")questState.slimes=Math.min(3,questState.slimes+1);if(target.id==="wolf")questState.wolf=true;if(target.id==="skeleton")questState.skeleton=true;updateQuestUI();saveGame();if(questState.guardian&&questState.slimes>=3&&questState.wolf&&questState.skeleton&&!questState.claimed){questState.claimed=true;gold+=100;awardExperience(100);notice.innerHTML="<b>[MISSÃO CONCLUÍDA]</b> Primeiros passos: +100 ouro e +100 EXP!";updateQuestUI();saveGame();}}
function resolveHit(damage,target=activeMonster){if(!target||!target.alive)return;target.hp=Math.max(0,target.hp-damage);if(target.id==="slime"){monsterHp=target.hp;monsterAlive=target.alive;}effects.push({kind:"ring",x:target.x,y:target.y-10,life:0,duration:360},{kind:"number",x:target.x,y:target.y-35,text:"-"+damage,life:0,duration:850});for(let i=0;i<10;i++)effects.push({kind:"spark",x:target.x,y:target.y-8,vx:(rand(i+performance.now())-.5)*3,vy:(rand(i+90+performance.now())-.5)*3,life:0,duration:500});if(target.hp<=0){effects.push({kind:"death",x:target.x,y:target.y-12,rotation:rand(target.x+target.y),color:target.kind==="slime"?"#9fffc0":target.kind==="wolf"?"#c1d6e8":"#e6d6b1",life:0,duration:850});for(let n=0;n<18;n++)effects.push({kind:"spark",x:target.x,y:target.y-10,vx:(rand(n+target.x)-.5)*4,vy:(rand(n+target.y+30)-.5)*4,life:0,duration:650,color:target.kind==="slime"?"#9fffc0":"#e6d6b1"});target.alive=false;target.respawn=18;combatTarget=null;notice.innerHTML="<b>[COMBATE]</b> "+target.name+" derrotado! +"+target.xp+" EXP.";awardExperience(target.xp);progressQuest(target);dropLoot(target);saveGame();}else notice.innerHTML="<b>[COMBATE]</b> Dano em "+target.name+": "+target.hp+"/"+target.maxHp+".";}
function fireProjectile(style,damage,target=activeMonster){if(!target||!target.alive)return;const dx=target.x-player.x,dy=target.y-player.y,len=Math.max(1,Math.hypot(dx,dy)),speed=style==="arrow"?570:style==="holy"?390:330;projectiles.push({style,x:player.x,y:player.y-24,tx:target.x,ty:target.y-10,vx:dx/len,vy:dy/len,speed,damage,life:0,maxLife:len/speed,target});}
function drawProjectiles(dt){
 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i],step=p.speed*dt;p.life+=dt;p.x+=p.vx*step;p.y+=p.vy*step;
  ctx.save();ctx.globalCompositeOperation="lighter";
  if(p.style==="arrow"){
   ctx.strokeStyle="#f1d49a";ctx.lineWidth=3;ctx.shadowColor="#e7d5a5";ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(p.x-p.vx*22,p.y-p.vy*22);ctx.lineTo(p.x+p.vx*8,p.y+p.vy*8);ctx.stroke();
   ctx.strokeStyle="#fff1ca";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-p.vx*13,p.y-p.vy*13);ctx.lineTo(p.x+p.vx*5,p.y+p.vy*5);ctx.stroke();
  }else{
   const col=p.style==="holy"?"#fff0a0":"#a77cff";ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=22;ctx.beginPath();ctx.arc(p.x,p.y,8+Math.sin(p.life*25)*2,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=p.style==="holy"?"#fffbd7":"#e5d2ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,13+Math.sin(p.life*18)*2,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(p.x-2,p.y-2,3,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(Math.hypot(p.tx-p.x,p.ty-p.y)<12||p.life>p.maxLife+.2){projectiles.splice(i,1);if(p.target&&p.target.alive)resolveHit(p.damage,p.target);}
 }
}
function attack(){const target=activeMonster;if(!target||!target.alive)return;const def=classData[chosenClass],dist=Math.hypot(target.x-player.x,target.y-player.y);combatTarget=target.id;if(dist>def.range){const ratio=(dist-def.range+5)/Math.max(1,dist);player.tx=target.x-(target.x-player.x)*ratio;player.ty=target.y-(target.y-player.y)*ratio;notice.innerHTML="<b>[COMBATE]</b> Aproximando-se de "+target.name+"...";return;}if(attackCooldown>0)return;attackCooldown=def.cooldown;attackState=1;if(def.style==="magic"||def.style==="arrow"||def.style==="holy")fireProjectile(def.style,playerDamage(),target);else resolveHit(playerDamage(),target);}
const skillNames={soldier:["Golpe de Escudo","Determinação","Investida Real"],assassin:["Lâminas Sombrias","Passo das Sombras","Execução"],mage:["Míssil Arcano","Concentração","Chuva de Estrelas"],priest:["Luz Restauradora","Benção","Julgamento Sagrado"],longbowman:["Disparo Preciso","Foco do Caçador","Chuva de Flechas"],cavalry:["Estocada","Postura Defensiva","Carga de Cavalaria"]};
function castSkill(slot){const def=classData[chosenClass],cost=[12,18,25][slot],target=activeMonster;if(skillCooldowns[slot]>0||playerMp<cost){notice.innerHTML="<b>[HABILIDADE]</b> Habilidade recarregando ou mana insuficiente.";return;}if(slot!==1&&(!target||!target.alive)){notice.innerHTML="<b>[HABILIDADE]</b> Selecione um monstro primeiro.";return;}if(slot!==1&&Math.hypot(target.x-player.x,target.y-player.y)>def.range+115){notice.innerHTML="<b>[HABILIDADE]</b> Alvo fora do alcance.";return;}playerMp-=cost;skillCooldowns[slot]=[5,9,16][slot];const mpBar=document.querySelector(".mp i");if(mpBar)mpBar.style.width=(playerMp/def.mp*100)+"%";const mpText=document.querySelectorAll(".stat-label b")[1];if(mpText)mpText.innerHTML=playerMp+" <small>/ "+def.mp+"</small>";const name=skillNames[chosenClass][slot];if(slot===1){const heal=chosenClass==="priest"?32:chosenClass==="soldier"||chosenClass==="cavalry"?20:16;playerHp=Math.min(maxPlayerHp(),playerHp+heal);effects.push({kind:"heal",x:player.x,y:player.y-18,life:0,duration:750});const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";notice.innerHTML="<b>[HABILIDADE]</b> "+name+" recuperou "+heal+" de vida.";return;}const dist=Math.hypot(target.x-player.x,target.y-player.y),power=slot===0?1.8:2.7,damage=Math.round((def.damage+attributes.strength*2+attributes.intelligence*2)*power+(equipment.weapon?4:0));if(chosenClass==="assassin"||chosenClass==="soldier"||chosenClass==="cavalry"){if(dist>def.range+18){playerMp+=cost;skillCooldowns[slot]=0;notice.innerHTML="<b>[HABILIDADE]</b> Você precisa se aproximar para usar "+name+".";return;}resolveHit(damage,target);effects.push({kind:"slash",x:target.x,y:target.y-12,life:0,duration:360});}else{const style=def.style==="arrow"?"arrow":def.style==="holy"?"holy":"magic";fireProjectile(style,damage,target);effects.push({kind:"ring",x:target.x,y:target.y-8,life:0,duration:550});}attackState=1;notice.innerHTML="<b>[HABILIDADE]</b> "+name+"!";}
function drawEffects(dt,t){
 for(let i=effects.length-1;i>=0;i--){
  const e=effects[i];e.life+=dt;const p=Math.min(1,e.life/e.duration),fade=1-p;
  ctx.save();
  if(e.kind==="number"){
   const rise=p*34;ctx.globalAlpha=fade;ctx.font="bold 16px Georgia,serif";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#17221d";ctx.strokeText(e.text,e.x,e.y-rise);ctx.fillStyle=e.text.startsWith("-")?"#ffaaa0":"#ffe39a";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillText(e.text,e.x,e.y-rise);
  }else if(e.kind==="heal"){
   ctx.globalAlpha=fade;ctx.globalCompositeOperation="lighter";ctx.strokeStyle="#8df0b0";ctx.shadowColor="#8df0b0";ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,8+p*34,0,Math.PI*2);ctx.stroke();
   for(let n=0;n<6;n++){const ang=n*Math.PI/3+t*.001;const rr=12+p*24;ctx.fillStyle="#caffd8";ctx.beginPath();ctx.arc(e.x+Math.cos(ang)*rr,e.y+Math.sin(ang)*rr,2.5,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle="#c9ffda";ctx.font="bold 14px Georgia,serif";ctx.textAlign="center";ctx.fillText("+"+(chosenClass==="priest"?32:16),e.x,e.y-20-p*25);
  }else if(e.kind==="ring"||e.kind==="slash"){
   ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade;const col=e.kind==="ring"?"#b8ffd0":"#fff0bd";ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.lineWidth=e.kind==="ring"?4*(1-p)+1:6*(1-p)+1;ctx.beginPath();
   if(e.kind==="ring"){ctx.ellipse(e.x,e.y,8+p*38,5+p*17,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(e.x,e.y-8,5+p*26,Math.PI*.08,Math.PI*.92);ctx.stroke();}
   else{ctx.arc(e.x,e.y,17+p*30,-1.25,1.1);ctx.stroke();ctx.beginPath();ctx.arc(e.x,e.y,22+p*25,-1.2,1.05);ctx.stroke();}
  }else if(e.kind==="death"){
   ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade;const radius=8+p*42;
   const col=e.color||"#d8c08a";ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.lineWidth=3*(1-p)+.5;
   ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);ctx.stroke();
   for(let n=0;n<12;n++){const ang=n*Math.PI/6+e.rotation;const rr=radius*(.55+.35*Math.sin(n*3+p*8));ctx.fillStyle=col;ctx.beginPath();ctx.arc(e.x+Math.cos(ang)*rr,e.y+Math.sin(ang)*rr,2.5*fade,0,Math.PI*2);ctx.fill();}
  }else if(e.kind==="bolt"){
   ctx.globalCompositeOperation="lighter";ctx.globalAlpha=fade;const ex=e.x+(e.tx-e.x)*p,ey=e.y+(e.ty-e.y)*p;ctx.strokeStyle="#91eaff";ctx.shadowColor="#58cfff";ctx.shadowBlur=18;ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex,ey);ctx.stroke();
   ctx.fillStyle="#e8ffff";ctx.beginPath();ctx.arc(ex,ey,4+fade*4,0,Math.PI*2);ctx.fill();
  }else{
   e.x+=e.vx||0;e.y+=e.vy||0;e.vy=(e.vy||0)+.025;ctx.globalAlpha=fade;const col=e.color||(i%2?"#9ff3ff":"#c3a0ff");ctx.fillStyle=col;ctx.shadowBlur=10;ctx.shadowColor=col;ctx.beginPath();ctx.arc(e.x,e.y,1.5+fade*1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();if(p>=1)effects.splice(i,1);
 }
}
const ambientMotes=Array.from({length:52},(_,i)=>({x:rand(i+500)*W,y:rand(i+900)*H,phase:rand(i+1300)*Math.PI*2,size:1+rand(i+1700)*2}));
function drawAtmosphere(t){
 // Reflexos móveis e cintilação sobre o rio
 ctx.save();ctx.globalCompositeOperation="screen";
 for(let i=0;i<52;i++){
  const x=1700+rand(i+33)*185,y=(rand(i+89)*850+t*.018*(i%3+1))%850;
  ctx.globalAlpha=.1+.2*(.5+.5*Math.sin(t/390+i));ctx.fillStyle=i%4?"#b5e8e4":"#efffe2";
  ctx.fillRect(x+Math.sin(t/850+i)*5,y,7+rand(i+200)*19,1.5+rand(i+20)*1.5);
 }
 // Pequenas luzes de vaga-lumes em movimento lento
 // Floating pollen and fireflies
 for(const m of ambientMotes){const x=m.x+Math.sin(t/1700+m.phase)*12,y=(m.y-t*(.006+m.size*.002)+H*2)%(H);const glow=.25+.35*(.5+.5*Math.sin(t/420+m.phase));ctx.globalAlpha=glow;ctx.fillStyle=m.size>2?"#f4d88b":"#d9edb0";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillRect(x,y,m.size,m.size);}
 ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
}
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.drawImage(world,0,0);drawAtmosphere(t);
 // firelight glow and ambient light pools
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]]){const g=ctx.createRadialGradient(x,y-8,2,x,y-8,55);g.addColorStop(0,"#ffd47a44");g.addColorStop(1,"#ffd47a00");ctx.fillStyle=g;ctx.fillRect(x-55,y-63,110,110);}
 const depthActors=[...scenery.filter(o=>o.x>camera.x-100&&o.x<camera.x+canvas.width+100&&o.y>camera.y-160&&o.y<camera.y+canvas.height+100).map(o=>({depth:o.depth,draw:()=>o.type==="tree"?drawTree(ctx,o.x,o.y,o.scale,o.seed):drawHouse(ctx,o.x,o.y,o.scale,o.kind)})),{depth:guardian.y,draw:()=>drawActor(guardian.x,guardian.y,"guardian",t)},...monsters.filter(m=>m.alive).map(m=>({depth:m.y,draw:()=>drawActor(m.x,m.y,"monster",t)})),{depth:player.y,draw:()=>drawActor(player.x,player.y,"player",t)}];depthActors.sort((a,b)=>a.depth-b.depth);for(const actor of depthActors)actor.draw();if(playerHitFlash>0){ctx.fillStyle="#ff555566";ctx.fillRect(player.x-20,player.y-52,40,56);}drawEffects(16,t);drawProjectiles(1/60);
 ctx.strokeStyle="#f7df9b99";ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.tx,player.ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffe19a";ctx.beginPath();ctx.arc(player.tx,player.ty,4+Math.sin(t/90)*2,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe19a66";ctx.lineWidth=1;ctx.beginPath();ctx.arc(player.tx,player.ty,10+Math.sin(t/130)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
function frame(t){const dt=Math.min((t-(frame.last||t))/1000,.04);frame.last=t;frame.saveTimer=(frame.saveTimer||0)+dt;if(frame.saveTimer>=5){frame.saveTimer=0;saveGame();}for(const m of monsters){if(!m.alive){m.respawn=Math.max(0,m.respawn-dt);if(m.respawn===0){m.alive=true;m.hp=m.maxHp;if(m.id==="slime")monsterHp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;}}}attackCooldown=Math.max(0,attackCooldown-((dt)||0));skillCooldowns=skillCooldowns.map(v=>Math.max(0,v-dt));slimeAttackCooldown=Math.max(0,slimeAttackCooldown-dt);playerHitFlash=Math.max(0,playerHitFlash-dt);attackState=Math.max(0,attackState-((dt)||0)*3.5);const dx=player.tx-player.x,dy=player.ty-player.y,d=Math.hypot(dx,dy);if(combatTarget){const target=monsters.find(m=>m.id===combatTarget&&m.alive);if(target){const cd=classData[chosenClass],dist=Math.hypot(target.x-player.x,target.y-player.y);if(dist>cd.range){const ratio=(dist-cd.range+5)/Math.max(1,dist);player.tx=target.x-(target.x-player.x)*ratio;player.ty=target.y-(target.y-player.y)*ratio;}else{player.tx=player.x;player.ty=player.y;if(attackCooldown<=0)attack();}}else combatTarget=null;}if(d>2){const step=Math.min(d,playerSpeed()*(player.running?1.48:1)*dt);player.x+=dx/d*step;player.y+=dy/d*step;player.step+=dt*9;}const nearby=monsters.find(m=>m.alive&&Math.hypot(m.x-player.x,m.y-player.y)<m.range);if(nearby&&slimeAttackCooldown<=0){slimeAttackCooldown=nearby.attackRate;playerHp=Math.max(0,playerHp-Math.max(1,nearby.damage-playerDefense()));playerHitFlash=.22;effects.push({kind:"number",x:player.x,y:player.y-48,text:"-"+Math.max(1,nearby.damage-(equipment.armor?3:0)),life:0,duration:750});notice.innerHTML="<b>[COMBATE]</b> "+nearby.name+" acertou você!";const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";}camera.x=Math.round(Math.max(0,Math.min(W-canvas.width,player.x-canvas.width/2)));camera.y=Math.round(Math.max(0,Math.min(H-canvas.height,player.y-canvas.height/2)));coords.textContent="X: "+Math.round(player.x)+" · Y: "+Math.round(player.y);draw(t);requestAnimationFrame(frame);}
const equipment={weapon:0,armor:0,charm:false,weaponName:"Arma inicial",armorName:"Armadura de viajante"};
const bag=[{id:"iron-sword",name:"Espada de Ferro",kind:"weapon",attack:4,defense:0},{id:"leather-armor",name:"Armadura de Couro",kind:"armor",attack:0,defense:3},{id:"health-potion",name:"Poção de Vida",kind:"consumable"}];
const SAVE_KEY="eldoria_character_v1";let saveMessage="Ainda não salvo";
function saveGame(){try{const data={version:1,chosenClass,player:{x:player.x,y:player.y,tx:player.tx,ty:player.ty,hp:playerHp,mp:playerMp,xp:playerXp,level:playerLevel,xpToNext},gold,equipment,bag,questState,attributePoints,attributes,monsters:monsters.map(m=>({id:m.id,hp:m.hp,alive:m.alive,respawn:m.respawn})),savedAt:Date.now()};localStorage.setItem(SAVE_KEY,JSON.stringify(data));saveMessage="Salvo às "+new Date(savedAtSafe(data.savedAt)).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});const el=document.querySelector("#save-status");if(el)el.textContent=saveMessage;return true;}catch(err){saveMessage="Não foi possível salvar neste navegador";const el=document.querySelector("#save-status");if(el)el.textContent=saveMessage;return false;}}
function savedAtSafe(t){return Number.isFinite(t)?t:Date.now();}
function loadGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;const d=JSON.parse(raw);if(!d||d.version!==1||!classData[d.chosenClass])return false;chosenClass=d.chosenClass;if(d.player){player.x=Math.max(20,Math.min(W-20,Number(d.player.x)||520));player.y=Math.max(20,Math.min(H-20,Number(d.player.y)||500));player.tx=player.x;player.ty=player.y;playerLevel=Math.max(1,Math.floor(Number(d.player.level)||1));playerXp=Math.max(0,Number(d.player.xp)||0);xpToNext=Math.max(100,Number(d.player.xpToNext)||100);playerHp=Math.max(0,Math.min(maxPlayerHp(),Number(d.player.hp)||maxPlayerHp()));playerMp=Math.max(0,Math.min(maxPlayerMp(),Number(d.player.mp)||maxPlayerMp()));}gold=Math.max(0,Math.floor(Number(d.gold)||0));if(d.equipment){equipment.weapon=Math.max(0,Number(d.equipment.weapon)||0);equipment.armor=Math.max(0,Number(d.equipment.armor)||0);equipment.weaponName=String(d.equipment.weaponName||"Arma inicial");equipment.armorName=String(d.equipment.armorName||"Armadura de viajante");}if(Array.isArray(d.bag))bag.splice(0,bag.length,...d.bag.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string").slice(0,24));if(d.attributes)for(const key of ["strength","agility","intelligence","vitality"])attributes[key]=Math.max(0,Math.min(100,Math.floor(Number(d.attributes[key])||0)));attributePoints=Math.max(0,Math.min(999,Math.floor(Number(d.attributePoints)||0)));if(d.questState)questState={guardian:!!d.questState.guardian,slimes:Math.max(0,Math.min(3,Number(d.questState.slimes)||0)),wolf:!!d.questState.wolf,skeleton:!!d.questState.skeleton,claimed:!!d.questState.claimed};if(Array.isArray(d.monsters))for(const saved of d.monsters){const m=monsters.find(x=>x.id===saved.id);if(m){m.hp=Math.max(0,Math.min(m.maxHp,Number(saved.hp)||m.maxHp));m.alive=!!saved.alive;m.respawn=m.alive?0:Math.max(0,Number(saved.respawn)||18);}}saveMessage="Progresso carregado";return true;}catch(err){saveMessage="Save inválido; iniciando novo personagem";return false;}}

function renderInventory(){const saveEl=document.querySelector("#save-status");if(saveEl)saveEl.textContent=saveMessage;const goldLabel=document.querySelector("#gold-count");if(goldLabel)goldLabel.textContent=gold+" ouro";document.querySelector("#equip-weapon").textContent=equipment.weaponName;document.querySelector("#equip-armor").textContent=equipment.armorName;document.querySelector("#equip-charm").textContent="Amuleto simples";document.querySelector("#equipment-bonus").textContent="Bônus: +"+equipment.weapon+" ATQ · +"+equipment.armor+" DEF";document.querySelector("#bag-count").textContent=bag.length+" / 24";document.querySelector("#bag-grid").innerHTML=bag.map(item=>`<button data-item="${item.id}" class="${(item.kind==="weapon"&&equipment.weapon===item.attack)||(item.kind==="armor"&&equipment.armor===item.defense)?"equipped":""}"><span>${item.icon||(item.kind==="weapon"?"⚔":item.kind==="armor"?"🛡":"🧪")}</span><b>${item.name}</b><small>${item.kind==="weapon"?"+"+item.attack+" ATQ":item.kind==="armor"?"+"+item.defense+" DEF":item.kind==="consumable"?"Poção de Vida":item.kind==="mana"?"Poção de Mana":"Material"}</small></button>`).join("");}
function toggleShop(open){const el=document.querySelector("#shop");el.classList.toggle("visible",open);el.setAttribute("aria-hidden",String(!open));if(open)renderShop();}const shopCatalog=[{id:"health-potion-shop",name:"Poção de Vida",description:"Recupera até 45 pontos de vida",price:18,icon:"🧪",item:{id:"health-potion-shop-item",name:"Poção de Vida",kind:"consumable",icon:"🧪"}},{id:"mana-potion-shop",name:"Poção de Mana",description:"Recupera 35 pontos de mana",price:22,icon:"🔷",item:{id:"mana-potion-shop-item",name:"Poção de Mana",kind:"mana",icon:"🔷"}},{id:"steel-sword-shop",name:"Espada de Aço",description:"+8 de ataque",price:120,icon:"⚔",item:{id:"steel-sword",name:"Espada de Aço",kind:"weapon",attack:8,icon:"⚔"}},{id:"chain-armor-shop",name:"Cota de Malha",description:"+7 de defesa",price:110,icon:"🛡",item:{id:"chain-armor",name:"Cota de Malha",kind:"armor",defense:7,icon:"🛡"}}];function renderShop(){const goldEl=document.querySelector("#shop-gold");if(goldEl)goldEl.textContent=gold+" ouro";document.querySelector("#shop-items").innerHTML=shopCatalog.map(x=>`<article class="shop-item"><span>${x.icon}</span><div><b>${x.name}</b><small>${x.description}</small></div><button data-buy="${x.id}">${x.price} ouro</button></article>`).join("");}function buyShopItem(id){const offer=shopCatalog.find(x=>x.id===id);if(!offer)return;if(gold<offer.price){notice.innerHTML="<b>[MERCADOR]</b> Ouro insuficiente.";return;}if(bag.length>=24){notice.innerHTML="<b>[MERCADOR]</b> Mochila cheia.";return;}gold-=offer.price;bag.push({...offer.item,id:offer.item.id+"-"+Date.now()});renderShop();renderInventory();saveGame();notice.innerHTML="<b>[MERCADOR]</b> "+offer.name+" comprado!";}function toggleInventory(open){const el=document.querySelector("#inventory");el.classList.toggle("visible",open);el.setAttribute("aria-hidden",String(!open));if(open)renderInventory();}
function useBagItem(id){const item=bag.find(x=>x.id===id);if(!item)return;if(item.kind==="weapon"){equipment.weapon=equipment.weapon===item.attack?0:item.attack;equipment.weaponName=equipment.weapon===0?"Arma inicial":item.name;notice.innerHTML="<b>[EQUIPAMENTO]</b> "+(equipment.weapon?item.name+" equipada (+"+item.attack+" ATQ).":"Arma removida.");}else if(item.kind==="armor"){equipment.armor=equipment.armor===item.defense?0:item.defense;equipment.armorName=equipment.armor===0?"Armadura de viajante":item.name;notice.innerHTML="<b>[EQUIPAMENTO]</b> "+(equipment.armor?item.name+" equipada (+"+item.defense+" DEF).":"Armadura removida.");}else if(item.kind==="mana"){const restored=Math.min(maxPlayerMp()-playerMp,35);if(restored<=0){notice.innerHTML="<b>[INVENTÁRIO]</b> Sua mana já está cheia.";return;}playerMp+=restored;bag.splice(bag.indexOf(item),1);const bar=document.querySelector(".mp i"),label=document.querySelectorAll(".stat-label b")[1];if(bar)bar.style.width=(playerMp/maxPlayerMp()*100)+"%";if(label)label.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";notice.innerHTML="<b>[INVENTÁRIO]</b> Poção de Mana: +"+restored+" de mana.";}else if(item.kind==="consumable"){const heal=Math.min(maxPlayerHp()-playerHp,45);if(heal<=0){notice.innerHTML="<b>[INVENTÁRIO]</b> Sua vida já está cheia.";return;}playerHp+=heal;bag.splice(bag.indexOf(item),1);notice.innerHTML="<b>[INVENTÁRIO]</b> Poção usada: +"+heal+" de vida.";const hpBar=document.querySelector(".hp i");if(hpBar)hpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";}renderInventory();saveGame();}
document.querySelector("#inventory-open").addEventListener("click",()=>toggleInventory(true));document.querySelector("#inventory-close").addEventListener("click",()=>toggleInventory(false));document.querySelector("#inventory").addEventListener("click",e=>{if(e.target.id==="inventory")toggleInventory(false);});document.querySelector("#bag-grid").addEventListener("click",e=>{const btn=e.target.closest("button[data-item]");if(btn)useBagItem(btn.dataset.item);});

function chooseClass(id){if(!classData[id])return;chosenClass=id;const d=classData[id];playerHp=maxPlayerHp();playerMp=maxPlayerMp();document.querySelector("#class-name").textContent=d.name.toUpperCase()+" · NÍVEL "+playerLevel;document.querySelector("#skill-1").title=skillNames[id][0]+" (1)";document.querySelector("#skill-2").title=skillNames[id][1]+" (2)";document.querySelector("#skill-3").title=skillNames[id][2]+" (3)";document.querySelectorAll(".class-choice").forEach(b=>b.classList.toggle("selected",b.dataset.class===id));document.querySelector(".profile-chip small").textContent="Nível "+playerLevel+" · "+d.name;const hpText=document.querySelector(".stat-block .stat-label b");if(hpText)hpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";const mpText=document.querySelectorAll(".stat-label b")[1];if(mpText)mpText.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";const hpBar=document.querySelector(".hp i"),mpBar=document.querySelector(".mp i");if(hpBar)hpBar.style.width="100%";if(mpBar)mpBar.style.width="100%";document.querySelector(".profile-icon").textContent=id==="mage"?"✦":id==="priest"?"✚":id==="longbowman"?"➶":id==="cavalry"?"♞":id==="assassin"?"🗡":"🛡";notice.innerHTML="<b>[CLASSE]</b> Classe alterada para "+d.name+". Experimente caminhar e atacar o Slime.";updateAttributeUI();saveGame();}
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width+camera.x,y:(e.clientY-r.top)*canvas.height/r.height+camera.y};}
canvas.addEventListener("click",e=>{const p=pointer(e);if(Math.hypot(p.x-guardian.x,p.y-guardian.y)<45){questState.guardian=true;updateQuestUI();notice.innerHTML="<b>[GUARDIÃO]</b> Bem-vindo! Derrote 3 Slimes, 1 Lobo e 1 Esqueleto para provar seu valor.";if(questState.slimes>=3&&questState.wolf&&questState.skeleton&&!questState.claimed){questState.claimed=true;gold+=100;awardExperience(100);notice.innerHTML="<b>[MISSÃO CONCLUÍDA]</b> +100 ouro e +100 EXP!";}renderInventory();return;}const clicked=monsters.find(m=>m.alive&&Math.hypot(p.x-m.x,p.y-m.y)<58);if(clicked){activeMonster=clicked;if(clicked.id==="slime"&&questState.slimes===0)notice.innerHTML="<b>[MISSÃO]</b> Slimes encontrados. Derrote 3 para avançar.";attack();return;}player.tx=Math.max(20,Math.min(W-20,p.x));player.ty=Math.max(20,Math.min(H-20,p.y));notice.innerHTML="<b>[MUNDO]</b> Você está explorando as trilhas de Eldoria.";});
function center(){player.tx=player.x;player.ty=player.y;notice.innerHTML="<b>[SISTEMA]</b> Personagem centralizado.";}
function help(){notice.innerHTML="<b>[AJUDA]</b> Clique no terreno para caminhar; clique nos monstros para atacar. Use 1, 2 e 3 para habilidades, I para inventário e Shift para correr. Monstros derrotados retornam após 18 segundos.";}
document.querySelectorAll(".class-choice").forEach(b=>b.addEventListener("click",()=>chooseClass(b.dataset.class)));document.querySelector("#attack").addEventListener("click",attack);document.querySelector("#skill-1").addEventListener("click",()=>castSkill(0));document.querySelector("#skill-2").addEventListener("click",()=>castSkill(1));document.querySelector("#skill-3").addEventListener("click",()=>castSkill(2));document.querySelector("#center").addEventListener("click",center);document.querySelector("#center-side").addEventListener("click",center);document.querySelector("#help").addEventListener("click",help);document.querySelector("#quest-help").addEventListener("click",help);window.addEventListener("keydown",e=>{if(e.key==="Shift")player.running=true;if(e.key.toLowerCase()==="h")help();if(e.key.toLowerCase()==="i")toggleInventory(true);if(e.key==="Escape")toggleInventory(false);if(e.code==="Space"){e.preventDefault();attack();}if(["1","2","3"].includes(e.key))castSkill(Number(e.key)-1);});window.addEventListener("keyup",e=>{if(e.key==="Shift")player.running=false;});
chooseClass(chosenClass);const restored=loadGame();refreshProgressUI();updateAttributeUI();const restoredHpText=document.querySelector(".stat-block .stat-label b"),restoredMpText=document.querySelectorAll(".stat-label b")[1],restoredHpBar=document.querySelector(".hp i"),restoredMpBar=document.querySelector(".mp i");if(restoredHpText)restoredHpText.innerHTML=playerHp+" <small>/ "+maxPlayerHp()+"</small>";if(restoredMpText)restoredMpText.innerHTML=playerMp+" <small>/ "+maxPlayerMp()+"</small>";if(restoredHpBar)restoredHpBar.style.width=(playerHp/maxPlayerHp()*100)+"%";if(restoredMpBar)restoredMpBar.style.width=(playerMp/maxPlayerMp()*100)+"%";updateQuestUI();renderInventory();if(restored)notice.innerHTML="<b>[SALVAMENTO]</b> Seu personagem foi restaurado neste navegador.";document.querySelector("#save-now").addEventListener("click",()=>{saveGame();notice.innerHTML="<b>[SALVAMENTO]</b> Progresso salvo neste navegador.";});document.querySelectorAll("[data-attribute]").forEach(btn=>btn.addEventListener("click",()=>{const key=btn.dataset.attribute;if(attributePoints<=0||!Object.prototype.hasOwnProperty.call(attributes,key))return;attributePoints--;attributes[key]++;if(key==="vitality")playerHp=Math.min(maxPlayerHp(),playerHp+8);if(key==="intelligence")playerMp=Math.min(maxPlayerMp(),playerMp+7);updateAttributeUI();refreshProgressUI();saveGame();notice.innerHTML="<b>[ATRIBUTOS]</b> Ponto aplicado: "+btn.textContent.trim()+". "+attributePoints+" pontos restantes.";}));document.querySelector("#shop-open").addEventListener("click",()=>toggleShop(true));document.querySelector("#shop-close").addEventListener("click",()=>toggleShop(false));document.querySelector("#shop").addEventListener("click",e=>{if(e.target.id==="shop")toggleShop(false);});document.querySelector("#shop-items").addEventListener("click",e=>{const btn=e.target.closest("[data-buy]");if(btn)buyShopItem(btn.dataset.buy);});requestAnimationFrame(frame);
})();