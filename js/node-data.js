/* NODE: JSON dataset -> existing UI schema. No external API or real student records. */
window.NODE_DATA_CONFIG = Object.freeze({mode:'json',isMockData:true,url:new URL('../data/NODE_dummy_students_300.json',document.currentScript.src).href,storageKey:'node.demo.v2'});
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
 for(const s of rows){
  if(!s.meta||!['json','api'].includes(s.meta.source)||!Array.isArray(s.meta.real)||!Array.isArray(s.meta.dummy))throw Error('출처 meta 누락 또는 형식 오류');
  if(!s.id||ids.has(s.id)||!Array.isArray(s.courseEnrollments))throw Error('학생 ID 중복 또는 수강 과정 누락');ids.add(s.id);
  const classId=s.schoolLevel+'-'+s.grade;
  if(!classes.has(classId)){classes.set(classId,true);db.classes.push({...base(classId),name:s.gradeLabel+' 시연반'});}
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
 db.nodeMetadata={source:'직접 제작한 더미 데이터 (AI 제작 도움)',isMockData:true,mode:'json',academicYear:2026,studentCount:rows.length};
 return db;
};
