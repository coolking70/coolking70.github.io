const C=document.querySelector('#game'),X=C.getContext('2d'),W=C.width,H=C.height;
const start=document.querySelector('#startOverlay'),result=document.querySelector('#resultOverlay');
const title=document.querySelector('#resultTitle'),stats=document.querySelector('#resultStats');
const skills={
 normal:{n:'普通攻击',c:'#e8e1d1',load:.08,cd:.25,d:13,r:62,k:24},
 smash:{n:'重击',c:'#ffad72',load:.7,cd:1.05,d:32,r:68,k:120},
 defense:{n:'防御',c:'#72b8ff',load:.38,cd:.65,d:0,r:0,k:0,hold:2.6},
 counter:{n:'反击',c:'#d898ff',load:.48,cd:1.0,d:26,r:0,k:110,hold:2.5},
 windmill:{n:'旋风斩',c:'#83ddb7',load:.44,cd:1.2,d:19,r:105,k:110}
},order=['normal','smash','defense','counter','windmill'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),N=(x,y)=>{let d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}};
let mode='title',difficulty=1,room=0,elapsed=0,kills=0,cleared=0,toast='',toastT=0,particles=[],texts=[],keys=new Set(),pressed=new Set(),skillRects=[];
const rooms=['祭坛','封门战','宝箱陷阱','机关钥匙','精英战','守门者'];
let player,enemies=[],doorOpen=false,redKey=0,chest=false,orb=false;
function actor(x,y,hp=100,boss=false){return{x,y,hp,max:hp,r:boss?34:20,vx:0,vy:0,stun:0,down:0,inv:0,dead:false,boss,ai:.4,skill:null,phase:'idle',timer:0,cd:{normal:0,smash:0,defense:0,counter:0,windmill:0},target:null};}
function begin(diff){difficulty=diff==='hard'?1.32:1;mode='play';room=0;elapsed=kills=cleared=redKey=0;player=actor(250,350,150);player.revive=1;start.classList.remove('visible');result.classList.remove('visible');enterRoom();}
function enterRoom(){enemies=[];doorOpen=false;chest=false;orb=false;player.x=180;player.y=350;player.skill=null;player.phase='idle';
 if(room===0){doorOpen=true;say('点击右侧石门进入地下城');}
 if(room===1)spawn(3,['goblin','wolf']);
 if(room===2){chest=true;say('靠近并点击宝箱——它可能是陷阱');}
 if(room===3){orb=true;say('点击机关石获得赤色钥匙');}
 if(room===4)spawn(4,['skeleton','brute']);
 if(room===5){enemies.push(makeEnemy(760,350,'boss'));spawn(2,['skeleton']);}
}
function spawn(n,pool){for(let i=0;i<n;i++)enemies.push(makeEnemy(610+(i%2)*230,230+Math.floor(i/2)*210,pool[i%pool.length]));}
function makeEnemy(x,y,t){let cfg={goblin:[58,130],wolf:[50,155],skeleton:[72,112],brute:[115,92],boss:[440,103]}[t],e=actor(x,y,cfg[0]*difficulty,t==='boss');e.spd=cfg[1];e.type=t;return e;}
function say(s){toast=s;toastT=2.8;}
function text(x,y,s,c='#fff',z=18){texts.push({x,y,s,c,z,t:.8});}
function burst(x,y,c,n=8){for(let i=0;i<n;i++){let a=Math.random()*6.28,v=50+Math.random()*100;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c,t:.45});}}
function prep(a,id,target){if(a.dead||a.stun>0||a.down>0||a.cd[id]>0)return;a.skill=id;a.target=target;a.phase='load';a.timer=skills[id].load;text(a.x,a.y-40,skills[id].n,skills[id].c,14);}
function cancel(a){a.skill=null;a.phase='idle';a.timer=0;}
function execute(a){let s=skills[a.skill];if(!s)return;if(a.skill==='defense'||a.skill==='counter')return;if(a.skill==='windmill'){for(let b of foes(a))if(!b.dead&&D(a,b)<s.r+b.r)hit(a,b,a.skill);}
 else if(a.target&&!a.target.dead&&D(a,a.target)<s.r+a.target.r)hit(a,a.target,a.skill);else{text(a.x,a.y-32,'落空','#aaa',14);}
 a.cd[a.skill]=s.cd;cancel(a);}
function foes(a){return a===player?enemies:[player];}
function hit(a,b,id){if(b.dead||b.inv>0)return;let s=skills[id],guard=b.phase==='ready'?b.skill:null;
 if(guard==='counter'&&(id==='normal'||id==='smash')){cancel(b);b.cd.counter=skills.counter.cd;text(b.x,b.y-52,'反击！',skills.counter.c,21);damage(b,a,skills.counter.d*(b.boss?1.2:1),110,true);return;}
 let dmg=s.d,kn=s.k,label='';
 if(guard==='defense'){if(id==='smash'){dmg*=1.2;kn=120;label='破防';cancel(b);}else{dmg*=.2;kn=0;label='防御';}}
 if(guard==='counter'&&id==='windmill'){label='破解反击';cancel(b);dmg*=1.1;}
 if(id==='normal'&&b.phase==='load'&&b.skill==='smash'){label='抢断';dmg*=1.18;}
 damage(a,b,dmg,kn,id==='smash'||id==='windmill');if(label)text(b.x,b.y-50,label,s.c,17);
}
function damage(a,b,dmg,kn,heavy){dmg=Math.max(1,Math.round(dmg));b.hp-=dmg;text(b.x,b.y-28,'-'+dmg,heavy?'#ffd477':'#ff9087',heavy?22:18);burst(b.x,b.y,heavy?'#ffc477':'#ff8f83',heavy?12:7);cancel(b);let n=N(b.x-a.x,b.y-a.y);b.vx=n.x*(kn?250:65);b.vy=n.y*(kn?250:65);if(kn){b.down=.65;b.inv=.16;}else b.stun=.24;if(b.hp<=0){b.hp=0;b.dead=true;if(b!==player){kills++;if(enemies.every(e=>e.dead))clearRoom();}else die();}}
function clearRoom(){doorOpen=true;cleared++;if(room===5){chest=true;say('守门者倒下了，点击中央奖励箱完成探索');}else say('封印解除，右侧石门已经开启');}
function die(){if(player.revive){player.revive=0;setTimeout(()=>{player.dead=false;player.hp=75;player.x=230;player.y=350;player.inv=1.5;say('灵魂石破碎：你重新站了起来');},700);}else finish(false);}
function finish(win){mode=win?'win':'lose';title.textContent=win?'地下城攻略完成':'探索失败';stats.innerHTML=`<div><strong>${Math.floor(elapsed/60)}:${String(Math.floor(elapsed%60)).padStart(2,'0')}</strong><span>探索时间</span></div><div><strong>${kills}</strong><span>击败敌人</span></div><div><strong>${cleared}</strong><span>解除封印</span></div><div><strong>${difficulty>1?'赤色':'普通'}</strong><span>难度</span></div>`;result.classList.add('visible');}
function playerSkill(id){if(player.phase==='ready'&&player.skill===id&&['normal','smash','windmill'].includes(id))execute(player);else prep(player,id,player.target||nearest(player,430));}
function nearest(a,max=999){let best=null,bd=max;for(let e of enemies)if(!e.dead&&D(a,e)<bd){best=e;bd=D(a,e);}return best;}
function click(x,y){if(mode!=='play')return;for(let r of skillRects)if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h){playerSkill(r.id);return;}
 let e=enemies.find(q=>!q.dead&&Math.hypot(q.x-x,q.y-y)<q.r+14);if(e){player.target=e;if(player.phase==='ready'&&['normal','smash'].includes(player.skill))execute(player);else if(player.phase==='idle')prep(player,'normal',e);return;}
 if(chest&&Math.hypot(x-640,y-350)<65){if(room===2&&enemies.length===0){chest=false;spawn(4,['goblin','wolf','skeleton']);say('宝箱陷阱！石门封闭');}else if(room===5&&enemies.every(e=>e.dead))finish(true);return;}
 if(orb&&Math.hypot(x-640,y-350)<65){orb=false;redKey=1;doorOpen=true;cleared++;say('获得赤色钥匙，锁门开启');return;}
 if(x>1120&&Math.abs(y-350)<90&&doorOpen){if(room===3&&!redKey){say('需要赤色钥匙');return;}room++;if(room<rooms.length)enterRoom();return;}
 player.mx=clamp(x,90,1190);player.my=clamp(y,90,590);player.target=null;}
C.addEventListener('pointerdown',e=>{let r=C.getBoundingClientRect();click((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);});
window.addEventListener('keydown',e=>{if(!keys.has(e.code))pressed.add(e.code);keys.add(e.code);if(e.code==='Space')e.preventDefault();});window.addEventListener('keyup',e=>keys.delete(e.code));
document.querySelectorAll('.offering').forEach(b=>b.onclick=()=>begin(b.dataset.difficulty));document.querySelector('#restartButton').onclick=()=>{mode='title';result.classList.remove('visible');start.classList.add('visible');};
function ai(e,dt){if(e.dead)return;e.ai-=dt;if(e.phase==='ready'&&['normal','smash'].includes(e.skill)){e.target=player;if(D(e,player)<skills[e.skill].r+player.r)execute(e);}
 if(e.ai<=0&&e.phase==='idle'&&e.stun<=0&&e.down<=0){e.ai=.45+Math.random()*.5;let ps=player.phase==='ready'||player.phase==='load'?player.skill:null,id=ps==='defense'?'smash':ps==='counter'?'windmill':ps==='smash'?'normal':D(e,player)<85?['normal','defense','counter','windmill'][Math.floor(Math.random()*4)]:'normal';prep(e,id,player);}
 if(e.phase!=='ready'||!['defense','counter'].includes(e.skill)){let d=D(e,player);if(d>58&&e.stun<=0&&e.down<=0){let n=N(player.x-e.x,player.y-e.y);e.x+=n.x*e.spd*dt;e.y+=n.y*e.spd*dt;}}
}
function tickActor(a,dt){for(let k in a.cd)a.cd[k]=Math.max(0,a.cd[k]-dt);a.stun=Math.max(0,a.stun-dt);a.down=Math.max(0,a.down-dt);a.inv=Math.max(0,a.inv-dt);if(a.phase==='load'){a.timer-=dt;if(a.timer<=0){a.phase='ready';a.timer=skills[a.skill].hold||3;if(a.skill==='windmill'&&a!==player&&D(a,player)<105)execute(a);}}else if(a.phase==='ready'){a.timer-=dt;if(a.timer<=0)cancel(a);}if(a.stun>0||a.down>0){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vx*=.87;a.vy*=.87;}a.x=clamp(a.x,95,1185);a.y=clamp(a.y,95,585);}
function update(dt){if(mode!=='play')return;elapsed+=dt;toastT=Math.max(0,toastT-dt);let dx=(keys.has('KeyD')||keys.has('ArrowRight'))-(keys.has('KeyA')||keys.has('ArrowLeft')),dy=(keys.has('KeyS')||keys.has('ArrowDown'))-(keys.has('KeyW')||keys.has('ArrowUp'));if(player.stun<=0&&player.down<=0&&!(player.phase==='ready'&&player.skill==='counter')){if(dx||dy){let n=N(dx,dy);player.x+=n.x*185*dt;player.y+=n.y*185*dt;player.mx=null;}else if(player.mx){let n=N(player.mx-player.x,player.my-player.y),d=Math.hypot(player.mx-player.x,player.my-player.y);if(d>5){player.x+=n.x*185*dt;player.y+=n.y*185*dt;}else player.mx=null;}}
 order.forEach((id,i)=>{if(pressed.has('Digit'+(i+1)))playerSkill(id);});if(pressed.has('Space')&&player.phase==='ready')execute(player);if(pressed.has('Escape')||pressed.has('KeyQ'))cancel(player);pressed.clear();tickActor(player,dt);for(let e of enemies){tickActor(e,dt);ai(e,dt);}for(let p of particles){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;}particles=particles.filter(p=>p.t>0);for(let t of texts){t.t-=dt;t.y-=32*dt;}texts=texts.filter(t=>t.t>0);}
function drawActor(a,enemy=false){if(a.dead)return;X.save();X.translate(a.x,a.y);if(a.phase==='ready'){X.globalAlpha=.22;X.fillStyle=skills[a.skill].c;X.beginPath();X.arc(0,0,a.r+12,0,7);X.fill();X.globalAlpha=1;}X.fillStyle=a.boss?'#966c8e':enemy?(a.type==='brute'?'#a56e52':a.type==='wolf'?'#878b94':'#83a568'):'#e4d18f';X.beginPath();X.arc(0,0,a.r,0,7);X.fill();X.fillStyle='#24262d';X.beginPath();X.arc(6,-3,4,0,7);X.fill();X.restore();let w=a.boss?110:52;X.fillStyle='#16171b';X.fillRect(a.x-w/2,a.y-a.r-17,w,6);X.fillStyle=enemy?'#e76b6c':'#64d78a';X.fillRect(a.x-w/2,a.y-a.r-17,w*a.hp/a.max,6);if(a.skill&&['load','ready'].includes(a.phase)){X.fillStyle='#15171dcc';X.fillRect(a.x-25,a.y-a.r-48,50,24);X.strokeStyle=skills[a.skill].c;X.strokeRect(a.x-25,a.y-a.r-48,50,24);X.fillStyle=skills[a.skill].c;X.font='13px sans-serif';X.textAlign='center';X.fillText(skills[a.skill].n,a.x,a.y-a.r-31);}}
function draw(){X.fillStyle='#15171c';X.fillRect(0,0,W,H);X.fillStyle=room===5?'#2b202b':'#2d3031';X.fillRect(70,70,1140,540);X.strokeStyle='#ffffff0b';for(let x=70;x<1210;x+=48){X.beginPath();X.moveTo(x,70);X.lineTo(x,610);X.stroke();}for(let y=70;y<610;y+=48){X.beginPath();X.moveTo(70,y);X.lineTo(1210,y);X.stroke();}X.fillStyle=doorOpen?'#9d8a63':'#823d3d';X.fillRect(1180,295,30,110);if(chest){X.fillStyle='#c1904e';X.fillRect(605,325,70,48);X.fillStyle='#5a4027';X.fillRect(635,337,10,20);}if(orb){X.fillStyle='#db756b';X.beginPath();X.arc(640,350,34,0,7);X.fill();}for(let e of enemies)drawActor(e,true);drawActor(player);for(let p of particles){X.globalAlpha=p.t/.45;X.fillStyle=p.c;X.fillRect(p.x,p.y,4,4);}X.globalAlpha=1;for(let t of texts){X.globalAlpha=t.t/.8;X.fillStyle=t.c;X.font=`700 ${t.z}px sans-serif`;X.textAlign='center';X.fillText(t.s,t.x,t.y);}X.globalAlpha=1;X.fillStyle='#0a0b0edc';X.fillRect(0,610,W,110);X.fillStyle='#eee7d5';X.font='700 17px sans-serif';X.textAlign='left';X.fillText(`房间 ${room+1}/${rooms.length} · ${rooms[room]}`,24,638);X.fillText(`生命 ${Math.ceil(player?.hp||0)}/${player?.max||150}  灵魂石 ${player?.revive||0}  赤色钥匙 ${redKey}`,24,666);skillRects=[];let sx=430;order.forEach((id,i)=>{let s=skills[id],x=sx+i*82,y=628;skillRects.push({id,x,y,w:70,h:70});X.fillStyle=player?.skill===id?'#45474f':'#24262c';X.fillRect(x,y,70,70);X.strokeStyle=s.c;X.strokeRect(x,y,70,70);X.fillStyle=s.c;X.font='700 15px sans-serif';X.textAlign='center';X.fillText(`${i+1} ${s.n}`,x+35,y+30);X.fillStyle='#aaa';X.font='12px sans-serif';X.fillText((player?.cd[id]||0)>0?(player.cd[id]).toFixed(1):'就绪',x+35,y+53);});if(toastT>0){X.fillStyle='#0a0b0ee6';X.fillRect(270,552,740,38);X.fillStyle='#eee7d5';X.font='15px sans-serif';X.textAlign='center';X.fillText(toast,640,577);}X.fillStyle='#d7c58d';X.font='13px sans-serif';X.textAlign='right';X.fillText('点击移动/攻击 · 1–5预备技能 · Space执行 · Q取消',1250,704);}
let last=performance.now();function loop(now){let dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);

document.querySelector('#muteButton').onclick=()=>say('此预览构建暂未启用音效');
