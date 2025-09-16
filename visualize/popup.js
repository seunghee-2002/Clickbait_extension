// ===== 전역 변수 =====
let isLoggedIn = false;
let userData = null;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 News Crawler 팝업 초기화');
  checkLoginStatus();
  setupEventListeners();
});

// ===== 로그인 상태 확인 =====
function checkLoginStatus() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const email = localStorage.getItem('email');

  if (token && username) {
    isLoggedIn = true;
    userData = { token, username, email };
    showLoggedInView();
    loadUserStats();
  } else {
    isLoggedIn = false;
    showLoggedOutView();
  }
}

// ===== 화면 전환 =====
function showLoggedInView() {
  document.getElementById('logged-out-view').classList.add('hidden');
  document.getElementById('logged-in-view').classList.remove('hidden');
  
  // 사용자 정보 표시
  if (userData) {
    document.getElementById('user-name').textContent = userData.username;
    document.getElementById('user-email').textContent = userData.email || 'user@example.com';
    document.getElementById('user-avatar').textContent = userData.username.charAt(0).toUpperCase();
  }
}

function showLoggedOutView() {
  document.getElementById('logged-in-view').classList.add('hidden');
  document.getElementById('logged-out-view').classList.remove('hidden');
}

// ===== 사용자 통계 로드 =====
function loadUserStats() {
  // 로컬 스토리지에서 통계 로드
  chrome.storage.local.get(['analyzedCount', 'bookmarkCount'], (result) => {
    document.getElementById('analyzed-count').textContent = result.analyzedCount || 0;
    document.getElementById('bookmark-count').textContent = result.bookmarkCount || 0;
  });
}

// ===== 이벤트 리스너 설정 =====
function setupEventListeners() {
  // 로그인 버튼 (확장프로그램 내부 파일 사용)
  document.getElementById('login-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('login/login-signup.html') });
    addLog('로그인 페이지를 열었습니다.');
  });

  // 새로고침 버튼 (로그인 전)
  document.getElementById('refresh-btn').addEventListener('click', () => {
    alert('새로고침되었습니다!');
    refreshExtensionData();
  });

  // 북마크 버튼 (로그인 후)
  document.getElementById('bookmarks-btn').addEventListener('click', () => {
    alert('📌 북마크 기능은 개발 중입니다.\n곧 업데이트될 예정입니다!');
    addLog('북마크 메뉴를 클릭했습니다.');
  });

  // 링크 분석 버튼 (확장프로그램 내부 파일 사용)
  document.getElementById('analyze-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('login/index.html') });
    addLog('링크 분석 페이지를 열었습니다.');
  });

  // 새로고침 버튼 (로그인 후)
  document.getElementById('refresh-logged-btn').addEventListener('click', () => {
    refreshExtensionData();
    loadUserStats();
  });

  // 설정 버튼 (로그인 후)
  document.getElementById('settings-btn').addEventListener('click', () => {
    showSettings();
  });

  // 로그아웃 버튼
  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
  });
}

// ===== 데이터 새로고침 =====
function refreshExtensionData() {
  console.log('🔄 데이터 새로고침');
  addLog('데이터를 새로고침했습니다.');
  
  // 현재 탭에 새로고침 메시지 전송
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'refreshData'
      }, (response) => {
        if (response && response.success) {
          console.log('✅ 데이터 새로고침 완료');
        }
      });
    }
  });
}

// ===== 설정 표시 =====
function showSettings() {
  const settings = `⚙️ 확장프로그램 설정

📋 현재 설정:
• 자동 분석: 활성화
• 알림: 활성화
• 테마: 기본

🔧 고급 설정:
• 분석 민감도 조절
• 사용자 정의 필터
• 데이터 백업

⚠️ 설정 기능은 개발 중입니다.`;
  
  alert(settings);
  addLog('설정 메뉴를 확인했습니다.');
}

// ===== 로그아웃 =====
function logout() {
  if (confirm('정말 로그아웃하시겠습니까?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    isLoggedIn = false;
    userData = null;
    
    showLoggedOutView();
    addLog('로그아웃했습니다.');
  }
}

// ===== 로그 추가 (개발용) =====
function addLog(message) {
  console.log(`[News Crawler] ${message}`);
}

// ===== 스토리지 변경 감지 =====
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // 통계 업데이트
    if (changes.analyzedCount || changes.bookmarkCount) {
      loadUserStats();
    }
  }
});

// ===== 주기적 상태 확인 =====
setInterval(() => {
  const currentLoginStatus = !!localStorage.getItem('token');
  if (currentLoginStatus !== isLoggedIn) {
    checkLoginStatus();
  }
}, 1000);