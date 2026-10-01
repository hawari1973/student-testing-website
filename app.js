const STORAGE_KEY='survey_studio_v1';
const app=document.getElementById('app');
const toastEl=document.getElementById('toast');
const TYPES={
  short:{label:'Short text',icon:'Aa'},long:{label:'Long text',icon:'¶'},single:{label:'Multiple choice',icon:'◉'},multi:{label:'Checkboxes',icon:'☑'},dropdown:{label:'Dropdown',icon:'⌄'},rating:{label:'Rating 1–5',icon:'★'},scale:{label:'Linear scale',icon:'↔'},yesno:{label:'Yes / No',icon:'✓'},email:{label:'Email',icon:'@'},number:{label:'Number',icon:'#'},date:{label:'Date',icon:'▣'}
};
let selectedQuestionId=null;
let saveTimer=null;

function uid(prefix='id'){return prefix+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{surveys:[],responses:[]}}catch{return {surveys:[],responses:[]}}}
function save(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function data(){return load()}
function surveyById(id){return data().surveys.find(s=>s.id===id)}
function responsesFor(id){return data().responses.filter(r=>r.surveyId===id)}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1800)}
function fmtDate(v){try{return new Date(v).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}catch{return ''}}
function nav(){return `<header class="topbar"><a class="brand" href="#/"><span class="brand-mark">S</span><span>Survey Studio</span></a><div class="nav-actions"><a class="btn btn-ghost hide-mobile" href="#/">My surveys</a><button class="btn btn-primary" onclick="createSurvey()">+ New survey</button><div class="avatar">MA</div></div></header>`}
function shell(content){app.innerHTML=`<div class="app-shell">${nav()}${content}</div>`}

function createSurvey(){
  const d=data();
  const s={id:uid('survey'),title:'Untitled survey',description:'Tell people what this survey is about.',questions:[],status:'draft',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),theme:{brand:'#5b4ff6'}};
  d.surveys.unshift(s);save(d);location.hash=`#/builder/${s.id}`;
}
function deleteSurvey(id){if(!confirm('Delete this survey and its responses?'))return;const d=data();d.surveys=d.surveys.filter(s=>s.id!==id);d.responses=d.responses.filter(r=>r.surveyId!==id);save(d);render();toast('Survey deleted')}
function duplicateSurvey(id){const s=surveyById(id);if(!s)return;const d=data();const copy=JSON.parse(JSON.stringify(s));copy.id=uid('survey');copy.title=s.title+' (copy)';copy.status='draft';copy.createdAt=copy.updatedAt=new Date().toISOString();copy.questions.forEach(q=>q.id=uid('q'));d.surveys.unshift(copy);save(d);render();toast('Survey duplicated')}

function dashboard(){
  const d=data(); const allResponses=d.responses.length; const live=d.surveys.filter(s=>s.status==='published').length;
  const rows=d.surveys.map(s=>{const count=d.responses.filter(r=>r.surveyId===s.id).length;return `<article class="card survey-row"><div><div class="survey-title">${esc(s.title)}</div><div class="survey-meta"><span class="status">${s.status==='published'?'Published':'Draft'}</span><span>${s.questions.length} questions</span><span>${count} responses</span><span>Updated ${fmtDate(s.updatedAt)}</span></div></div><div class="row-actions"><a class="btn btn-secondary btn-sm" href="#/builder/${s.id}">Edit</a><a class="btn btn-secondary btn-sm" href="#/survey/${s.id}">Preview</a><a class="btn btn-secondary btn-sm" href="#/results/${s.id}">Results</a><button class="btn btn-ghost btn-sm" onclick="duplicateSurvey('${s.id}')">Duplicate</button><button class="btn btn-danger btn-sm" onclick="deleteSurvey('${s.id}')">Delete</button></div></article>`}).join('');
  shell(`<main class="container"><section class="hero"><div><h1>Build better surveys.</h1><p>Create questions, collect feedback, plus turn responses into clear results. Everything starts in one simple workspace.</p></div><button class="btn btn-primary" onclick="createSurvey()">+ Create survey</button></section><section class="stats"><div class="stat"><div class="num">${d.surveys.length}</div><div class="label">Total surveys</div></div><div class="stat"><div class="num">${live}</div><div class="label">Published</div></div><div class="stat"><div class="num">${allResponses}</div><div class="label">Responses</div></div><div class="stat"><div class="num">${d.surveys.reduce((n,s)=>n+s.questions.length,0)}</div><div class="label">Questions created</div></div></section>${rows?`<section class="survey-list">${rows}</section>`:`<section class="card empty"><div class="empty-icon">📝</div><h3>No surveys yet</h3><p>Kick off your first survey and choose from 11 question types.</p><button class="btn btn-primary" onclick="createSurvey()">Create your first survey</button></section>`}</main>`)
}

function defaultQuestion(type){
  const q={id:uid('q'),type,title:TYPES[type].label,required:false};
  if(['single','multi','dropdown'].includes(type))q.options=['Option 1','Option 2','Option 3'];
  if(type==='scale')q.scale={min:1,max:5,minLabel:'Low',maxLabel:'High'};
  return q;
}
function addQuestion(sid,type){const d=data();const s=d.surveys.find(x=>x.id===sid);const q=defaultQuestion(type);s.questions.push(q);s.updatedAt=new Date().toISOString();save(d);selectedQuestionId=q.id;builder(sid);setTimeout(()=>document.getElementById(`q-${q.id}`)?.scrollIntoView({behavior:'smooth',block:'center'}),30)}
function updateSurvey(sid,patch){const d=data();const s=d.surveys.find(x=>x.id===sid);Object.assign(s,patch,{updatedAt:new Date().toISOString()});save(d)}
function updateQuestion(sid,qid,patch,rerender=false){const d=data();const s=d.surveys.find(x=>x.id===sid);const q=s.questions.find(x=>x.id===qid);Object.assign(q,patch);s.updatedAt=new Date().toISOString();save(d);if(rerender)builder(sid)}
function changeType(sid,qid,type){const q=surveyById(sid)?.questions.find(x=>x.id===qid);const patch={type};if(['single','multi','dropdown'].includes(type)&&!q.options)patch.options=['Option 1','Option 2','Option 3'];if(type==='scale'&&!q.scale)patch.scale={min:1,max:5,minLabel:'Low',maxLabel:'High'};updateQuestion(sid,qid,patch,true)}
function removeQuestion(sid,qid){const d=data();const s=d.surveys.find(x=>x.id===sid);s.questions=s.questions.filter(q=>q.id!==qid);s.updatedAt=new Date().toISOString();save(d);selectedQuestionId=null;builder(sid)}
function duplicateQuestion(sid,qid){const d=data();const s=d.surveys.find(x=>x.id===sid);const i=s.questions.findIndex(q=>q.id===qid);const q=JSON.parse(JSON.stringify(s.questions[i]));q.id=uid('q');s.questions.splice(i+1,0,q);s.updatedAt=new Date().toISOString();save(d);selectedQuestionId=q.id;builder(sid)}
function moveQuestion(sid,qid,dir){const d=data();const s=d.surveys.find(x=>x.id===sid);const i=s.questions.findIndex(q=>q.id===qid),j=i+dir;if(j<0||j>=s.questions.length)return;[s.questions[i],s.questions[j]]=[s.questions[j],s.questions[i]];s.updatedAt=new Date().toISOString();save(d);builder(sid)}
function updateOption(sid,qid,index,value){const d=data();const s=d.surveys.find(x=>x.id===sid);const q=s.questions.find(x=>x.id===qid);q.options[index]=value;s.updatedAt=new Date().toISOString();save(d)}
function addOption(sid,qid){const d=data();const s=d.surveys.find(x=>x.id===sid);const q=s.questions.find(x=>x.id===qid);q.options.push(`Option ${q.options.length+1}`);s.updatedAt=new Date().toISOString();save(d);builder(sid)}
function removeOption(sid,qid,index){const d=data();const s=d.surveys.find(x=>x.id===sid);const q=s.questions.find(x=>x.id===qid);if(q.options.length<=1)return toast('Keep at least one option');q.options.splice(index,1);s.updatedAt=new Date().toISOString();save(d);builder(sid)}
function publishSurvey(sid){const s=surveyById(sid);if(!s.questions.length)return toast('Add at least one question first');updateSurvey(sid,{status:'published'});builder(sid);toast('Survey published')}
function unpublishSurvey(sid){updateSurvey(sid,{status:'draft'});builder(sid);toast('Survey moved to draft')}
function debounceSurvey(sid,patch){clearTimeout(saveTimer);saveTimer=setTimeout(()=>updateSurvey(sid,patch),250)}

function qEditor(sid,q,index){
 const choice=['single','multi','dropdown'].includes(q.type)?`<div class="choice-list">${q.options.map((o,i)=>`<div class="choice-row"><span class="${q.type==='multi'?'box':'dot'}"></span><input class="field" value="${esc(o)}" oninput="updateOption('${sid}','${q.id}',${i},this.value)"><button class="icon-btn" onclick="removeOption('${sid}','${q.id}',${i})" title="Remove option">✕</button></div>`).join('')}<button class="add-option" onclick="addOption('${sid}','${q.id}')">+ Add option</button></div>`:'';
 const placeholder=q.type==='long'?'<textarea class="field" rows="3" disabled placeholder="Long answer text"></textarea>':(['short','email','number','date'].includes(q.type)?`<input class="field" disabled placeholder="${TYPES[q.type].label} answer">`:q.type==='rating'?'<div class="muted">☆ ☆ ☆ ☆ ☆</div>':q.type==='scale'?'<div class="muted">1 &nbsp; 2 &nbsp; 3 &nbsp; 4 &nbsp; 5</div>':q.type==='yesno'?'<div class="muted">○ Yes &nbsp;&nbsp; ○ No</div>':'');
 return `<article id="q-${q.id}" class="card question-card ${selectedQuestionId===q.id?'active':''}" onclick="selectedQuestionId='${q.id}';document.querySelectorAll('.question-card').forEach(x=>x.classList.remove('active'));this.classList.add('active')"><div class="q-title"><input class="field" value="${esc(q.title)}" oninput="updateQuestion('${sid}','${q.id}',{title:this.value})"></div><select class="select" onchange="changeType('${sid}','${q.id}',this.value)">${Object.entries(TYPES).map(([k,t])=>`<option value="${k}" ${q.type===k?'selected':''}>${t.label}</option>`).join('')}</select>${choice||`<div style="margin-top:12px">${placeholder}</div>`}<div class="question-toolbar"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();moveQuestion('${sid}','${q.id}',-1)" ${index===0?'disabled':''}>↑</button><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();moveQuestion('${sid}','${q.id}',1)">↓</button><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();duplicateQuestion('${sid}','${q.id}')">Duplicate</button><label class="btn btn-ghost btn-sm"><input type="checkbox" ${q.required?'checked':''} onchange="updateQuestion('${sid}','${q.id}',{required:this.checked})"> Required</label><button class="btn btn-danger btn-sm" onclick="event.stopPropagation();removeQuestion('${sid}','${q.id}')">Delete</button></div></article>`
}

function builder(sid){
 const s=surveyById(sid);if(!s)return location.hash='#/';
 const types=Object.entries(TYPES).map(([k,t])=>`<button class="question-type" onclick="addQuestion('${sid}','${k}')"><span class="qicon">${t.icon}</span>${t.label}</button>`).join('');
 const questions=s.questions.map((q,i)=>qEditor(sid,q,i)).join('');
 const share=`${location.href.split('#')[0]}#/survey/${sid}`;
 shell(`<main class="container"><section class="hero"><div><div class="muted tiny">SURVEY BUILDER</div><h1 style="font-size:28px">${esc(s.title)}</h1></div><div class="row-actions"><a class="btn btn-secondary" href="#/survey/${sid}">Preview</a><a class="btn btn-secondary" href="#/results/${sid}">Results</a>${s.status==='published'?`<button class="btn btn-secondary" onclick="unpublishSurvey('${sid}')">Unpublish</button><button class="btn btn-primary" onclick="showShare('${sid}')">Share</button>`:`<button class="btn btn-primary" onclick="publishSurvey('${sid}')">Publish survey</button>`}</div></section><div class="builder-layout"><aside class="card panel sidebar"><h3>Add question</h3><div class="type-grid">${types}</div></aside><section class="canvas"><div class="card survey-head"><input class="title-input" value="${esc(s.title)}" oninput="debounceSurvey('${sid}',{title:this.value})"><textarea oninput="debounceSurvey('${sid}',{description:this.value})">${esc(s.description)}</textarea></div>${questions||`<div class="card empty"><div class="empty-icon">＋</div><h3>Add your first question</h3><p>Pick a question type from the panel.</p></div>`}</section><aside class="card panel inspector"><h3>Survey settings</h3><div class="setting-row"><div><strong>Status</strong><div class="tiny muted">Who can respond</div></div><span class="status">${s.status}</span></div><div class="setting-row"><div><strong>Questions</strong><div class="tiny muted">Total in survey</div></div><b>${s.questions.length}</b></div><div class="setting-row"><div><strong>Responses</strong><div class="tiny muted">Collected here</div></div><b>${responsesFor(sid).length}</b></div>${s.status==='published'?`<div style="margin-top:14px"><div class="tiny muted" style="margin-bottom:7px">Share link</div><input class="field" value="${esc(share)}" readonly onclick="this.select()"><button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="copyText('${esc(share)}')">Copy link</button></div>`:''}<div class="code-note" style="margin-top:14px">This version stores data in the browser. Connect a hosted database before using it for public, multi-device response collection.</div></aside></div></main>`)
}

function showShare(sid){const url=`${location.href.split('#')[0]}#/survey/${sid}`;document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal" onclick="if(event.target===this)this.remove()"><div class="modal"><h2>Share your survey</h2><p>Send this link to respondents.</p><div class="share-box"><input class="field" id="shareLink" value="${esc(url)}" readonly><button class="btn btn-primary" onclick="copyText(document.getElementById('shareLink').value)">Copy</button></div><div class="code-note" style="margin-top:14px">For real respondents on different devices, add shared database storage. The current prototype stores responses locally in each browser.</div><div class="modal-actions"><button class="btn btn-secondary" onclick="document.getElementById('modal').remove()">Close</button></div></div></div>`)}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Link copied')}catch{toast('Copy the link manually')}}

function inputFor(q){
 const name=`q_${q.id}`, req=q.required?'required':'';
 if(q.type==='short')return `<input class="field" name="${name}" ${req} placeholder="Your answer">`;
 if(q.type==='long')return `<textarea class="field" rows="4" name="${name}" ${req} placeholder="Your answer"></textarea>`;
 if(q.type==='email')return `<input class="field" type="email" name="${name}" ${req} placeholder="name@example.com">`;
 if(q.type==='number')return `<input class="field" type="number" name="${name}" ${req}>`;
 if(q.type==='date')return `<input class="field" type="date" name="${name}" ${req}>`;
 if(q.type==='dropdown')return `<select class="select" name="${name}" ${req}><option value="">Choose an option</option>${q.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`;
 if(q.type==='single')return q.options.map(o=>`<label class="option"><input type="radio" name="${name}" value="${esc(o)}" ${req}> ${esc(o)}</label>`).join('');
 if(q.type==='multi')return q.options.map(o=>`<label class="option"><input type="checkbox" name="${name}" value="${esc(o)}"> ${esc(o)}</label>`).join('');
 if(q.type==='yesno')return `<label class="option"><input type="radio" name="${name}" value="Yes" ${req}> Yes</label><label class="option"><input type="radio" name="${name}" value="No" ${req}> No</label>`;
 if(q.type==='rating')return `<div class="scale">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}" ${req}>★ ${n}</label>`).join('')}</div>`;
 if(q.type==='scale')return `<div class="scale">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${name}" value="${n}" ${req}>${n}</label>`).join('')}</div><div style="display:flex;justify-content:space-between;margin-top:7px" class="tiny muted"><span>${esc(q.scale?.minLabel||'Low')}</span><span>${esc(q.scale?.maxLabel||'High')}</span></div>`;
 return '';
}
function publicSurvey(sid){
 const s=surveyById(sid);if(!s)return shell('<main class="preview-wrap"><div class="card empty"><h3>Survey not found</h3><p>This survey may have been removed.</p><a class="btn btn-primary" href="#/">Back home</a></div></main>');
 const qs=s.questions.map((q,i)=>`<div class="public-q"><label class="title">${i+1}. ${esc(q.title)} ${q.required?'<span class="required">*</span>':''}</label>${inputFor(q)}</div>`).join('');
 shell(`<main class="preview-wrap"><form class="card public-survey" onsubmit="submitResponse(event,'${sid}')"><div class="cover" style="background:${esc(s.theme?.brand||'#5b4ff6')}"></div><div class="public-head"><div class="tiny muted" style="margin-bottom:7px">SURVEY</div><h1>${esc(s.title)}</h1><p>${esc(s.description)}</p></div><div class="public-body">${qs||'<div class="empty"><p>This survey has no questions yet.</p></div>'}${qs?'<button class="btn btn-primary" type="submit" style="margin-top:22px">Submit response</button>':''}</div></form><div class="tiny muted" style="text-align:center;margin-top:13px">Powered by Survey Studio</div></main>`)
}
function submitResponse(e,sid){
 e.preventDefault();const s=surveyById(sid);const fd=new FormData(e.target),answers={};
 for(const q of s.questions){const name=`q_${q.id}`;if(q.type==='multi')answers[q.id]=fd.getAll(name);else answers[q.id]=fd.get(name)||'';if(q.required&&(q.type==='multi'?!answers[q.id].length:!answers[q.id]))return toast(`Please answer: ${q.title}`)}
 const d=data();d.responses.push({id:uid('response'),surveyId:sid,answers,submittedAt:new Date().toISOString()});save(d);
 e.target.outerHTML=`<div class="card success-box"><div class="success-check">✓</div><h2>Response submitted</h2><p>Thank you. Your feedback has been recorded.</p></div>`;window.scrollTo({top:0,behavior:'smooth'})
}

function resultBlock(q,responses){
 const vals=responses.map(r=>r.answers[q.id]).filter(v=>Array.isArray(v)?v.length:v!==''&&v!=null);
 if(['single','dropdown','yesno','rating','scale','multi'].includes(q.type)){
  let labels=[];if(['single','dropdown','multi'].includes(q.type))labels=q.options||[];else if(q.type==='yesno')labels=['Yes','No'];else labels=['1','2','3','4','5'];
  const counts=Object.fromEntries(labels.map(l=>[String(l),0]));
  vals.forEach(v=>Array.isArray(v)?v.forEach(x=>counts[x]=(counts[x]||0)+1):counts[String(v)]=(counts[String(v)]||0)+1);
  const max=Math.max(1,...Object.values(counts));
  return `<div class="result-card card"><h3>${esc(q.title)}</h3>${Object.entries(counts).map(([k,n])=>`<div class="bar-row"><span class="tiny">${esc(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${(n/max)*100}%"></div></div><span class="tiny">${n}</span></div>`).join('')}<div class="tiny muted" style="margin-top:10px">${vals.length} answered</div></div>`
 }
 return `<div class="result-card card"><h3>${esc(q.title)}</h3>${vals.length?vals.slice().reverse().slice(0,20).map(v=>`<span class="answer-chip">${esc(Array.isArray(v)?v.join(', '):v)}</span>`).join(''):'<div class="muted tiny">No answers yet.</div>'}<div class="tiny muted" style="margin-top:10px">${vals.length} answered</div></div>`
}
function exportCSV(sid){
 const s=surveyById(sid),rs=responsesFor(sid);const header=['Submitted at',...s.questions.map(q=>q.title)];const rows=rs.map(r=>[r.submittedAt,...s.questions.map(q=>Array.isArray(r.answers[q.id])?r.answers[q.id].join(' | '):r.answers[q.id]||'')]);
 const csv=[header,...rows].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(s.title||'survey').replace(/[^a-z0-9]+/gi,'_')+'_responses.csv';a.click();URL.revokeObjectURL(a.href)
}
function clearResponses(sid){if(!confirm('Delete all responses for this survey?'))return;const d=data();d.responses=d.responses.filter(r=>r.surveyId!==sid);save(d);results(sid);toast('Responses cleared')}
function results(sid){
 const s=surveyById(sid);if(!s)return location.hash='#/';const rs=responsesFor(sid);const last=rs.at(-1)?.submittedAt;const blocks=s.questions.map(q=>resultBlock(q,rs)).join('');
 shell(`<main class="container"><section class="hero"><div><div class="tiny muted">RESULTS</div><h1>${esc(s.title)}</h1><p>See how people answered each question.</p></div><div class="row-actions"><a class="btn btn-secondary" href="#/builder/${sid}">Back to editor</a><button class="btn btn-secondary" onclick="exportCSV('${sid}')">Export CSV</button><button class="btn btn-danger" onclick="clearResponses('${sid}')">Clear responses</button></div></section><section class="results-grid"><div class="card metric"><span>Total responses</span><strong>${rs.length}</strong></div><div class="card metric"><span>Questions</span><strong>${s.questions.length}</strong></div><div class="card metric"><span>Latest response</span><strong style="font-size:18px">${last?fmtDate(last):'—'}</strong></div></section>${blocks||'<div class="card empty"><h3>No questions to analyse</h3><p>Add questions, then collect responses.</p></div>'}</main>`)
}

function render(){
 const hash=location.hash||'#/';const parts=hash.replace(/^#\//,'').split('/');const route=parts[0]||'';const id=parts[1];
 if(route==='builder'&&id)return builder(id);if(route==='survey'&&id)return publicSurvey(id);if(route==='results'&&id)return results(id);dashboard();
}
window.addEventListener('hashchange',render);window.addEventListener('DOMContentLoaded',render);
