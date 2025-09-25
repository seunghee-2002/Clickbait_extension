// extension/visualize/app/app.js - 확장프로그램용 통신 로직

/******************* API 통신 헬퍼 함수 *******************/
const API_BASE_URL = 'http://localhost:8080/api';

// 공통 fetch 요청 함수
async function apiRequest(endpoint, options = {}) {
  // const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // if (response.status === 401) {
      //   // 인증 실패 시 토큰 제거
      //   localStorage.removeItem('token');
      //   throw new Error('인증이 만료되었습니다.');
      // }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `서버 오류 (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API 요청 실패 [${endpoint}]:`, error);
    throw error;
  }
}

/******************* 1. Basic 탭 리스트 렌더  *******************/
async function renderBasicList() {
  const ul = document.getElementById('basic-list');
  if (!ul) return;
  
  ul.innerHTML = '<li>로딩 중...</li>';
  console.log('Basic 리스트 렌더링 실행');
  
  try {
    const list = await apiRequest('/list?type=related', {
      method: 'GET'
    });

    ul.innerHTML = '';
    list.forEach(item => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      
      const a = document.createElement('a');
      a.href = item.originalUrl || '#';
      a.textContent = item.summaryTitle || '제목 없음';
      a.addEventListener('click', (e) => e.preventDefault()); // 기본 링크 동작 방지
      
      li.appendChild(a);
      ul.appendChild(li);
    });
    
    console.log('Basic 리스트 렌더링 성공:', list.length, '개 항목');
  } catch (error) {
    console.error('Basic 리스트 로드 실패:', error);
    ul.innerHTML = '<li>데이터를 불러오지 못했습니다.</li>';
  }
}

/******************* 2. Detail 탭 리스트 렌더  *******************/
async function renderDetailList() {
  const ul = document.getElementById('detail-list');
  if (!ul) return;
  if (ul.childElementCount > 0 && !ul.querySelector('li').textContent.includes('로딩')) {
    return; // 이미 렌더링됨
  }

  ul.innerHTML = '<li>로딩 중...</li>';

  try {
    const list = await apiRequest('/list?type=related', {
      method: 'GET'
    });

    ul.innerHTML = '';
    list.forEach(item => {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      li.textContent = item.summaryTitle || '제목 없음';
      ul.appendChild(li);
    });
    
    console.log('Detail 리스트 렌더링 성공:', list.length, '개 항목');
  } catch (error) {
    console.error('Detail 리스트 로드 실패:', error);
    ul.innerHTML = '<li>데이터를 불러오지 못했습니다.</li>';
  }
}

/******************* 3. ID로 상세 데이터 가져오기  *******************/
async function fetchDetailById(id) {
  try {
    const result = await apiRequest('/id', {
      method: 'POST',
      body: JSON.stringify({ id: id })
    });
    
    console.log('ID로 데이터 가져오기 성공:', result);
    return result;
  } catch (error) {
    console.error('ID로 데이터 가져오기 실패:', error);
    throw error;
  }
}

/******************* 4. URL 분석 요청  *******************/
async function analyzeUrlById(url) {
  try {
    const result = await apiRequest('/url', {
      method: 'POST',
      body: JSON.stringify({ url: url })
    });
    
    console.log('URL 분석 성공:', result);
    return result;
  } catch (error) {
    console.error('URL 분석 실패:', error);
    throw error;
  }
}

/******************* 5. Detail 팝업 열기  *******************/
function openDetailPopup(result) {
  try {
    // 유효성 검사
    if (!result || typeof result !== 'object') {
      throw new Error('유효하지 않은 result 데이터');
    }

    // 기존 팝업 제거
    document.querySelector('.detail-box')?.remove();

    // 템플릿 복제
    const tmpl = document.getElementById('detail-tmpl');
    if (!tmpl) {
      throw new Error('detail-tmpl 요소를 찾을 수 없습니다');
    }
    const frag = tmpl.content.cloneNode(true);

    // 데이터 주입 (null/undefined 처리)
    const titleInput = frag.getElementById('d-title');
    const summaryTextarea = frag.getElementById('d-summary');
    const scoreSpan = frag.getElementById('d-score');
    
    if (titleInput) titleInput.value = result.summaryTitle || result.title || '';
    if (summaryTextarea) summaryTextarea.value = result.summaryContent || result.summary || '';
    if (scoreSpan) scoreSpan.textContent = result.similarityScore != null ? result.similarityScore : 'N/A';

    // .detail-box 요소 추출
    const detailBox = frag.querySelector('.detail-box');
    if (!detailBox) {
      throw new Error('detail-box 요소를 찾을 수 없습니다');
    }

    // 북마크 아이콘 토글 이벤트
    const bookmarkIcon = detailBox.querySelector('.bookmark-icon');
    if (bookmarkIcon) {
      bookmarkIcon.addEventListener('click', () => {
        const current = bookmarkIcon.textContent.trim();
        bookmarkIcon.textContent = current === 'bookmark_border' ? 'bookmark' : 'bookmark_border';
      });
    }

    // 닫기 버튼 이벤트
    const closeButton = detailBox.querySelector('#d-close');
    if (closeButton) {
      closeButton.onclick = () => {
        detailBox.remove();
      };
    }

    // 카드에 팝업 추가
    const parentCard = document.querySelector('.news-sum-card');
    if (!parentCard) {
      throw new Error('news-sum-card 요소를 찾을 수 없습니다');
    }
    parentCard.appendChild(detailBox);

    console.log('팝업 렌더링 성공:', result);
  } catch (error) {
    console.error('Detail 팝업 렌더링 실패:', error);
    alert('상세 데이터를 표시하지 못했습니다: ' + error.message);
  }
}

/******************* 6. Basic 리스트 클릭 이벤트  *******************/
function bindBasicClickSwitch() {
  const ul = document.getElementById('basic-list');
  if (!ul) {
    console.error('basic-list 요소를 찾을 수 없습니다');
    return;
  }

  ul.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li || !li.dataset.id) return;

    e.preventDefault(); // 기본 링크 동작 방지
    
    const analysisId = li.dataset.id;
    console.log('Basic 리스트 클릭 - ID:', analysisId);
    
    // 로딩 표시
    const originalText = li.textContent;
    li.textContent = '로딩 중...';
    
    try {
      const result = await fetchDetailById(analysisId);
      openDetailPopup(result);
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 상태 해제
      li.textContent = originalText;
    }
  });
}

/******************* 7. Detail 리스트 클릭 이벤트  *******************/
function bindDetailClick() {
  const ul = document.getElementById('detail-list');
  if (!ul) return;

  ul.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li || !li.dataset.id) return;
    
    const analysisId = li.dataset.id;
    console.log('Detail 리스트 클릭 - ID:', analysisId);
    
    // 로딩 표시
    const originalText = li.textContent;
    li.textContent = '로딩 중...';
    
    try {
      const result = await fetchDetailById(analysisId);
      openDetailPopup(result);
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      alert('데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 상태 해제
      li.textContent = originalText;
    }
  });
}

/******************* 8. 탭 전환 이벤트  *******************/
function bindTabSwitch() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const targetContent = document.getElementById(`${tab.dataset.tab}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      if (tab.dataset.tab === 'detail') {
        renderDetailList();
      }
    });
  });
}

/******************* 9. 더보기 버튼 이벤트 *******************/
function bindMoreButton() {
  const moreButtons = document.querySelectorAll('.more-btn');
  moreButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.parentElement;
      if (content.id === 'basic-content') {
        console.log('Basic 더보기 클릭');
        renderBasicList();
      } else if (content.id === 'detail-content') {
        console.log('Detail 더보기 클릭');
        renderDetailList();
      }
    });
  });
}

/******************* 10. 초기화 *******************/
document.addEventListener('DOMContentLoaded', () => {
  console.log('확장프로그램 초기화 시작');
  
  // const token = localStorage.getItem('token');
  // if (!token) {
  //   console.warn('인증 토큰이 없습니다. 일부 기능이 제한될 수 있습니다.');
  // }
  
  // 사용자명으로 로그인 상태 체크 (토큰 대신)
  const username = localStorage.getItem('username');
  if (!username) {
    console.warn('로그인 정보가 없습니다. 일부 기능이 제한될 수 있습니다.');
  }
  
  // 이벤트 바인딩
  bindTabSwitch();
  bindDetailClick();
  bindMoreButton();
  
  // Basic 리스트 클릭 이벤트 바인딩 (지연 바인딩 지원)
  if (document.getElementById('basic-list')) {
    bindBasicClickSwitch();
  } else {
    window.addEventListener('summary-card-ready', bindBasicClickSwitch);
  }
  
  // 초기 데이터 로드
  renderBasicList();
  
  console.log('확장프로그램 초기화 완료');
});