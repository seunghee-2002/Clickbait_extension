// login/app/dashboard.js - 메인 대시보드 로직

// ===== 디버깅 모드 설정 =====
const DEBUG_MODE = true; // 프로덕션에서는 false로 변경
const DEBUG_USER = {
  token: 'debug_token_12345',  // 디버깅용 토큰 (나중에 실제 토큰 테스트 시 사용)
  username: '테스트사용자',
  email: 'test@example.com'
};

// ===== 토큰 및 인증 관리 =====

// 토큰 가져오기 함수 
function getAuthToken() {
  return localStorage.getItem('token');
}

// JWT 토큰 유효성 검사 함수 (나중에 활성화)
function isTokenValid(token) {
  if (!token) return false;
  
  // 디버깅 모드에서는 디버깅 토큰이면 항상 유효
  if (DEBUG_MODE && token === DEBUG_USER.token) {
    return true;
  }
  
  try {
    // JWT 토큰 만료 시간 체크
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp > currentTime : true;
  } catch (e) {
    // JWT 파싱 실패 시 디버깅 토큰인지 확인
    return DEBUG_MODE && token === DEBUG_USER.token;
  }
}

function isLoggedIn() {
  // === 토큰 기반 인증 ===
  // const token = getAuthToken();
  // if (!token) return false;
  // return isTokenValid(token);

  // === 현재 사용 중인 간단한 인증 ===
  // 디버깅 모드에서는 디버깅 사용자면 항상 유효
  if (DEBUG_MODE) {
    const username = localStorage.getItem('username');
    return username === DEBUG_USER.username || username;
  }
  
  // 임시: 사용자명이 있으면 로그인된 것으로 간주
  const username = localStorage.getItem('username');
  return !!username;
}

function logout() {
  const email = localStorage.getItem('email');
  
  // === 서버 로그아웃 요청 ===
  // if (email && !DEBUG_MODE && getAuthToken() !== DEBUG_USER.token) {
  //   fetch('http://localhost:8080/api/auth/logout', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${getAuthToken()}`
  //     },
  //     body: JSON.stringify({ email: email })
  //   }).catch(err => console.warn('로그아웃 요청 실패:', err));
  // }
  
  // 로컬 저장소 클리어
  // localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  
  // 로그인 페이지로 리다이렉트
  window.location.href = 'login-signup.html';
}

// ===== 디버깅 모드 활성화 =====
function enableDebugMode() {
  if (DEBUG_MODE) {
    console.log('디버깅 모드 활성화');
    
    // 디버깅 사용자 정보 자동 설정
    // localStorage.setItem('token', DEBUG_USER.token);
    localStorage.setItem('username', DEBUG_USER.username);
    localStorage.setItem('email', DEBUG_USER.email);
    
    // 디버깅 UI 추가
    addDebugUI();
    
    // 사용자 정보 업데이트
    updateUserInfo();
    
    console.log('디버깅 로그인 완료:', DEBUG_USER);
  }
}

// ===== 디버깅 UI 추가 =====
function addDebugUI() {
  // 기존 디버깅 패널이 있으면 제거
  const existingPanel = document.getElementById('debug-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  // 디버깅 패널 생성
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #ff9800;
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    font-family: system-ui, sans-serif;
  `;
  
  debugPanel.innerHTML = `
    <strong>🔧 디버깅 모드</strong><br>
    사용자: ${DEBUG_USER.username}<br>
    <button id="debug-logout" style="margin-top: 5px; padding: 2px 5px; cursor: pointer;">로그아웃</button>
    <button id="debug-clear" style="margin-top: 5px; padding: 2px 5px; cursor: pointer;">데이터 클리어</button>
  `;
  
  document.body.appendChild(debugPanel);
  
  // 디버깅 로그아웃 버튼
  document.getElementById('debug-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });
  
  // 디버깅 데이터 클리어 버튼
  document.getElementById('debug-clear').addEventListener('click', () => {
    localStorage.clear();
    console.log('로컬 스토리지 클리어됨');
    alert('디버깅 데이터가 클리어되었습니다.');
  });
}

// ===== 사용자 정보 표시 =====
function updateUserInfo() {
  const username = localStorage.getItem('username');
  const welcomeMessage = document.getElementById('welcome-message');
  
  if (welcomeMessage && username) {
    welcomeMessage.textContent = `환영합니다, ${username}님!`;
  }
}

// ===== URL 분석 통신 함수 =====
async function analyzeUrl(url, targetId) {
  // const token = getAuthToken();
  
  if (!url) {
    alert('URL을 입력하세요');
    return;
  }
  
  // 로딩 상태 표시
  const resultElement = document.getElementById(targetId);
  const analyzeBtn = document.getElementById('analyze-btn');
  
  if (resultElement) {
    resultElement.textContent = '분석 중입니다. 잠시만 기다려주세요...';
    resultElement.style.display = 'block';
  }
  
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '분석 중...';
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // === 토큰 인증 헤더 추가  ===
    // 디버깅 모드가 아니고 실제 토큰이 있을 때만 Authorization 헤더 추가
    // if (!DEBUG_MODE && token && token !== DEBUG_USER.token) {
    //   headers['Authorization'] = `Bearer ${token}`;
    // }

    const response = await fetch('http://localhost:8080/api/url', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      // === 토큰 만료 시 로그아웃 처리  ===
      // if (response.status === 401 && !DEBUG_MODE) {
      //   alert('인증이 만료되었습니다. 다시 로그인해주세요.');
      //   logout();
      //   return;
      // }
      
      let errorMessage = `서버 오류 (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // JSON 파싱 실패 시 기본 메시지 사용
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // 결과 표시
    if (resultElement) {
      resultElement.textContent = JSON.stringify(data, null, 2);
      resultElement.style.display = 'block';
    }
    
    console.log('URL 분석 성공:', data);
    
  } catch (err) {
    console.error('URL 분석 실패:', err);
    if (resultElement) {
      resultElement.textContent = `오류 발생: ${err.message}`;
      resultElement.style.display = 'block';
    }
    alert(`분석 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    // 로딩 상태 해제
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = '전송';
    }
  }
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
  // URL 분석 버튼 이벤트
  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = document.getElementById('url-input').value.trim();
      if (!url) {
        alert('URL을 입력해주세요.');
        return;
      }
      await analyzeUrl(url, 'url-result');
    });
  }

  // 현재 페이지 URL 분석 버튼 이벤트
  const analyzeCurrentBtn = document.getElementById('analyze-current-btn');
  if (analyzeCurrentBtn) {
    analyzeCurrentBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await analyzeUrl(window.location.href, 'result');
    });
  }

  // Enter 키 지원
  const urlInput = document.getElementById('url-input');
  if (urlInput) {
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        analyzeBtn.click();
      }
    });
  }

  // 로그아웃 버튼 이벤트
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('로그아웃 하시겠습니까?')) {
        logout();
      }
    });
  }

  // 키보드 단축키 (Ctrl+D)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      if (DEBUG_MODE) {
        enableDebugMode();
        alert('디버깅 모드가 활성화되었습니다!\n\n• Ctrl+D: 디버깅 모드 활성화\n• 좌측 상단 패널에서 로그아웃/데이터 클리어 가능');
      }
    }
  });
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('메인 대시보드 초기화 시작');

  // 디버깅 모드 자동 활성화
  if (DEBUG_MODE && !localStorage.getItem('username')) {
    console.log('디버깅 모드 자동 활성화');
    enableDebugMode();
  }

  // === 토큰 기반 인증 체크 ===
  // if (!isLoggedIn()) {
  //   alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  //   window.location.href = 'login-signup.html';
  //   return;
  // }

  // === 현재 사용 중인 간단한 인증 체크 ===
  if (!isLoggedIn()) {
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
    window.location.href = 'login-signup.html';
    return;
  }
  
  // 사용자 정보 표시
  updateUserInfo();
  
  // 디버깅 UI 표시 (이미 로그인된 상태에서)
  if (DEBUG_MODE && localStorage.getItem('username') === DEBUG_USER.username) {
    addDebugUI();
  }

  // 이벤트 리스너 설정
  setupEventListeners();

  console.log('메인 대시보드 초기화 완료');
});

/*
 토큰 활성화시
 -localStorage.setItem('token', DEBUG_USER.token);
 -headers['Authorization'] = \Bearer ${token}`;`
 -401 에러 처리 로직
 -서버 로그아웃 요청
 */