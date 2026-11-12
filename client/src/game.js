(() => {
"use strict";
const canvas=document.querySelector("#world"),ctx=canvas.getContext("2d"),notice=document.querySelector("#notice"),coords=document.querySelector("#coords");
ctx.imageSmoothingEnabled=false;
const W=2400,H=1800,camera={x:0,y:0};
const player={x:520,y:500,tx:520,ty:500,step:0};
const guardian={x:760,y:390},slime={x:1240,y:720};
const heroSprite=new Image(),slimeSprite=new Image();
heroSprite.src="assets/sprites/player-walk.svg";slimeSprite.src="assets/sprites/slime-idle.svg";
const effects=[];
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
 drawHouse(c,420,900,1.12,1);drawHouse(c,1480,320,.95,0);drawHouse(c,1040,1130,.82,1);
 // Trees clustered around clearings, river and paths
 for(let i=0;i<430;i++){let x=rand(i+5)*W,y=rand(i+805)*H;const nearRoad=roadDistance(x,y)<92,nearSquare=Math.hypot((x-760)/1.1,(y-390))<180,nearHouse=[ [420,900],[1480,320],[1040,1130] ].some(([hx,hy])=>Math.abs(x-hx)<155&&Math.abs(y-hy)<145),inRiver=x>1660&&x<1950&&y<870;
 if(!nearRoad&&!nearSquare&&!nearHouse&&!inRiver&&!(x>2050)){drawTree(c,x,y,.62+rand(i+1300)*.7,i);}
 }
 // More deliberate forest edge clusters
 for(let i=0;i<70;i++){let x=rand(i+1800)*W,y=rand(i+2400)*H;if(Math.hypot(x-760,y-390)>185&&roadDistance(x,y)>95)drawTree(c,x,y,.9+rand(i+2600)*.45,i+700);}
 for(let i=0;i<160;i++){let x=rand(i+3000)*W,y=rand(i+3600)*H;if(roadDistance(x,y)>85&&Math.hypot(x-760,y-390)>165)drawDecoration(c,x,y,i%5===0?"stone":"flower",i);}
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]])drawDecoration(c,x,y,"torch",0);
 // Fountain in the village square
 c.fillStyle="#59665f";c.fillRect(744,365,32,35);c.fillStyle="#b5c6c0";c.fillRect(749,360,22,30);c.fillStyle="#65a9b4";c.beginPath();c.arc(760,358,12,0,Math.PI*2);c.fill();c.fillStyle="#dce8d8";c.fillRect(757,340,6,20);
 return off;
}
const world=buildWorld();
function label(text,x,y,color="#f5f0d7"){ctx.font="bold 13px Arial";ctx.textAlign="center";ctx.lineWidth=3;ctx.strokeStyle="#243226";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
function drawActor(x,y,type,t){
 if(type==="player"&&heroSprite.complete&&heroSprite.naturalWidth){const moving=Math.hypot(player.tx-player.x,player.ty-player.y)>3,frame=moving?Math.floor(t/130)%4:0;ctx.drawImage(heroSprite,frame*64,0,64,80,x-24,y-51,48,60);label("Viajante",x,y-56);return;}
 if(type==="slime"&&slimeSprite.complete&&slimeSprite.naturalWidth){const frame=Math.floor(t/260)%3;ctx.drawImage(slimeSprite,frame*64,0,64,64,x-23,y-29,46,46);label("Slime Verde",x,y-31,"#caffc8");return;}
 ctx.fillStyle="#1b2c24";ctx.beginPath();ctx.ellipse(x,y+5,13,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9b7843";ctx.fillRect(x-9,y-18,18,22);ctx.fillStyle="#dfbd91";ctx.beginPath();ctx.arc(x,y-24,8,0,Math.PI*2);ctx.fill();ctx.fillStyle="#57402f";ctx.fillRect(x-9,y-31,18,6);ctx.fillStyle="#d4b66f";ctx.fillRect(x-12,y-18,24,4);label("Guardião",x,y-38,"#ffe2a0");
}
function spawnMagic(x,y){effects.push({x:player.x,y:player.y-20,tx:x,ty:y,life:0,duration:420,kind:"bolt"});for(let i=0;i<20;i++)effects.push({x,y,vx:(rand(i+performance.now())-.5)*3,vy:(rand(i+90+performance.now())-.5)*3,life:0,duration:700,kind:"spark"});notice.innerHTML="<b>[MAGIA]</b> Pulso arcano lançado! Efeito visual demonstrativo; dano ainda não implementado.";}
function drawEffects(dt,t){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life+=dt;const p=Math.min(1,e.life/e.duration);if(e.kind==="bolt"){ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle="#91eaff";ctx.shadowColor="#58cfff";ctx.shadowBlur=15;ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+(e.tx-e.x)*p,e.y+(e.ty-e.y)*p);ctx.stroke();ctx.restore();}else{e.x+=e.vx;e.y+=e.vy;e.vy+=.02;ctx.save();ctx.globalAlpha=1-p;ctx.fillStyle=i%2?"#9ff3ff":"#c3a0ff";ctx.shadowBlur=8;ctx.shadowColor=ctx.fillStyle;ctx.fillRect(e.x,e.y,3,3);ctx.restore();}if(p>=1)effects.splice(i,1);}}
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);ctx.drawImage(world,0,0);
 // firelight glow and ambient light pools
 for(const [x,y] of [[360,520],[620,650],[1040,650],[1380,780],[1810,900],[1160,1080],[870,290],[1510,500]]){const g=ctx.createRadialGradient(x,y-8,2,x,y-8,55);g.addColorStop(0,"#ffd47a44");g.addColorStop(1,"#ffd47a00");ctx.fillStyle=g;ctx.fillRect(x-55,y-63,110,110);}
 drawActor(guardian.x,guardian.y,"guardian",t);drawActor(slime.x,slime.y,"slime",t);drawActor(player.x,player.y,"player",t);drawEffects(16,t);
 ctx.strokeStyle="#f7df9b99";ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.tx,player.ty);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffe19a";ctx.beginPath();ctx.arc(player.tx,player.ty,4+Math.sin(t/90)*2,0,Math.PI*2);ctx.fill();ctx.restore();}
function frame(t){const dt=Math.min((t-(frame.last||t))/1000,.04);frame.last=t;const dx=player.tx-player.x,dy=player.ty-player.y,d=Math.hypot(dx,dy);if(d>2){const step=Math.min(d,185*dt);player.x+=dx/d*step;player.y+=dy/d*step;player.step+=dt*9;}camera.x=Math.max(0,Math.min(W-canvas.width,player.x-canvas.width/2));camera.y=Math.max(0,Math.min(H-canvas.height,player.y-canvas.height/2));coords.textContent="X: "+Math.round(player.x)+" · Y: "+Math.round(player.y);draw(t);requestAnimationFrame(frame);}
function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width+camera.x,y:(e.clientY-r.top)*canvas.height/r.height+camera.y};}
canvas.addEventListener("click",e=>{const p=pointer(e);if(Math.hypot(p.x-guardian.x,p.y-guardian.y)<45){notice.innerHTML="<b>[GUARDIÃO]</b> Bem-vindo à vila de Eldoria. Que sua jornada seja gloriosa.";return;}if(Math.hypot(p.x-slime.x,p.y-slime.y)<45){spawnMagic(slime.x,slime.y-8);return;}player.tx=Math.max(20,Math.min(W-20,p.x));player.ty=Math.max(20,Math.min(H-20,p.y));notice.innerHTML="<b>[MUNDO]</b> Você está explorando as trilhas de Eldoria.";});
function center(){player.tx=player.x;player.ty=player.y;notice.innerHTML="<b>[SISTEMA]</b> Personagem centralizado.";}
function help(){notice.innerHTML="<b>[AJUDA]</b> Clique no terreno para caminhar. Clique no Guardião para conversar ou no Slime para testar o efeito mágico.";}
document.querySelector("#center").addEventListener("click",center);document.querySelector("#center-side").addEventListener("click",center);document.querySelector("#help").addEventListener("click",help);document.querySelector("#quest-help").addEventListener("click",help);window.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="h")help();});
requestAnimationFrame(frame);
})();