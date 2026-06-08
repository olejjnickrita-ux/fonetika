let step = 0, score = 0, currentState = {};
const $ = s => document.querySelector(s);
const mount = $('#taskMount'), feedback = $('#feedback');
const screens = {start:$('#startScreen'), game:$('#gameScreen'), final:$('#finalScreen')};
function show(name){Object.values(screens).forEach(s=>s.classList.remove('active'));screens[name].classList.add('active')}
function eqSet(a,b){return a.length===b.length && a.every(x=>b.includes(x))}
function norm(s){return String(s).trim().toLowerCase()}
function updateTop(){ $('#stepLabel').textContent=`Задание ${step+1}/10`; $('#scoreLabel').textContent=`${score} баллов`; $('#progressFill').style.width=`${(step)/TASKS.length*100}%`; }
function title(t){return `<div class="task-title"><div class="num">${step+1}</div><h2>${t}</h2></div>`}
function resetButtons(){feedback.className='feedback'; feedback.innerHTML=''; $('#nextBtn').disabled=true; $('#checkBtn').disabled=false; currentState={scored:false};}
function render(){resetButtons(); updateTop(); const t=TASKS[step]; let html=title(t.title); if(t.hint) html+=`<div class="hint">${t.hint}</div>`;
 if(t.type==='multi') html+=`<div class="options">${t.options.map(o=>`<button class="chip" data-v="${o}">${o}</button>`).join('')}</div>`;
 if(t.type==='matchOne') html+=`<div class="grid">${t.rows.map((r,i)=>`<div class="mini-card"><h3>${r.desc}</h3><div class="options">${r.options.map(o=>`<button class="chip" data-row="${i}" data-v="${o}">${o}</button>`).join('')}</div></div>`).join('')}</div>`;
 if(t.type==='sort') html+=`<div class="options bank">${t.options.map(o=>`<button class="chip" data-v="${o}">${o}</button>`).join('')}</div><div class="grid cats">${Object.keys(t.cats).map(c=>`<div class="mini-card cat" data-cat="${c}"><h3>${c}</h3><div class="drop"></div></div>`).join('')}</div>`;
 if(t.type==='letters'||t.type==='signals') html+=`<div class="wordline">${t.words.map((w,wi)=>`<div class="word" data-wi="${wi}">${[...w.word].map((ch,li)=>`<span class="letter" data-wi="${wi}" data-li="${li}">${ch}</span>`).join('')}</div>`).join('')}</div>`;
 if(t.type==='trans') html+=`<table class="table-task"><tbody>${t.rows.map((r,i)=>`<tr><td><b>${r.word}</b></td><td>${r.options.map(o=>`<button class="chip trans-btn" data-row="${i}" data-v="${o}">${o}</button>`).join('')}</td></tr>`).join('')}</tbody></table>`;
 if(t.type==='fillSyll') html+=`<div class="fill-text text-sentence">${t.textParts.map((p,i)=>`${p}${i<t.blanks.length?`<input maxlength="1" data-blank="${i}">`:''}`).join('')}</div><div class="hint">Запиши количество слогов над каждым словом. Если в слове нет гласного, окошко не появляется.</div><div class="syllables">${t.words.map((w,i)=>`<div class="syllable-item">${t.syll[i]===null?'<div class="no-syll">—</div>':`<input inputmode="numeric" data-syll="${i}">`}<div>${w}</div></div>`).join('')}</div>`;
 if(t.type==='wordReason') html+=t.items.map((it,ii)=>`<div class="mini-card"><p class="text-sentence">${it.sentence.split(/(\s+)/).map(tok=>tok.trim()?`<span class="click-word" data-item="${ii}" data-word="${tok.replace(/[,.]/g,'')}">${tok}</span>`:tok).join('')}</p><div class="explain" id="explain${ii}">Выбери слово.</div></div>`).join('');
 if(t.type==='analysis') html+=renderAnalysis();
 mount.innerHTML=html; bind(t);}
function bind(t){
 mount.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{ if(t.type==='multi'){btn.classList.toggle('selected')} if(t.type==='matchOne'||t.type==='trans'){mount.querySelectorAll(`.chip[data-row="${btn.dataset.row}"]`).forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')} if(t.type==='sort'){selectSort(btn)} });
 mount.querySelectorAll('.letter').forEach(l=>l.onclick=()=>{l.classList.toggle('selected')});
 mount.querySelectorAll('.cat').forEach(c=>c.onclick=()=>dropSort(c));
 mount.querySelectorAll('.click-word').forEach(w=>w.onclick=()=>{const ii=w.dataset.item; w.classList.toggle('selected'); const selected=[...mount.querySelectorAll(`.click-word.selected[data-item="${ii}"]`)].map(x=>x.dataset.word); $('#explain'+ii).textContent = selected.length ? selected.map(s=>TASKS[step].items[ii].answers[s]||'Выбрано лишнее слово').join(' | ') : 'Выбери слово.'});
 mount.querySelectorAll('.analysis-choice').forEach(btn=>btn.onclick=()=>{ const g=btn.dataset.group; mount.querySelectorAll(`.analysis-choice[data-group="${CSS.escape(g)}"]`).forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); });
}
function selectSort(btn){
  // В задании 4 один и тот же звук может относиться сразу к двум группам
  // Например, [ц] — непарный твёрдый и непарный глухой.
  // Поэтому звук из банка не переносим, а копируем в выбранную колонку.
  if(btn.parentElement.classList.contains('drop')){
    btn.remove();
    return;
  }
  mount.querySelectorAll('.bank .chip').forEach(b=>b.classList.remove('selected'));
  btn.classList.toggle('selected');
}
function dropSort(cat){
  const sel=mount.querySelector('.bank .chip.selected');
  if(!sel) return;
  const value=sel.dataset.v;
  const drop=cat.querySelector('.drop');
  // Не добавляем дубль в одну и ту же колонку, но разрешаем этот же звук в другой колонке.
  if(!drop.querySelector(`.chip[data-v="${CSS.escape(value)}"]`)){
    const clone=sel.cloneNode(true);
    clone.classList.remove('selected','good','bad');
    clone.onclick=()=>clone.remove();
    drop.appendChild(clone);
  }
  sel.classList.remove('selected');
}
function showFeedback(ok,msg,answerHtml=''){
 feedback.innerHTML=`<div>${msg}</div>${answerHtml?`<div class="answer-note">${answerHtml}</div>`:''}`;
 feedback.className=`feedback show ${ok?'ok':'no'}`;
 // После проверки всегда можно идти дальше. Если есть ошибка, показываем правильный ответ.
 $('#nextBtn').disabled=false;
 $('#checkBtn').disabled=true;
 if(ok && !currentState.scored){ score++; currentState.scored=true; }
}
function check(){ const t=TASKS[step]; let ok=false;
 if(t.type==='multi'){ const ans=[...mount.querySelectorAll('.chip.selected')].map(b=>b.dataset.v); ok=eqSet(ans,t.answer); markChips(t.answer); }
 if(t.type==='matchOne'||t.type==='trans'){ ok=t.rows.every((r,i)=>{const b=mount.querySelector(`.chip.selected[data-row="${i}"]`); return b&&b.dataset.v===r.answer}); t.rows.forEach((r,i)=>markRow(i,r.answer)); }
 if(t.type==='sort'){ ok=Object.entries(t.cats).every(([cat,arr])=>eqSet([...mount.querySelectorAll(`.cat[data-cat="${cat}"] .chip`)].map(b=>b.dataset.v),arr)); }
 if(t.type==='letters'){ ok=checkLetters(t.words); }
 if(t.type==='signals'){ ok=checkSignals(t.words); }
 if(t.type==='fillSyll'){ ok=t.blanks.every((b,i)=>norm(mount.querySelector(`[data-blank="${i}"]`).value)===b) && t.syll.every((n,i)=> n===null ? true : Number(mount.querySelector(`[data-syll="${i}"]`).value)===n); }
 if(t.type==='wordReason'){ ok=t.items.every((it,ii)=>eqSet([...mount.querySelectorAll(`.click-word.selected[data-item="${ii}"]`)].map(x=>x.dataset.word),Object.keys(it.answers))); }
 if(t.type==='analysis'){ ok=checkAnalysis(); }
 const answerHtml = ok ? '' : getCorrectAnswerText(t);
 showFeedback(ok, ok?'Верно! Можно двигаться дальше.':'Есть ошибка. Посмотри правильный ответ и нажми «Дальше».', answerHtml); updateTop(); }
function markChips(answer){ mount.querySelectorAll('.chip').forEach(b=>{ if(answer.includes(b.dataset.v)) b.classList.add('good'); else if(b.classList.contains('selected')) b.classList.add('bad');});}
function markRow(i,answer){ mount.querySelectorAll(`.chip[data-row="${i}"]`).forEach(b=>{if(b.dataset.v===answer)b.classList.add('good'); else if(b.classList.contains('selected'))b.classList.add('bad')})}
function checkLetters(words){let ok=true; words.forEach((w,wi)=>{const sel=[...mount.querySelectorAll(`.letter.selected[data-wi="${wi}"]`)].map(l=>Number(l.dataset.li)); const targets=Object.keys(w.targets).map(Number); if(!eqSet(sel,targets)) ok=false; targets.forEach(li=>{const el=mount.querySelector(`.letter[data-wi="${wi}"][data-li="${li}"]`); if(!el.querySelector('.sound')) el.insertAdjacentHTML('beforeend',`<span class="sound">${w.targets[li]}</span>`);});}); return ok;}
function checkSignals(words){let ok=true; words.forEach((w,wi)=>{const sel=[...mount.querySelectorAll(`.letter.selected[data-wi="${wi}"]`)].map(l=>Number(l.dataset.li)); if(!eqSet(sel,w.targets)) ok=false; w.targets.forEach(li=>mount.querySelector(`.letter[data-wi="${wi}"][data-li="${li}"]`).classList.add('target'));}); return ok;}
const ANALYSIS_WORDS = [
  {
    word:'сияло', sentence:'Яркое солнце сияло, желтели одуванчики.',
    transcription:'[с’ий’а́ла]', syllables:'3', lettersSounds:'5/6',
    transOptions:['[с’ий’а́ла]','[сый’ала]','[с’ий’ала]'],
    syllOptions:['2','3','4'], lsOptions:['5/6','6/6','6/7'],
    rows:[
      {letter:'с', sound:'[с’]', answer:'согл., мягк., парн., глух., парн.', options:['согл., мягк., парн., глух., парн.','согл., твёрд., парн., глух., парн.','согл., мягк., непарн., звонк., непарн.']},
      {letter:'и', sound:'[и]', answer:'гласн., безуд.', options:['гласн., ударн.','гласн., безуд.']},
      {letter:'я', sound:'[й’]', answer:'согл., мягк., непарн., звонк., непарн.', options:['согл., мягк., непарн., звонк., непарн.','согл., мягк., парн., звонк., парн.','гласн., безуд.']},
      {letter:'', sound:'[а]', answer:'гласн., ударн.', options:['гласн., ударн.','гласн., безуд.']},
      {letter:'л', sound:'[л]', answer:'согл., твёрд., парн., звонк., непарн.', options:['согл., твёрд., парн., звонк., непарн.','согл., мягк., парн., звонк., непарн.','согл., твёрд., парн., глух., парн.']},
      {letter:'о', sound:'[а]', answer:'гласн., безуд.', options:['гласн., ударн.','гласн., безуд.']}
    ]
  },
  {
    word:'яркое', sentence:'Яркое солнце сияло, желтели одуванчики.',
    transcription:'[й’а́ркай’э]', syllables:'3', lettersSounds:'5/7',
    transOptions:['[й’а́ркай’э]','[й’аркэ]','[яркое]'],
    syllOptions:['2','3','4'], lsOptions:['5/5','5/7','6/7'],
    rows:[
      {letter:'я', sound:'[й’]', answer:'согл., мягк., непарн., звонк., непарн.', options:['согл., мягк., непарн., звонк., непарн.','согл., твёрд., парн., звонк., непарн.','гласн., ударн.']},
      {letter:'', sound:'[а]', answer:'гласн., ударн.', options:['гласн., ударн.','гласн., безуд.']},
      {letter:'р', sound:'[р]', answer:'согл., твёрд., парн., звонк., непарн.', options:['согл., твёрд., парн., звонк., непарн.','согл., мягк., парн., звонк., непарн.','согл., твёрд., парн., глух., парн.']},
      {letter:'к', sound:'[к]', answer:'согл., твёрд., парн., глух., парн.', options:['согл., твёрд., парн., глух., парн.','согл., мягк., парн., глух., парн.','согл., твёрд., непарн., звонк., непарн.']},
      {letter:'о', sound:'[а]', answer:'гласн., безуд.', options:['гласн., ударн.','гласн., безуд.']},
      {letter:'е', sound:'[й’]', answer:'согл., мягк., непарн., звонк., непарн.', options:['согл., мягк., непарн., звонк., непарн.','согл., мягк., парн., звонк., парн.','гласн., безуд.']},
      {letter:'', sound:'[э]', answer:'гласн., безуд.', options:['гласн., ударн.','гласн., безуд.']}
    ]
  }
];
function renderAnalysis(){
  return `<div class="hint">Разбор сделан по шагам: выбери транскрипцию, количество слогов, количество букв/звуков и характеристики звуков.</div>
  <div class="analysis-sentence">Яркое солнце сияло, желтели одуванчики.</div>
  <div class="analysis-cards">${ANALYSIS_WORDS.map((w,wi)=>`
    <section class="analysis-card">
      <div class="analysis-word-title">${w.word}</div>
      <div class="analysis-step"><b>1. Транскрипция с ударением</b><div class="choice-row">${w.transOptions.map(o=>`<button class="choice-pill analysis-choice" data-group="w${wi}-trans" data-value="${o}">${o}</button>`).join('')}</div></div>
      <div class="analysis-step"><b>2. Количество слогов</b><div class="choice-row">${w.syllOptions.map(o=>`<button class="choice-pill analysis-choice" data-group="w${wi}-syll" data-value="${o}">${o}</button>`).join('')}</div></div>
      <div class="analysis-step"><b>3. Буквы / звуки</b><div class="choice-row">${w.lsOptions.map(o=>`<button class="choice-pill analysis-choice" data-group="w${wi}-ls" data-value="${o}">${o}</button>`).join('')}</div></div>
      <div class="analysis-step"><b>4. Характеристика звуков</b>
        <div class="sound-table">${w.rows.map((r,ri)=>`
          <div class="sound-row">
            <div class="sound-letter"><span>${r.letter}</span><span>${r.sound}</span></div>
            <div class="choice-row compact">${r.options.map(o=>`<button class="choice-pill small analysis-choice" data-group="w${wi}-r${ri}" data-value="${o}">${o}</button>`).join('')}</div>
          </div>`).join('')}</div>
      </div>
    </section>`).join('')}</div>
  <div class="hint">После проверки игра покажет правильный разбор и темы для повторения.</div>`; }
function checkAnalysis(){
  let ok=true;
  ANALYSIS_WORDS.forEach((w,wi)=>{
    const checks = [
      [`w${wi}-trans`, w.transcription],
      [`w${wi}-syll`, w.syllables],
      [`w${wi}-ls`, w.lettersSounds]
    ];
    w.rows.forEach((r,ri)=>checks.push([`w${wi}-r${ri}`, r.answer]));
    checks.forEach(([group,answer])=>{
      const selected=mount.querySelector(`.analysis-choice.selected[data-group="${CSS.escape(group)}"]`);
      mount.querySelectorAll(`.analysis-choice[data-group="${CSS.escape(group)}"]`).forEach(btn=>{
        btn.classList.remove('good','bad');
        if(btn.dataset.value===answer) btn.classList.add('good');
        else if(btn.classList.contains('selected')) btn.classList.add('bad');
      });
      if(!selected || selected.dataset.value!==answer) ok=false;
    });
  });
  return ok;
}
function getCorrectAnswerText(t){
 if(t.type==='multi') return `<b>Правильный ответ:</b> ${t.answer.join(', ')}`;
 if(t.type==='matchOne') return `<b>Правильный ответ:</b><br>${t.rows.map(r=>`${r.desc} — ${r.answer}`).join('<br>')}`;
 if(t.type==='trans') return `<b>Правильный ответ:</b><br>${t.rows.map(r=>`${r.word} — ${r.answer}`).join('<br>')}`;
 if(t.type==='sort') return `<b>Правильное распределение:</b><br>${Object.entries(t.cats).map(([cat,arr])=>`${cat}: ${arr.join(', ')}`).join('<br>')}`;
 if(t.type==='letters') return `<b>Правильный ответ:</b> жизнь — [з’], [н’]; чаща — [ч’], [щ’]; схема — [х’]; пировать — [п’], [т’]; лён — [л’]; люк — [л’]; мять — [м’], [т’].`;
 if(t.type==='signals') return `<b>Правильный ответ:</b> схема — е; пировать — и, ь; лён — ё; люк — ю; мять — я, ь.`;
 if(t.type==='fillSyll') return `<b>Правильный ответ:</b><br>Я отправился за город в лес поглядеть, заметно ли там приближение весны.<br>Количество слогов: ${t.words.map((w,i)=>t.syll[i]===null?`${w} — нет слога`:`${w} — ${t.syll[i]}`).join('; ')}`;
 if(t.type==='wordReason') return `<b>Правильный ответ:</b><br>${t.items.map(it=>Object.entries(it.answers).map(([w,reason])=>`${w} — ${reason}`).join('<br>')).join('<br>')}`;
 if(t.type==='analysis') return `<b>Правильный ответ:</b><br>${ANALYSIS_WORDS.map(w=>`<b>${w.word}</b> — ${w.transcription}, ${w.syllables} слога, ${w.lettersSounds.replace('/',' букв / ')} звуков.<br>${w.rows.map(r=>`${r.letter ? r.letter + ' ' : '&nbsp;&nbsp;'}${r.sound} — ${r.answer}`).join('<br>')}`).join('<br><br>')}`;
 return '';
}
function next(){ if(step<TASKS.length-1){ step++; render(); } else finish();}
function finish(){ $('#progressFill').style.width='100%'; $('#finalScore').textContent=`Ты набрал(а) ${score} из ${TASKS.length} баллов.`; $('#repeatList').innerHTML=FINAL_TOPICS.map(x=>`<li>${x}</li>`).join(''); show('final');}
$('#startBtn').onclick=()=>{step=0;score=0;show('game');render();}; $('#homeBtn').onclick=()=>show('start'); $('#checkBtn').onclick=check; $('#nextBtn').onclick=next; $('#restartBtn').onclick=()=>{step=0;score=0;show('game');render();};
