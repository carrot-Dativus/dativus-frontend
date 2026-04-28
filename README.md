# 🥕 Dativus (다티부스) - Frontend Workspace

> **LangGraph 기반 멀티 에이전트 라우팅 챗봇 시스템**
> 본 저장소는 다티부스 프로젝트의 `실시간 채팅 및 페르소나 설정 UI/UX`를 담당하는 클라이언트 파트입니다.

## 📖 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [시스템 아키텍처](#-시스템-아키텍처)
3. [주요 기능](#-주요-기능)
4. [기술 스택](#-기술-스택)
5. [시작하기 (Getting Started)](#-시작하기-getting-started)
6. [팀 멤버 (Team)](#-팀-멤버-team)

---

## 💡 프로젝트 개요
다티부스(Dativus)는 사용자의 맥락을 이해하고 최적의 답변을 생성하는 개인화된 '제2의 뇌' AI 챗봇 시스템입니다. 
본 프론트엔드 애플리케이션은 사용자가 AI 에이전트들과 직관적으로 소통할 수 있는 실시간 채팅 인터페이스와 개인화된 대시보드를 제공합니다.

## 🏗 시스템 아키텍처
*(추후 아키텍처 다이어그램 업데이트 예정)*
* **Frontend (현재 저장소):** React 기반 UI/UX 및 실시간 채팅 워크스페이스
* **Main Backend:** Spring Boot 기반 인증(Zero-Trust) 및 비즈니스 로직, PostgreSQL DB
* **AI Core:** FastAPI 기반 LangGraph 라우팅, 외부 도메인 데이터 연동 및 프롬프트 처리

## ✨ 주요 기능
* **실시간 채팅 워크스페이스:** SSE(Server-Sent Events) 또는 WebSocket을 활용한 매끄러운 AI 대화형 인터페이스.
* **사용자 맞춤형 대시보드:** 과거 채팅 기록(세션) 조회 및 개인화된 '제2의 뇌' 시각화 패널 제공.
* **페르소나 설정 UI:** 사용자가 원하는 챗봇의 성격과 도메인을 동적으로 설정할 수 있는 직관적인 화면.

## 🛠 기술 스택
### Frontend
* **Library:** React.js
* **Language:** JavaScript / TypeScript
* **Styling:** CSS / Styled-components (또는 TailwindCSS)
* **Network:** Axios, Fetch API

## 🚀 시작하기 (Getting Started)
본 프로젝트를 로컬 환경에서 실행하기 위한 가이드입니다.

### 1. 환경 설정 및 복제
```bash
$git clone [https://github.com/carrot-Dativus/dativus-frontend.git$](https://github.com/carrot-Dativus/dativus-frontend.git$) cd dativus-frontend
```

### 2. 패키지 설치
```bash
$ npm install
# 또는
$ yarn install
```

### 3. 환경 변수 설정 (.env)
루트 디렉토리에 `.env` 파일을 생성하고 메인 서버 API 주소를 매핑하세요.
```text
REACT_APP_API_BASE_URL="http://localhost:8080"
```

### 4. 로컬 서버 실행
```bash
$ npm start
# 또는
$ yarn start
```

## 👥 팀 멤버 (Team)
| 역할 | 이름 | 담당 업무 | GitHub |
| --- | --- | --- | --- |
| **Team Leader** | 강동균 | AI 코어 개발, 인프라 구축, 3-Tier 라우팅 로직 | [@GitHub아이디](링크) |
| **Backend** | 김성원 | Spring Boot 인증 로직, DB 스키마 및 세션 관리 | [@GitHub아이디](링크) |
| **Frontend** | 고결 | React UI/UX, 대시보드 및 페르소나 설정 화면 구현 | [@GitHub아이디](링크) |
