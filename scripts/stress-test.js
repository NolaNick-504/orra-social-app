#!/usr/bin/env node
/**
 * ORRA Stress Test v6 — Fast 30-Agent Test
 * Reduced counts per operation, 5-per-batch, tight timeouts
 */

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'orra-super-secret-key-2025-production';
const BATCH = 5;
const BOT_IDS = Array.from({length:16},(_,i)=>`u${i+1}`);
const vibeTags = ['hyped','chill','dramatic','peaceful','laughing','focused'];

const R = { total:0, passed:0, failed:0, errors:{}, lat:{} };

function rec(test, ok, ms, detail='') {
  R.total++;
  if (ok) R.passed++; else { R.failed++; const k=`${test}: ${detail}`; R.errors[k]=(R.errors[k]||0)+1; }
  if (!R.lat[test]) R.lat[test] = [];
  R.lat[test].push(ms);
}

async function tf(url, opts={}) {
  const s = Date.now();
  try {
    const r = await fetch(url, {...opts, signal: AbortSignal.timeout(5000)});
    const ms = Date.now()-s;
    return {status:r.status,ms,ok:r.ok};
  } catch(e) { return {status:0,ms:Date.now()-s,ok:false}; }
}

async function batch(label, count, fn) {
  let ok=0, totalMs=0;
  for (let b=0; b<Math.ceil(count/BATCH); b++) {
    const n = Math.min(BATCH, count-b*BATCH);
    const outcomes = await Promise.all(Array.from({length:n},(_,i)=>fn(b*BATCH+i)));
    outcomes.forEach(o=>{ rec(label,o.ok,o.ms,`S:${o.status}`); totalMs+=o.ms; if(o.ok)ok++; });
  }
  console.log(`   ${ok}/${count} OK | avg:${Math.round(totalMs/count)}ms`);
}

async function main() {
  const T0 = Date.now();
  console.log('═'.repeat(55));
  console.log(' ORRA 30-AGENT STRESS TEST v6');
  console.log('═'.repeat(55));

  // LOGIN
  console.log('\n🔐 1. Auth');
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie() || [];
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`,{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded','Cookie':csrfCookies.join('; ')},
    body:`csrfToken=${csrfData.csrfToken}&email=nickjoseph8087%40gmail.com&password=Weareone504`,
    redirect:'manual'
  });
  const loginCookies = loginRes.headers.getSetCookie() || [];
  const ck = [...csrfCookies,...loginCookies].join('; ');
  const ses = await (await fetch(`${BASE_URL}/api/auth/session`,{headers:{Cookie:ck}})).json();
  if (!ses.user) { console.log(' ❌ Auth failed'); process.exit(1); }
  console.log('   ✅', ses.user.name);

  // Prefetch posts
  const pr = await (await fetch(`${BASE_URL}/api/posts?page=1&limit=30`,{headers:{Cookie:ck}})).json();
  const pids = (pr?.data?.posts||[]).map(p=>p.id);
  console.log(`   📋 ${pids.length} posts available`);

  // 2. FEED
  console.log('\n📱 2. Feed Reads');
  await batch('feed',30,i=>tf(`${BASE_URL}/api/posts?page=${(i%5)+1}&limit=20`,{headers:{Cookie:ck}}));

  // 3. POSTS
  console.log('\n✍️ 3. Create Posts');
  await batch('post',30,i=>tf(`${BASE_URL}/api/posts`,{
    method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
    body:JSON.stringify({text:`Stress #${i} ${Date.now()}`,vibeTag:vibeTags[i%6],type:'text',images:[]})
  }));

  // 4. LIKES
  console.log('\n❤️ 4. Likes');
  if(pids.length>0){
    const rx=['like','wow','omg','laughing','care','sad'];
    await batch('like',30,i=>tf(`${BASE_URL}/api/likes`,{
      method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
      body:JSON.stringify({targetId:pids[i%pids.length],targetType:'post',reactionType:rx[i%6]})
    }));
  } else console.log('   ⚠️ Skipped');

  // 5. COMMENTS
  console.log('\n💬 5. Comments');
  if(pids.length>0){
    const ct=['Fire!','No cap','Facts!','Vibes','Real talk','Period','Slay','Obsessed','So true','Needed this'];
    await batch('comment',30,i=>tf(`${BASE_URL}/api/comments`,{
      method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
      body:JSON.stringify({text:`${ct[i%10]} [a${i}]`,postId:pids[i%pids.length]})
    }));
  } else console.log('   ⚠️ Skipped');

  // 6. PROFILES
  console.log('\n👤 6. Profiles');
  await batch('profile_r',30,i=>tf(`${BASE_URL}/api/users/${BOT_IDS[i%16]}`,{headers:{Cookie:ck}}));

  // 7. PROFILE UPDATES
  console.log('\n✏️ 7. Profile Updates');
  await batch('profile_u',30,i=>tf(`${BASE_URL}/api/users/profile`,{
    method:'PUT',headers:{'Content-Type':'application/json',Cookie:ck},
    body:JSON.stringify({bio:`Agent ${i}`,location:['NYC','LA','Miami','Chicago','Atlanta'][i%5]})
  }));

  // 8. REELS
  console.log('\n🎬 8. Reels');
  await batch('reels',30,i=>tf(`${BASE_URL}/api/reels?page=${(i%3)+1}&limit=10`,{headers:{Cookie:ck}}));

  // 9. STORIES
  console.log('\n📸 9. Stories');
  await batch('stories',30,i=>tf(`${BASE_URL}/api/stories`,{headers:{Cookie:ck}}));

  // 10. NOTIFICATIONS
  console.log('\n🔔 10. Notifications');
  await batch('notif',30,i=>tf(`${BASE_URL}/api/notifications`,{headers:{Cookie:ck}}));

  // 11. SEARCH
  console.log('\n🔍 11. Search');
  const sq=['music','fashion','sports','tech','food','art','gaming','NBA','AI','ORRA',
    'recipe','travel','meme','coffee','studio','vibes','dance','wellness','culture','hip-hop',
    'concert','sneakers','yoga','coding','startup','design','dog','cat','fitness','album'];
  await batch('search',30,i=>tf(`${BASE_URL}/api/search?q=${encodeURIComponent(sq[i%30])}`,{headers:{Cookie:ck}}));

  // 12. HUBS
  console.log('\n🏘️ 12. Hubs');
  await batch('hubs',30,i=>tf(`${BASE_URL}/api/hubs?page=${(i%3)+1}`,{headers:{Cookie:ck}}));

  // 13. DANCE
  console.log('\n💃 13. Dance');
  await batch('dance',30,i=>tf(`${BASE_URL}/api/dance`,{headers:{Cookie:ck}}));

  // 14. CHALLENGES
  console.log('\n🎮 14. Challenges');
  await batch('challenges',30,i=>tf(`${BASE_URL}/api/challenges`,{headers:{Cookie:ck}}));

  // 15. AUTO-POST
  console.log('\n🤖 15. Auto-Post');
  await batch('auto_post',30,i=>tf(`${BASE_URL}/api/auto-post`,{
    method:'POST',headers:{'Content-Type':'application/json','x-autopost-key':API_KEY},
    body:JSON.stringify({text:`Bot #${i} ${Date.now()}`,vibeTag:vibeTags[i%6],authorId:BOT_IDS[i%16],type:'text',images:[]})
  }));

  // 16. AUTO-LIKE
  console.log('\n🤖 16. Auto-Like');
  if(pids.length>0){
    const rx=['like','wow','omg','laughing','care','sad'];
    await batch('auto_like',30,i=>tf(`${BASE_URL}/api/auto-like`,{
      method:'POST',headers:{'Content-Type':'application/json','x-autopost-key':API_KEY},
      body:JSON.stringify({targetId:pids[i%pids.length],targetType:'post',reactionType:rx[i%6],userId:BOT_IDS[i%16]})
    }));
  } else console.log('   ⚠️ Skipped');

  // 17. AUTO-COMMENT
  console.log('\n🤖 17. Auto-Comment');
  if(pids.length>0){
    const at=['So real!','Facts!','Needed this','INSANE','LMAO','Resonates'];
    await batch('auto_comment',30,i=>tf(`${BASE_URL}/api/auto-comment`,{
      method:'POST',headers:{'Content-Type':'application/json','x-autopost-key':API_KEY},
      body:JSON.stringify({postId:pids[i%pids.length],text:`${at[i%6]} [s${i}]`,authorId:BOT_IDS[i%16]})
    }));
  } else console.log('   ⚠️ Skipped');

  // 18. FOLLOWS
  console.log('\n👥 18. Follows');
  await batch('follow',30,i=>tf(`${BASE_URL}/api/follows`,{
    method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
    body:JSON.stringify({userId:BOT_IDS[i%16]})
  }));

  // 19. SAVES
  console.log('\n🔖 19. Saves');
  if(pids.length>0){
    await batch('save',30,i=>tf(`${BASE_URL}/api/saves`,{
      method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
      body:JSON.stringify({targetId:pids[i%pids.length],targetType:'post'})
    }));
  } else console.log('   ⚠️ Skipped');

  // 20. CHAT
  console.log('\n💌 20. Chat');
  let chatId=null;
  try{
    const chr=await fetch(`${BASE_URL}/api/chats`,{headers:{Cookie:ck}});
    const chd=await chr.json();
    const chats=chd?.data?.chats||chd?.chats||chd||[];
    if(chats.length>0)chatId=chats[0].id;
    if(!chatId){
      const ccr=await tf(`${BASE_URL}/api/chats`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},body:JSON.stringify({participantId:'u1'})});
      try{const d=JSON.parse(ccr.body||'{}');chatId=d?.data?.id||d?.id||d?.chatId;}catch{}
    }
  }catch{}
  if(chatId){
    const mg=['Hey!','Wyd?','Vibing','You online?','Sup','ORRA fire','Test','Wya?'];
    await batch('chat',30,i=>tf(`${BASE_URL}/api/chats/${chatId}/messages`,{
      method:'POST',headers:{'Content-Type':'application/json',Cookie:ck},
      body:JSON.stringify({text:`${mg[i%8]} [a${i}]`})
    }));
  } else console.log('   ⚠️ Skipped');

  // 21. MIXED BURST
  console.log('\n💥 21. Mixed Burst (50 ops)');
  const mp=[];
  for(let i=0;i<15;i++) mp.push(tf(`${BASE_URL}/api/posts?page=${(i%5)+1}&limit=10`,{headers:{Cookie:ck}}));
  for(let i=0;i<10;i++) mp.push(tf(`${BASE_URL}/api/users/${BOT_IDS[i%16]}`,{headers:{Cookie:ck}}));
  for(let i=0;i<10;i++) mp.push(tf(`${BASE_URL}/api/notifications`,{headers:{Cookie:ck}}));
  for(let i=0;i<15;i++) mp.push(tf(`${BASE_URL}/api/reels?page=${(i%3)+1}`,{headers:{Cookie:ck}}));
  const mo=await Promise.all(mp);
  mo.forEach(o=>{rec('mixed',o.status<500,o.ms,`S:${o.status}`);});
  console.log(`   ${mo.filter(o=>o.status<500).length}/${mp.length} OK | avg:${Math.round(mo.reduce((s,o)=>s+o.ms,0)/mo.length)}ms`);

  // ═══ RESULTS ═══
  const elapsed=((Date.now()-T0)/1000).toFixed(1);
  const rate=R.total>0?((R.passed/R.total)*100).toFixed(1):'0';
  console.log('\n'+('═').repeat(55));
  console.log(' RESULTS');
  console.log('═'.repeat(55));
  console.log(` Tests: ${R.total} | Passed: ${R.passed} ✅ | Failed: ${R.failed} ❌`);
  console.log(` Pass Rate: ${rate}% | Time: ${elapsed}s`);
  console.log('─'.repeat(55));

  console.log('\n Latency:');
  for(const [c,lats] of Object.entries(R.lat)){
    const avg=Math.round(lats.reduce((s,v)=>s+v,0)/lats.length);
    const mx=Math.max(...lats);
    const sorted=[...lats].sort((a,b)=>a-b);
    const p95=sorted[Math.floor(sorted.length*0.95)]||mx;
    const icon=avg<200?'🟢':avg<500?'🟡':'🔴';
    console.log(` ${icon} ${c.padEnd(16)} avg:${String(avg).padStart(4)}ms  p95:${String(p95).padStart(4)}ms  max:${String(mx).padStart(4)}ms  n:${lats.length}`);
  }

  if(Object.keys(R.errors).length>0){
    console.log('\n Errors:');
    Object.entries(R.errors).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,c])=>console.log(` ❌ [${c}x] ${k}`));
  }

  const pr2=parseFloat(rate);
  let g=pr2>=98?'A+ 🏆':pr2>=95?'A':pr2>=90?'A-':pr2>=85?'B+':pr2>=80?'B':pr2>=70?'C':'F 💀';
  console.log('\n═'.repeat(55));
  console.log(` GRADE: ${g} (${rate}%)`);
  console.log('═'.repeat(55));
}

main().catch(e=>{console.error('Fatal:',e);process.exit(1);});
