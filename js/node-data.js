/* NODE: JSON dataset -> existing UI schema. No external API or real student records. */
window.NODE_DATA_CONFIG = Object.freeze({mode:'json',datasetVersion:'2026-11-22-homework-v1',isMockData:true,url:new URL('../data/NODE_dummy_students_300.json',document.currentScript.src).href,storageKey:'node.demo.v2'});
// Add fixed demo dates so opening historical records gives repeatable results.
const nodeOctoberDates = [
 '2026-10-02','2026-10-05','2026-10-07','2026-10-09','2026-10-12','2026-10-14',
 '2026-10-16','2026-10-19','2026-10-21','2026-10-23','2026-10-26','2026-10-28','2026-10-30'
];
const nodeDemoDates = [...nodeOctoberDates, '2026-11-16'];

function nodeAddHistoricalSamples(db, sourceStudents = db.students) {
 const attendanceKey = row => JSON.stringify([row.studentId, row.date]);
 // Include deleted rows in these indexes so loading new samples doesn't restore deletions.
 const attendanceKeys = new Set(db.attendance.map(attendanceKey));
 const entryIds = new Set(db.entries.map(row => row.id));
 for (const row of db.entries) {
  if (row.kind === 'memo' && /^출결\s*[:：]\s*(결석|지각|출석)\s*$/.test(row.content || '')) {
   attendanceKeys.add(attendanceKey(row));
  }
 }
 const students = new Map(db.students.filter(row => !row.deletedAt).map(row => [row.id, row]));
 const classes = new Set(db.classes.filter(row => !row.deletedAt).map(row => row.id));

 nodeDemoDates.forEach((date, day) => {
  sourceStudents.forEach((source, index) => {
   const student = students.get(source.id);
   if (!student || !classes.has(student.classId)) return;
   const seed = (index * 37 + day * 19) % 100;
   const status = seed < 5 ? '결석' : seed < 13 ? '지각' : '출석';
   const time = student.grade.startsWith('고') ? '18:00' : '16:00';
   const stamp = date + 'T' + time + ':00+09:00';
   const base = {createdAt:stamp, updatedAt:stamp, deletedAt:null, sample:true};
   const key = attendanceKey({studentId:student.id,date});
   const addEntry = (kind, details) => {
    const id = 'node-demo-history-' + kind + '-' + date + '-' + student.id;
    if (entryIds.has(id)) return;
    entryIds.add(id);
    db.entries.push({...base,id,kind,studentId:student.id,classId:student.classId,date,
     logId:'',testId:'',duration:'',scoreCorrect:null,scoreTotal:null,time:'',
     status:'',content:'',memo:'',book:'',unit:'',reason:'',staff:student.teacher||'',review:false,
     ...details});
   };
   if (seed < 98 && !attendanceKeys.has(key)) {
    if (status === '결석') {
     addEntry('memo',{content:'출결: 결석',memo:'시연용 합성 출결 기록'});
    } else {
     db.attendance.push({...base,id:'node-demo-history-attendance-'+date+'-'+student.id,
      studentId:student.id,date,time:status==='지각'?time.replace(':00',':15'):time,
      departureTime:'',memo:status});
    }
    attendanceKeys.add(key);
   }
   if (seed >= 13 && seed < 21) {
    const topics = ['수업 예제 다시 풀기','오답 3문항 풀이 정리','복습 문제 5문항'];
    addEntry('homework',{content:topics[(day+index)%topics.length],
     status:seed<20?'완료':'부분완료',memo:'시연용 합성 숙제 기록'});
   }
   if (seed < 2) {
    addEntry('supplement',{content:'이전 수업 핵심 문제 복습',time:'19:30',
     status:date==='2026-11-16'?'예정':'완료',reason:'이전 수업 보충',memo:'시연용 합성 보강 기록'});
   }
  });
 });
}

// Map the demo curriculum into the same records used by the class and student views.
function nodeAddAcademicSamples(db, sourceStudents = db.students) {
 const indexes = Object.fromEntries(
  ['tests','runs','entries','books','units','studentBooks','unitStates'].map(key =>
   [key,new Map(db[key].map(row => [row.id,row]))])
 );
 const add = (key, id, date, fields) => {
  const rows = indexes[key];
  if (rows.has(id)) {
   const row = rows.get(id);
   return row.deletedAt ? null : row;
  }
  const stamp = date + 'T16:00:00+09:00';
  const row = {id,createdAt:stamp,updatedAt:stamp,deletedAt:null,sample:true,...fields};
  db[key].push(row);
  rows.set(id,row);
  return row;
 };
 const students = new Map(db.students.filter(row => !row.deletedAt).map(row => [row.id,row]));
 const classes = new Map(db.classes.filter(row => !row.deletedAt).map(row => [row.id,row]));
 const subjectIds = new Map(db.options.filter(row => row.category==='subject'&&!row.deletedAt).map(row => [row.name,row.id]));
 const idPart = value => value.trim().replace(/[^\p{L}\p{N}]+/gu,'-');
 const assigned = new Set(db.studentBooks.map(row => row.studentId));
 const testDates = ['2026-10-19','2026-10-30','2026-11-10','2026-11-16'];
 sourceStudents.forEach((source,index) => {
  const student = students.get(source.id);
  const group = student && classes.get(student.classId);
  const courses = source.courseEnrollments || [];
  const course = courses.find(row => row.subject==='수학') || courses[0];
  if (!group || !course) return;
  const scope = idPart(student.grade)+'-'+idPart(course.courseName);
  const bookId = 'node-demo-book-' + scope;
  if (!assigned.has(student.id)) {
   const book = add('books',bookId,'2026-11-02',{name:course.courseName+' 연습교재 (시연용)',
    grade:student.grade,subjectId:subjectIds.get(course.subject)||'',publisher:'',folderId:''});
   if (book) {
    const unit = add('units','node-demo-unit-'+scope+'-'+idPart(course.currentUnit),'2026-11-02',
     {bookId,name:course.currentUnit,order:db.units.filter(row=>row.bookId===bookId).length});
    if (unit) {
     const assignment = add('studentBooks','node-demo-student-book-'+student.id,'2026-11-16',
      {studentId:student.id,bookId,currentUnitId:unit.id,position:'',memo:'시연용 수강 과정'});
     if (assignment && assignment.bookId===bookId) {
      const status = ['유형별 풀이','전체 풀이','채점 완료','오답'][index%4];
      add('unitStates','node-demo-unit-state-'+student.id,'2026-11-16',
       {studentBookId:assignment.id,unitId:unit.id,status});
     }
    }
   }
  }
  testDates.forEach((date,round) => {
   const key = group.id+'-'+date;
   const test = add('tests','node-demo-test-'+key,date,{name:group.name+' 수학 단원 테스트 (시연용)',
    type:'단원 테스트',round:String(round+1),totalQuestions:20,answers:{},memo:'시연용 합성 테스트',
    classId:group.id,date,staff:group.staff||'',rawName:''});
   if (!test) return;
   const run = add('runs','node-demo-run-'+key,date,{testId:test.id,classId:group.id,date,memo:'시연용 실시 기록'});
   if (!run || run.testId!==test.id || !classes.has(run.classId)) return;
   add('entries','node-demo-result-'+date+'-'+student.id,date,{kind:'test',studentId:student.id,
    classId:run.classId,logId:'',testId:test.id,runId:run.id,date:run.date,duration:'',
    scoreCorrect:Math.min(test.totalQuestions,8+(index*7+Math.floor(index/9)+round*3)%13),
    scoreTotal:null,time:'',status:'',content:'',memo:'시연용 합성 결과',book:'',unit:'',
    reason:'',staff:student.teacher||'',review:false});
  });
 });
}

window.nodeConvertStudents = function(rows) {
 if(!Array.isArray(rows)||!rows.length)throw Error('학생 데이터 배열이 비어 있습니다.');
 const stamp='2026-11-02T11:30:00+09:00';
 const base=id=>({id,createdAt:stamp,updatedAt:stamp,deletedAt:null,sample:true});
 const db={version:5,revision:0};
 for(const k of ['classes','students','tests','logs','entries','templates','options','attendance','books','units','studentBooks','unitStates','runs','folders','files','testFolders'])db[k]=[];
 const subjects=['수학','과학','물리','화학'];
 subjects.forEach((name,i)=>db.options.push({...base('subject-'+i),category:'subject',name,order:i}));
 db.options.push({...base('type-unit'),category:'testType',name:'단원 테스트',order:0});
 const classes=new Map();
 const entry=(kind,s,date,extra)=>({...base(kind+'-'+s.id+'-'+db.entries.length),kind,studentId:s.id,classId:s.classId,logId:'',testId:'',date,duration:'',scoreCorrect:null,scoreTotal:null,time:'',status:'',content:'',memo:'',book:'',unit:'',reason:'',staff:s.teacher||'',review:false,...extra});
 const ids=new Set();
 console.group('[데이터 점검] NODE JSON');console.log('데이터 건수:',rows.length);console.log('항목 출처:',rows.reduce((a,s)=>(a[s.meta?.source]=(a[s.meta?.source]||0)+1,a),{}));console.groupEnd();
 for(const source of rows){
  const s=['S001','S051','S101'].includes(source.id)?{...source,name:'김민준'}:source;
  if(!s.meta||!['json','api'].includes(s.meta.source)||!Array.isArray(s.meta.real)||!Array.isArray(s.meta.dummy))throw Error('출처 meta 누락 또는 형식 오류');
  if(!s.id||ids.has(s.id)||!Array.isArray(s.courseEnrollments))throw Error('학생 ID 중복 또는 수강 과정 누락');ids.add(s.id);
  const classId=s.schoolLevel+'-'+s.grade;
  if(!classes.has(classId)){classes.set(classId,true);db.classes.push({...base(classId),name:s.className||s.gradeLabel+' 정규반',staff:s.teacher});}
  const courses=s.courseEnrollments;
  const memo=[s.memo,'[가상 데이터 · '+s.curriculum+' 교육과정]',...courses.map(e=>`${e.subject} / ${e.courseName} / ${e.curriculum} / ${e.studyType} / 진도 ${e.progress}% / 숙제 ${e.homeworkCompleted}/${e.homeworkAssigned}`)].filter(Boolean).join('\n');
  const student={...base(s.id),name:s.name,classId,school:s.school,grade:s.gradeLabel,subject:s.subjects.join(', '),subjectIds:s.subjects.map(n=>'subject-'+subjects.indexOf(n)),memo,teacher:s.teacher,meta:s.meta,nodeRaw:s,courseEnrollments:courses};
  db.students.push(student);
  if(s.attendance!=='결석')db.attendance.push({...base('attendance-'+s.id),studentId:s.id,date:s.attendanceDate,time:s.attendance==='지각'?'16:20':'16:00',departureTime:'',memo:s.attendance});
  else db.entries.push(entry('memo',student,s.attendanceDate,{content:'출결: 결석',memo:'가상 출결 기록'}));
  for(const e of courses){
   db.entries.push(entry('homework',student,s.attendanceDate,{status:e.homeworkStatus==='완료'?'완료':e.homeworkStatus==='일부 완료'?'부분완료':'미완료',content:`${e.courseName} · ${e.currentUnit} · ${e.homeworkCompleted}/${e.homeworkAssigned}문항`,memo:`${e.curriculum} 교육과정 / ${e.studyType}`}));
   db.entries.push(entry('memo',student,s.attendanceDate,{content:`[진도] ${e.courseName} / ${e.currentUnit} / ${e.progress}%`,memo:'가상 수강 계획 대비 진행률'}));
   if(e.wrongAnswers.length)db.entries.push(entry('memo',student,s.attendanceDate,{content:`[오답] ${e.courseName}: `+e.wrongAnswers.map(w=>`${w.questionNumber}번 ${w.reviewStatus}`).join(', ')}));
   for(const q of e.questions)db.entries.push(entry('memo',student,s.attendanceDate,{content:`[질문 · ${q.status}] ${e.courseName}: ${q.content}`}));
  }
  if(s.makeupStatus!=='해당 없음')db.entries.push(entry('supplement',student,s.makeupDate,{status:s.makeupStatus,time:'17:00',content:'결석 수업 보강',reason:'결석'}));
 }
 db.nodeMetadata={source:'직접 제작한 더미 데이터 (AI 제작 도움)',isMockData:true,mode:'json',academicYear:2026,studentCount:rows.length,datasetVersion:window.NODE_DATA_CONFIG.datasetVersion};
 nodeAddHistoricalSamples(db);
 nodeAddAcademicSamples(db);
 return db;
};

// Refresh sample labels and add new demo history without overwriting saved records.
window.nodeRefreshDemoLabels = function(saved,fresh){
 const next=structuredClone(saved),original=new Map(fresh.students.map(s=>[s.id,s]));
 for(const student of next.students){
  const current=original.get(student.id),old=student.nodeRaw;if(!current||!old)continue;
  for(const field of ['name','school','teacher'])if(student[field]===old[field])student[field]=current[field];
  student.nodeRaw={...old,name:current.nodeRaw.name,school:current.nodeRaw.school,teacher:current.nodeRaw.teacher,className:current.nodeRaw.className,sourceDescription:current.nodeRaw.sourceDescription};
  student.meta=structuredClone(current.meta);
 }
 for(const group of next.classes){
  const updated=fresh.classes.find(c=>c.id===group.id);if(!updated)continue;
  if(/^(중|고)[1-3] 시연반$/.test(group.name))group.name=updated.name;
  if(!group.staff||/^가상강사[A-C]$/.test(group.staff))group.staff=updated.staff;
 }
 const teacherMap=new Map();
 for(const student of saved.students){const current=original.get(student.id);if(current&&student.nodeRaw)teacherMap.set(student.id,{old:student.nodeRaw.teacher,next:current.teacher})}
 for(const entry of next.entries){const pair=teacherMap.get(entry.studentId);if(pair&&entry.staff===pair.old)entry.staff=pair.next}
 nodeAddHistoricalSamples(next,fresh.students);
 nodeAddAcademicSamples(next,fresh.students);
 next.nodeMetadata={...next.nodeMetadata,datasetVersion:window.NODE_DATA_CONFIG.datasetVersion};
 return next;
};

function nodeSampleHash(value) {
 let hash=2166136261;
 for (const character of value) hash=Math.imul(hash^character.charCodeAt(0),16777619)>>>0;
 return hash;
}
function nodeSampleSignature(row) {
 const {demoSignature,...fields}=row;
 return nodeSampleHash(JSON.stringify(fields));
}
window.nodeDailySampleDates = function() {
 const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const start=new Date(today.slice(0,7)+'-01T12:00:00Z');
 start.setUTCMonth(start.getUTCMonth()-1);
 const dates=[];
 for(let date=start.toISOString().slice(0,10);date<=today;){
  dates.push(date);start.setUTCDate(start.getUTCDate()+1);date=start.toISOString().slice(0,10);
 }
 return dates;
};
window.nodeAddDailySamples = function(db,dates) {
 const tables=['attendance','entries','tests','runs'];
 const indexes=Object.fromEntries(tables.map(key=>[key,new Set(db[key].map(row=>row.id))]));
 const attendanceKeys=new Set(db.attendance.map(row=>row.studentId+'|'+row.date));
 db.entries.filter(row=>row.kind==='memo'&&/^출결\s*[:：]\s*(결석|지각|출석)\s*$/.test(row.content||''))
  .forEach(row=>attendanceKeys.add(row.studentId+'|'+row.date));
 const add=(table,id,date,fields)=>{
  if(indexes[table].has(id))return;
  const row={id,createdAt:date+'T12:00:00+09:00',updatedAt:date+'T12:00:00+09:00',deletedAt:null,sample:true,dailyDemo:true,...fields};
  row.demoSignature=nodeSampleSignature(row);db[table].push(row);indexes[table].add(id);
 };
 const entry=(kind,student,date,fields)=>({kind,studentId:student.id,classId:student.classId,
  logId:'',testId:'',date,duration:'',scoreCorrect:null,scoreTotal:null,time:'',status:'',
  content:'',memo:'시연용 샘플 데이터',book:'',unit:'',reason:'',staff:student.teacher||'',review:false,...fields});
 const classes=db.classes.filter(row=>!row.deletedAt);
 const selected=new Set(classes.map(row=>row.id));
 const generated=new Set(db.nodeMetadata?.dailyDates||[]);
 for(const date of dates){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||generated.has(date))continue;
  const weekday=new Date(date+'T12:00:00Z').getUTCDay();
  for(const group of classes){
   const key=group.id+'-'+date;
   if(!db.tests.some(row=>row.id==='node-daily-test-'+key))add('tests','node-daily-test-'+key,date,
    {name:group.name+' 복습 테스트 (시연용)',type:'단원 테스트',round:date.replaceAll('-',''),totalQuestions:20,answers:{},memo:'시연용 샘플 데이터',classId:group.id,date,staff:group.staff||'',rawName:''});
   if(!db.tests.find(row=>row.id==='node-daily-test-'+key)?.deletedAt)add('runs','node-daily-run-'+key,date,{testId:'node-daily-test-'+key,classId:group.id,date,memo:'시연용 샘플 데이터'});
  }
  for(const student of db.students.filter(row=>!row.deletedAt&&selected.has(row.classId))){
   const seed=nodeSampleHash(date+'|'+student.id),rate=seed%100;
   const status=rate<5?'결석':rate<12?'지각':'출석';
   if(rate<98&&!attendanceKeys.has(student.id+'|'+date)){
    if(status==='결석')add('entries','node-daily-absent-'+date+'-'+student.id,date,entry('memo',student,date,{content:'출결: 결석'}));
    else{
     const hour=student.grade.startsWith('고')?18:16;
     const minutes=rate<12?10+seed%20:seed%10;
     const time=hour+':'+String(minutes).padStart(2,'0');
     add('attendance','node-daily-attendance-'+date+'-'+student.id,date,{studentId:student.id,date,time,departureTime:(hour+2)+':'+String(seed%50).padStart(2,'0'),memo:status});
    }
   }
   {
    const homeworkRate=nodeSampleHash('homework|'+date+'|'+student.id)%100;
    const status=homeworkRate<90?'완료':homeworkRate<97?'부분완료':'미완료';
    add('entries','node-daily-homework-'+date+'-'+student.id,date,entry('homework',student,date,{status,content:'수업 복습 10문항',scope:'수업 복습 10문항',textbookId:'',completedDate:status==='완료'?date:''}));
   }
   const key=student.classId+'-'+date;
   if(rate<95&&db.runs.some(row=>row.id==='node-daily-run-'+key&&!row.deletedAt)){
    add('entries','node-daily-result-'+date+'-'+student.id,date,entry('test',student,date,
     {testId:'node-daily-test-'+key,runId:'node-daily-run-'+key,scoreCorrect:8+nodeSampleHash('score|'+date+'|'+student.id)%13}));
   }
   if(seed%40===0)add('entries','node-daily-supplement-'+date+'-'+student.id,date,
    entry('supplement',student,date,{time:'19:30',status:seed%3===0?'완료':'예정',content:'오답 풀이 보강',reason:'추가 복습'}));
  }
  generated.add(date);
 }
 db.nodeMetadata={...db.nodeMetadata,dailyDates:[...generated]};
 return db;
};
// Recreate untouched samples when loading, storing only actual changes to them.
window.nodeDemoStorage = function(db) {
 const copy={...db};
 for(const table of ['attendance','entries','tests','runs']){
  copy[table]=db[table].filter(row=>!row.dailyDemo||row.demoSignature!==nodeSampleSignature(row));
 }
 copy.nodeMetadata={...db.nodeMetadata,dailyDates:[]};
 return JSON.stringify(copy);
};

window.nodeAgeDemoHomework = function(db) {
 const today=window.nodeDailySampleDates().at(-1);
 for(const row of db.entries){
  if(row.kind!=='homework'||!row.sample||row.deletedAt)continue;
  const pristine=row.dailyDemo?row.demoSignature===nodeSampleSignature(row):row.createdAt===row.updatedAt;
  if(!pristine)continue;
  const age=Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(row.date+'T12:00:00Z'))/86400000);
  if(age>14||(age>2&&nodeSampleHash(row.id)%100<97)){
   row.status='완료';
   row.completedDate=new Date(Date.parse(row.date+'T12:00:00Z')+2*86400000).toISOString().slice(0,10);
  }
  if(row.dailyDemo){
   if(nodeSampleHash('checked|'+row.id)%100<82)row.homeworkCheckedDate=row.date;
   row.demoSignature=nodeSampleSignature(row);
  }
 }
};
