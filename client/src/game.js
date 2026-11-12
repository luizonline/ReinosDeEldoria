(() => {
"use strict";
const canvas=document.querySelector("#world"),ctx=canvas.getContext("2d"),notice=document.querySelector("#notice"),coords=document.querySelector("#coords");
const W=2400,H=1800,camera={x:0,y:0};
const player={x:470,y:420,tx:470,ty:420,step:0};
const guardian={x:700,y:330},slime={x:1040,y:650};
const houses=[{x:350,y:250,w:150,h:100},{x:820,y:220,w:180,h:110},{x:540,y:740,w:250,h:125},{x:1300,y:430,w:200,h:130},{x:1700,y:950,w:260,h:140}];
const rand=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function path(points,width,color){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i+=3){const p1=points[i]||points[i-1],p2=points[i+1]||p1,p3=points[i+2]||p2;ctx.bezierCurveTo(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1]);}ctx.lineWidth=width;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=color;ctx.stroke();}
function tree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
ctx.fillStyle="#263d30";ctx.beginPath();ctx.ellipse(3,15,24,12,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle="#654c35";ctx.fillRect(-5,-2,10,29);
for(const [ox,oy,r,c] of [[0,-13,23,"#254b37"],[-12,-4,15,"#2e6040"],[12,-5,16,"#376c46"],[0,-24,14,"#477d4e"]]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.fill();}
ctx.fillStyle="#82a65e";ctx.beginPath();ctx.arc(-7,-25,4,0,Math.PI*2);ctx.arc(11,-13,3,0,Math.PI*2);ctx.fill();ctx.restore();}
function house(h){const{x,y,w,h:hh}=h;ctx.fillStyle="#26362e";ctx.fillRect(x+8,y+15,w,hh);ctx.fillStyle="#b5a078";ctx.fillRect(x,y,w,hh);ctx.fillStyle="#d2bd91";ctx.fillRect(x+8,y+8,w-16,hh-16);
ctx.fillStyle="#594331";ctx.beginPath();ctx.moveTo(x-14,y+15);ctx.lineTo(x+w*.5,y-48);ctx.lineTo(x+w+14,y+15);ctx.closePath();ctx.fill();
ctx.fillStyle="#8b6043";ctx.beginPath();ctx.moveTo(x+10,y+12);ctx.lineTo(x+w*.5,y-34);ctx.lineTo(x+w-10,y+12);ctx.closePath();ctx.fill();
ctx.fillStyle="#39434a";ctx.fillRect(x+w*.42,y+hh-47,Math.max(22,w*.16),47);
ctx.fillStyle="#d8c58e";ctx.fillRect(x+20,y+30,23,24);ctx.fillRect(x+w-43,y+30,23,24);
ctx.strokeStyle="#74583b";ctx.lineWidth=3;ctx.strokeRect(x+20,y+30,23,24);ctx.strokeRect(x+w-43,y+30,23,24);
ctx.fillStyle="#e3c879";ctx.fillRect(x+w*.5-3,y+hh-25,6,6);}
function drawWorld(t){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#5f8a58");g.addColorStop(.55,"#47754c");g.addColorStop(1,"#355f43");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
for(let y=20;y<H;y+=46)for(let x=20;x<W;x+=49){const n=rand(x+y*W);ctx.fillStyle=n>.78?"#79a15d":n>.4?"#58834e":"#426f48";ctx.globalAlpha=.35;ctx.fillRect(x+n*13,y+rand(y+x)*12,2+n*2,2);ctx.globalAlpha=1;}
ctx.fillStyle="#397b8a";ctx.beginPath();ctx.moveTo(1540,0);ctx.bezierCurveTo(1430,180,1650,250,1570,410);ctx.bezierCurveTo(1510,570,1700,610,1650,800);ctx.lineTo(1900,820);ctx.bezierCurveTo(1830,600,1740,500,1840,340);ctx.bezierCurveTo(1920,190,1780,90,1840,0);ctx.closePath();ctx.fill();
ctx.strokeStyle="#7eb2b0";ctx.lineWidth=5;ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(1600,90);ctx.bezierCurveTo(1530,220,1690,290,1615,410);ctx.stroke();ctx.globalAlpha=1;
path([[40,510],[330,550],[620,480],[900,670],[1120,830],[1430,820],[1730,750],[2100,850],[2350,900]],94,"#806d4c");
path([[40,510],[330,550],[620,480],[900,670],[1120,830],[1430,820],[1730,750],[2100,850],[2350,900]],78,"#b69a69");
path([[40,510],[330,550],[620,480],[900,670],[1120,830],[1430,820],[1730,750],[2100,850],[2350,900]],2,"#d1b887");
for(let i=0;i<115;i++){const x=rand(i+2)*W,y=rand(i+600)*H;if(Math.hypot(x-470,y-420)>100&&Math.hypot(x-700,y-330)>125)tree(x,y,.65+rand(i+900)*.55);}
for(const h of houses)house(h);
for(let i=0;i<12;i++){const x=280+i*110,y=570+Math.sin(i*.8)*32;ctx.fillStyle="#d0bd8b";ctx.beginPath();ctx.ellipse(x,y,3,2,0,0,Math.PI*2);ctx.fill();}
for(const [x,y] of [[630,270],[785,400],[520,670]]){ctx.fillStyle="#5c4b39";ctx.fillRect(x-3,y,6,24);ctx.fillStyle="#d4a85e";ctx.beginPath();ctx.arc(x,y-4,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffe4a0";ctx.globalAlpha=.7+.2*Math.sin(t/250);ctx.beginPath();ctx.arc(x,y-4,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
function label(text,x,y,color="#f2ead8"){ctx.font="600 14px DM Sans,Arial";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="#1b2a25";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
function actor(x,y,type,t){ctx.save();ctx.translate(x,y);const bob=Math.sin(t/180+(type==="player"?player.step:1))*2;ctx.translate(0,bob);
ctx.fillStyle="#17251d88";ctx.beginPath();ctx.ellipse(0,14,18,8,0,0,Math.PI*2);ctx.fill();
if(type==="slime"){ctx.fillStyle="#23583e";ctx.beginPath();ctx.ellipse(0,3,19,15,0,Math.PI,Math.PI*2);ctx.lineTo(18,8);ctx.quadraticCurveTo(0,28,-18,8);ctx.fill();ctx.fillStyle="#71d18a";ctx.beginPath();ctx.ellipse(0,1,16,12,0,Math.PI,Math.PI*2);ctx.lineTo(16,8);ctx.quadraticCurveTo(0,23,-16,8);ctx.fill();ctx.fillStyle="#193c2b";ctx.fillRect(-7,4,3,4);ctx.fillRect(5,4,3,4);label("Slime Verde",0,-25,"#c6f2ce");}
else{ctx.fillStyle=type==="player"?"#31577b":"#7b633a";ctx.beginPath();ctx.roundRect(-11,-15,22,28,6);ctx.fill();ctx.fillStyle=type==="player"?"#668db5":"#c39b54";ctx.fillRect(-10,-13,20,8);ctx.fillStyle="#d9b48d";ctx.beginPath();ctx.arc(0,-23,9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#514233";ctx.beginPath();ctx.arc(0,-27,10,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#d7dce1";ctx.fillRect(-12,0,8,15);ctx.fillRect(4,0,8,15);ctx.fillStyle="#aab9c6";ctx.fillRect(-9,12,7,5);ctx.fillRect(3,12,7,5);
if(type==="player"){ctx.strokeStyle="#d8dbe0";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(12,-12);ctx.lineTo(21,-31);ctx.stroke();ctx.fillStyle="#d6bd83";ctx.fillRect(-14,-18,28,3);label("Viajante",0,-43);}
else{ctx.fillStyle="#f1d28a";ctx.fillRect(-13,-35,26,3);label("Guardião",0,-45,"#ffe0a0");}}
ctx.restore();}
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(-camera.x,-camera.y);drawWorld(t);actor(guardian.x,guardian.y,"guardian",t);actor(slime.x,slime.y,"slime",t);actor(player.x,player.y,"player",t);
ctx.strokeStyle="#f7df9b99";ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.tx,player.ty);ctx.stroke();ctx.setLineDash([]);
ctx.fillStyle="#f8dda0";ctx.beginPath();ctx.arc(player.tx,player.ty,6+Math.sin(t/100)*2,0,Math.PI*2);ctx.fill();ctx.restore();}
function frame(t){const dt=Math.min((t-(frame.last||t))/1000,.04);frame.last=t;const dx=player.tx-player.x,dy=player.ty-player.y,d=Math.hypot(dx,dy);if(d>2){const step=Math.min(d,190*dt);player.x+=dx/d*step;player.y+=dy/d*step;player.step+=dt*9;}camera.x=Math.max(0,Math.min(W-canvas.width,player.x-canvas.width/2));camera.y=Math.max(0,Math.min(H-canvas.height,player.y-canvas.height/2));coords.textContent="X: "+Math.round(player.x)+" · Y: "+Math.round(player.y);draw(t);requestAnimationFrame(frame);}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width+camera.x,y:(e.clientY-r.top)*canvas.height/r.height+camera.y};}
canvas.addEventListener("click",e=>{const p=point(e);if(Math.hypot(p.x-guardian.x,p.y-guardian.y)<48){notice.innerHTML="<b>[GUARDIÃO]</b> Que a luz antiga proteja seus passos, viajante.";return;}if(Math.hypot(p.x-slime.x,p.y-slime.y)<48){notice.innerHTML="<b>[CRIATURA]</b> O Slime Verde observa você. O combate chegará em breve.";return;}player.tx=Math.max(24,Math.min(W-24,p.x));player.ty=Math.max(24,Math.min(H-24,p.y));notice.innerHTML="<b>[MUNDO]</b> Você segue em direção ao destino marcado.";});
function center(){player.tx=player.x;player.ty=player.y;notice.innerHTML="<b>[SISTEMA]</b> Personagem centralizado.";}
function help(){notice.innerHTML="<b>[AJUDA]</b> Clique no terreno para caminhar. Clique no Guardião ou no Slime para interagir.";}
document.querySelector("#center").addEventListener("click",center);document.querySelector("#center-side").addEventListener("click",center);document.querySelector("#help").addEventListener("click",help);document.querySelector("#quest-help").addEventListener("click",help);window.addEventListener("keydown",e=>{if(e.key.toLowerCase()==="h")help();});
requestAnimationFrame(frame);
})();