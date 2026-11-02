# NODE 데이터 명세서 · 7주차

기준: 2026-11-02 / 학생 300명, 중1~고3 각 50명 / 수강 과정 797건

원본 파일: `data/NODE_dummy_students_300.json`

최상위 구조는 학생 객체 배열입니다. 데이터값의 성격과 연결 방식을 구분합니다.

## 학생 필드

| 필드명 | 자료형 | 필수 여부 | 의미·허용값 | 사용 화면 |
|---|---|---|---|---|
| `id` | string | 필수 | 学生 ID (S001~S300) | 목록 / 상세 또는 상세 출처표 |
| `name` | string | 필수 | 가상 학생명 | 목록 / 상세 또는 상세 출처표 |
| `school` | string | 필수 | 가상 학교명 | 목록 / 상세 또는 상세 출처표 |
| `schoolLevel` | string | 필수 | 중학교 / 고등학교 | 목록 / 상세 또는 상세 출처표 |
| `grade` | number | 필수 | 1 / 2 / 3 | 목록 / 상세 또는 상세 출처표 |
| `gradeLabel` | string | 필수 | 중1~고3 | 목록 / 상세 또는 상세 출처표 |
| `academicYear` | number | 필수 | 2026학년도 시연 기준 | 목록 / 상세 또는 상세 출처표 |
| `curriculum` | string | 필수 | 학생 적용 교육과정: 2015 / 2022 | 목록 / 상세 또는 상세 출처표 |
| `teacher` | string | 필수 | 가상 담당 강사 | 목록 / 상세 또는 상세 출처표 |
| `subjects` | array | 필수 | 수학·과학·물리·화학 중 수강 과목 배열 | 목록 / 상세 또는 상세 출처표 |
| `courseEnrollments` | array | 필수 | 수강 과정 객체 배열 | 목록 / 상세 또는 상세 출처표 |
| `attendance` | string | 필수 | 출석 / 지각 / 결석 | 목록 / 상세 또는 상세 출처표 |
| `attendanceDate` | string | 필수 | YYYY-MM-DD | 목록 / 상세 또는 상세 출처표 |
| `makeupStatus` | string | 필수 | 해당 없음 / 예정 / 완료 | 목록 / 상세 또는 상세 출처표 |
| `makeupDate` | string / null | 선택 | YYYY-MM-DD 또는 null | 목록 / 상세 또는 상세 출처표 |
| `memo` | string | 선택 | 학생 메모; 비어 있으면 정보 없음 | 목록 / 상세 또는 상세 출처표 |
| `reviewVideoUrl` | string / null | 선택 | 현재 모두 null; 정보 없음 표시 | 목록 / 상세 또는 상세 출처표 |
| `sourceType` | string | 필수 | synthetic | 관리용 |
| `isMockData` | boolean | 필수 | true (가상 기록) | 관리용 |
| `sourceDescription` | string | 필수 | AI 도움으로 제작한 가상 기록 설명 | 관리용 |
| `updatedAt` | string | 필수 | ISO 8601 수정 시각 | 관리용 |
| `dataSource` | string | 필수 | json (호환용; 화면 판정은 meta.source 사용) | 관리용 |
| `meta` | object | 필수 | 관리용 출처 객체 | 관리용 |

## 수강 과정 필드

| 필드명 | 자료형 | 설명 |
|---|---|---|
| `id` | string | 수강 기록 고유 ID |
| `subject` | string | subject |
| `courseName` | string | courseName |
| `curriculum` | string | 수강 과정 교육과정; 학생 교육과정과 별도 |
| `studyType` | string | 일반 / 선행 |
| `currentUnit` | string | currentUnit |
| `progress` | number | 0~100; 시연용 계획 대비 비율 |
| `progressDefinition` | string | progressDefinition |
| `homeworkAssigned` | number | homeworkAssigned |
| `homeworkCompleted` | number | homeworkCompleted |
| `homeworkRate` | number | 완료 문항 / 전체 문항 × 100 반올림 |
| `homeworkStatus` | string | homeworkStatus |
| `wrongAnswers` | array | 문항 번호·복습 상태 객체 배열 |
| `questions` | array | 질문 내용·해결 상태 객체 배열 |
| `meta` | object | 학생과 같은 출처 플래그 구조 |

오답 객체: `questionNumber`(number), `reviewStatus`(string: 복습 필요 / 복습 완료).
질문 객체: `content`(string), `status`(string: 현재 시연값 미해결).

## 출처 플래그 (관리용 필드)

| 필드 | 자료형 | 허용값·의미 |
|---|---|---|
| meta.source | string | json / api; 현재 모든 항목 json |
| meta.real | string[] | 실제 확인한 값의 필드명; 현재 빈 배열 |
| meta.dummy | string[] | 임의·AI 생성한 값의 필드명 |
| meta.api | string[] | 실행 중 API 응답으로 채우는 필드; 현재 API 미연동이므로 생략 |

중첩 수강 과정에도 별도의 meta가 있습니다. id·교육과정·기준연도·출처 플래그 등은 식별·설정·관리 정보로 실제 학생 조사값이 아닙니다. 관리 필드는 실제/더미 개수에서 제외합니다. reviewVideoUrl의 null은 영상이 확보되지 않았다는 뜻이며 실제 URL을 생성하지 않았습니다.

## 필드 → 화면

- 학생 목록 및 관리 목록: 학생명 옆 JSON / 더미 칩
- 학생 상세 출처 영역: 실제·더미·API 필드 개수, API 미연동 안내
- 상세 출처 영역 각 행: 해당 필드의 meta를 읽어서 실제 / 더미 / API 태그
- 수강 과정 펼치기: 과정별 단원·진도·숙제 및 유형 태그
- 생성된 학습 기록: 원본 수강 정보를 기존 화면 구조로 변환한 내용

태그 판정은 meta.api → meta.real → meta.dummy 순서입니다. 메타 누락은 출처 미확인으로 표시합니다. API 응답 및 대체 표시는 현재 연동하지 않았습니다.


## 화면 출처 표시 간소화 (최신 적용)
교수님 피드백에 따라 모든 화면 상단에 `J · 전체 더미 데이터`를 한 번 표시합니다.
J는 JSON 파일에서 불러온 데이터를 뜻합니다. 학생 이름 옆에는 meta.source에 따라 작은 J(JSON) 또는 A(API) 배지를 표시합니다. 필드별 더미 태그와 별도 출처 상세 표는 제거했습니다.
JSON 원본의 meta.source / meta.real / meta.dummy 플래그는 그대로 유지합니다. 현재 API는 미연동입니다.
이 설명이 이전의 반복 태그 UI 설명보다 우선합니다.
