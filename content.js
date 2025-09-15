/* extension/content.js - 개선된 컨텐츠 스크립트 */
(() => {
  // ── a) Material Icons CSS 동적 삽입 ───────────────────
  if (!document.querySelector('link[href*="Material+Icons"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  // ── b) 한 페이지에서 한 번만 실행 ───────────────────────
  if (window.__newsCrawlerDone__) return;
  window.__newsCrawlerDone__ = true;

  // ── c) 확장프로그램 활성화 상태 확인 ─────────────────────
  let isExtensionActive = true;
  
  chrome.storage.sync.get(['extensionActive'], (result) => {
    isExtensionActive = result.extensionActive !== false;
    if (isExtensionActive) {
      initializeExtension();
    }
  });

  // ── 1. 확장프로그램 초기화 ─────────────────────────────────
  function initializeExtension() {
    console.log('News Crawler 확장프로그램 시작');
    
    if (document.readyState === 'complete') {
      injectSummaryCard();
      extractAndSendNewsData();
    } else {
      window.addEventListener('load', () => {
        injectSummaryCard();
        extractAndSendNewsData();
      });
    }
  }

  // ── 2. 카드 삽입 ─────────────────────────────────────
  function injectSummaryCard() {
    if (document.querySelector('.news-sum-card')) return; // 이미 있으면 패스

    const cardHTML = `
      <aside class="card news-sum-card">
        <!-- 탭 버튼 -->
        <div class="tabs">
          <button class="tab active" data-target="basic">자동 요약</button>
          <button class="tab" data-target="detail">분석 상세보기</button>
        </div>

        <!-- 1. Basic 탭 (처음에는 보이도록) -->
        <div class="tab-content basic-content" style="display: block;">
          <h3 class="list-title">최근에 요약된 글</h3>
          <ul class="list basic" id="basic-list">
            <li style="color:#999; font-style:italic;">데이터를 불러오는 중...</li>
          </ul>
        </div>

        <!-- 2. Detail 탭 (처음에는 숨김) -->
        <div class="tab-content detail-content" style="display: none;">
          <h3 class="list-title">최근에 분석된 글</h3>
          <ul class="list detail" id="detail-list">
            <li style="color:#999; font-style:italic;">데이터를 불러오는 중...</li>
          </ul>
        </div>

        <!-- 하단 컨트롤 -->
        <div class="bottom">
          <label>
            <input type="checkbox" id="card-toggle" checked /> 
            <span>활성화</span>
          </label>
          <button class="more">
            <span class="material-icons">more_vert</span>
          </button>
          <div class="menu" style="display: none;">
            <div class="menu-item" id="analyze-current-page">현재 페이지 분석</div>
            <div class="menu-item" id="refresh-data">데이터 새로고침</div>
            <div class="menu-item" id="open-settings">설정</div>
            <div class="menu-item" id="open-help">도움말</div>
          </div>
        </div>

        <!-- 팝업 템플릿 -->
        <template id="detail-tmpl">
          <div class="detail-box">
            <input id="d-title" placeholder="분석된 제목" readonly />
            <textarea id="d-summary" placeholder="내용 요약" readonly></textarea>
            <div class="d-foot">
              유사도 점수: <span id="d-score">N/A</span>
              <span class="material-icons bookmark-icon" title="북마크">bookmark_border</span>
              <button id="d-close" class="material-icons" title="닫기">close</button>
            </div>
          </div>
        </template>
      </aside>
    `;

    (document.querySelector('#contents') || document.body).insertAdjacentHTML(
      'beforeend',
      cardHTML
    );
    
    // 카드 삽입 완료 이벤트 발생
    window.dispatchEvent(new Event('summary-card-ready'));
    
    console.log('요약 카드 삽입 완료');
  }

  // ── 3. API 통신 헬퍼 함수 ─────────────────────────────────
  const API_BASE_URL = 'http://localhost:8080/api';

  async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `서버 오류 (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API 요청 실패 [${endpoint}]:`, error);
      throw error;
    }
  }

  // ── 4. Basic 탭 리스트 렌더 ───────────────────────────
  async function renderBasicList() {
    const ul = document.getElementById('basic-list');
    if (!ul) return;
    
    ul.innerHTML = '<li style="color:#999;">로딩 중...</li>';
    console.log('Basic 리스트 렌더링 실행');
    
    try {
      const list = await apiRequest('/list?type=related', {
        method: 'GET'
      });

      ul.innerHTML = '';
      if (list && list.length > 0) {
        list.forEach(item => {
          const li = document.createElement('li');
          li.dataset.id = item.id;
          
          const a = document.createElement('a');
          a.href = item.originalUrl || '#';
          a.textContent = item.summaryTitle || '제목 없음';
          a.addEventListener('click', (e) => e.preventDefault());
          
          li.appendChild(a);
          ul.appendChild(li);
        });
        console.log(`Basic 리스트 렌더링 성공: ${list.length}개 항목`);
      } else {
        ul.innerHTML = '<li style="color:#999;">분석된 기사가 없습니다.</li>';
      }
    } catch (error) {
      console.error('Basic 리스트 로드 실패:', error);
      ul.innerHTML = '<li style="color:#dc3545;">데이터를 불러오지 못했습니다.</li>';
      
      // 연결 실패 시 더미 데이터 사용
      loadDummyBasicData(ul);
    }
  }

  // ── 5. Detail 탭 리스트 렌더 ───────────────────────────
  async function renderDetailList() {
    const ul = document.getElementById('detail-list');
    if (!ul) return;
    
    // 이미 렌더링된 경우 건너뜀
    if (ul.children.length > 0 && !ul.textContent.includes('로딩') && !ul.textContent.includes('불러오')) {
      return;
    }

    ul.innerHTML = '<li style="color:#999;">로딩 중...</li>';

    try {
      const list = await apiRequest('/list?type=related', {
        method: 'GET'
      });

      ul.innerHTML = '';
      if (list && list.length > 0) {
        list.forEach(item => {
          const li = document.createElement('li');
          li.dataset.id = item.id;
          li.textContent = item.summaryTitle || '제목 없음';
          ul.appendChild(li);
        });
        console.log(`Detail 리스트 렌더링 성공: ${list.length}개 항목`);
      } else {
        ul.innerHTML = '<li style="color:#999;">분석된 기사가 없습니다.</li>';
      }
    } catch (error) {
      console.error('Detail 리스트 로드 실패:', error);
      ul.innerHTML = '<li style="color:#dc3545;">데이터를 불러오지 못했습니다.</li>';
      
      // 연결 실패 시 더미 데이터 사용
      loadDummyDetailData(ul);
    }
  }

  // ── 6. 더미 데이터 로드 ─────────────────────────────────
  function loadDummyBasicData(ul) {
    console.log('Basic 더미 데이터 로드');
    ul.innerHTML = `
      <li data-id="dummy-1"><a href="#">AI 기술의 미래와 전망</a></li>
      <li data-id="dummy-2"><a href="#">기후 변화 대응 정책</a></li>
      <li data-id="dummy-3"><a href="#">디지털 전환 가속화</a></li>
    `;
  }

  function loadDummyDetailData(ul) {
    console.log('Detail 더미 데이터 로드');
    ul.innerHTML = `
      <li data-id="dummy-1">AI 기술의 미래와 전망</li>
      <li data-id="dummy-2">기후 변화 대응 정책</li>
      <li data-id="dummy-3">디지털 전환 가속화</li>
    `;
  }

  // ── 7. ID로 상세 데이터 가져오기 ─────────────────────────
  async function fetchDetailById(id) {
    try {
      // 더미 데이터인 경우
      if (id.startsWith('dummy-')) {
        return {
          summaryTitle: `더미 제목 ${id.slice(-1)}`,
          summaryContent: `이것은 더미 데이터입니다. 실제 서버 연결 시 실제 분석 결과가 표시됩니다. ID: ${id}`,
          similarityScore: Math.floor(Math.random() * 40) + 60
        };
      }

      const result = await apiRequest('/id', {
        method: 'POST',
        body: JSON.stringify({ id: id })
      });
      
      console.log('ID로 데이터 가져오기 성공:', result);
      return result;
    } catch (error) {
      console.error('ID로 데이터 가져오기 실패:', error);
      
      // 실패 시 더미 데이터 반환
      return {
        summaryTitle: '오류 발생',
        summaryContent: `데이터를 가져오는 중 오류가 발생했습니다: ${error.message}`,
        similarityScore: 'N/A'
      };
    }
  }

  // ── 8. 상세 팝업 열기 ─────────────────────────────────
  async function openDetailPopup(result) {
    try {
      // 유효성 검사
      if (!result || typeof result !== 'object') {
        throw new Error('유효하지 않은 데이터');
      }

      // 기존 팝업 제거
      document.querySelector('.detail-box')?.remove();

      // 템플릿 복제
      const tmpl = document.getElementById('detail-tmpl');
      if (!tmpl) {
        throw new Error('팝업 템플릿을 찾을 수 없습니다');
      }
      const frag = tmpl.content.cloneNode(true);

      // 데이터 주입
      const titleInput = frag.getElementById('d-title');
      const summaryTextarea = frag.getElementById('d-summary');
      const scoreSpan = frag.getElementById('d-score');
      
      if (titleInput) titleInput.value = result.summaryTitle || result.title || '';
      if (summaryTextarea) summaryTextarea.value = result.summaryContent || result.summary || '';
      if (scoreSpan) scoreSpan.textContent = result.similarityScore != null ? result.similarityScore : 'N/A';

      const detailBox = frag.querySelector('.detail-box');
      if (!detailBox) {
        throw new Error('팝업 요소를 찾을 수 없습니다');
      }

      // 북마크 아이콘 토글 이벤트
      const bookmarkIcon = detailBox.querySelector('.bookmark-icon');
      if (bookmarkIcon) {
        bookmarkIcon.addEventListener('click', () => {
          const current = bookmarkIcon.textContent.trim();
          bookmarkIcon.textContent = current === 'bookmark_border' ? 'bookmark' : 'bookmark_border';
          
          // 북마크 상태 저장
          const isBookmarked = bookmarkIcon.textContent === 'bookmark';
          chrome.storage.local.get(['bookmarkCount'], (result) => {
            const count = result.bookmarkCount || 0;
            chrome.storage.local.set({ 
              bookmarkCount: isBookmarked ? count + 1 : Math.max(0, count - 1) 
            });
          });
          
          console.log(`북마크 ${isBookmarked ? '추가' : '제거'}`);
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
        throw new Error('요약 카드를 찾을 수 없습니다');
      }
      parentCard.appendChild(detailBox);

      console.log('팝업 렌더링 성공:', result);
    } catch (error) {
      console.error('팝업 렌더링 실패:', error);
      alert(`상세 정보를 표시할 수 없습니다: ${error.message}`);
    }
  }

  // ── 9. 탭 전환 로직 ─────────────────────────────────────
  function bindTabButtons() {
    document.querySelectorAll('.tabs .tab').forEach(btn => {
      btn.addEventListener('click', () => {
        console.log(`[탭 전환] ${btn.textContent} 탭 클릭`);

        // active 클래스 토글
        document.querySelectorAll('.tabs .tab').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');

        // 콘텐츠 토글
        const target = btn.dataset.target;
        const basicDiv = document.querySelector('.basic-content');
        const detailDiv = document.querySelector('.detail-content');

        if (target === 'basic') {
          basicDiv.style.display = 'block';
          detailDiv.style.display = 'none';
          renderBasicList();
        } else {
          basicDiv.style.display = 'none';
          detailDiv.style.display = 'block';
          renderDetailList();
        }
      });
    });
  }

  // ── 10. Basic 리스트 클릭 → Detail 탭 + 팝업 ─────────────
  function bindBasicClickSwitch() {
    const ul = document.getElementById('basic-list');
    if (!ul) return;
    
    ul.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li || !li.dataset.id) return;

      e.preventDefault();
      
      const analysisId = li.dataset.id;
      console.log(`[Basic 클릭] ID: ${analysisId}`);
      
      // 로딩 표시
      const originalText = li.textContent;
      li.style.opacity = '0.5';
      
      try {
        // Detail 탭으로 전환
        const basicBtn = document.querySelector('.tabs .tab[data-target="basic"]');
        const detailBtn = document.querySelector('.tabs .tab[data-target="detail"]');
        const basicDiv = document.querySelector('.basic-content');
        const detailDiv = document.querySelector('.detail-content');

        if (basicBtn && detailBtn && basicDiv && detailDiv) {
          basicBtn.classList.remove('active');
          detailBtn.classList.add('active');
          basicDiv.style.display = 'none';
          detailDiv.style.display = 'block';
        }

        // Detail 리스트 렌더링
        await renderDetailList();
        
        // 상세 데이터 가져오기 및 팝업 표시
        const result = await fetchDetailById(analysisId);
        await openDetailPopup(result);
        
      } catch (error) {
        console.error('Basic 클릭 처리 실패:', error);
        alert(`오류가 발생했습니다: ${error.message}`);
      } finally {
        // 로딩 상태 해제
        li.style.opacity = '1';
      }
    });
  }

  // ── 11. Detail 리스트 클릭 → 팝업 ─────────────────────────
  function bindDetailClick() {
    const ul = document.getElementById('detail-list');
    if (!ul) return;
    
    ul.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li || !li.dataset.id) return;
      
      const analysisId = li.dataset.id;
      console.log(`[Detail 클릭] ID: ${analysisId}`);
      
      // 로딩 표시
      const originalText = li.textContent;
      li.style.opacity = '0.5';
      
      try {
        const result = await fetchDetailById(analysisId);
        await openDetailPopup(result);
      } catch (error) {
        console.error('Detail 클릭 처리 실패:', error);
        alert(`오류가 발생했습니다: ${error.message}`);
      } finally {
        // 로딩 상태 해제
        li.style.opacity = '1';
      }
    });
  }

  // ── 12. 더보기 버튼 및 메뉴 ─────────────────────────────────
  function bindMoreButton() {
    const moreBtn = document.querySelector('.news-sum-card .bottom .more');
    if (!moreBtn) return;

    const menu = document.querySelector('.news-sum-card .menu');
    
    // 메뉴 토글
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    // 메뉴 항목 이벤트
    const analyzeCurrentBtn = document.getElementById('analyze-current-page');
    const refreshBtn = document.getElementById('refresh-data');
    const settingsBtn = document.getElementById('open-settings');
    const helpBtn = document.getElementById('open-help');

    if (analyzeCurrentBtn) {
      analyzeCurrentBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        analyzeCurrentPage();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        refreshAllData();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        alert('설정 기능은 확장프로그램 팝업에서 이용하실 수 있습니다.');
      });
    }

    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        menu.style.display = 'none';
        showHelp();
      });
    }

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (menu && !menu.contains(e.target) && !moreBtn.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }

  // ── 13. 카드 토글 기능 ─────────────────────────────────
  function bindCardToggle() {
    const toggle = document.getElementById('card-toggle');
    const card = document.querySelector('.news-sum-card');
    
    if (toggle && card) {
      toggle.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        card.style.opacity = isActive ? '1' : '0.3';
        card.style.pointerEvents = isActive ? 'auto' : 'none';
        
        console.log(`카드 ${isActive ? '활성화' : '비활성화'}`);
      });
    }
  }

  // ── 14. 현재 페이지 분석 ─────────────────────────────────
  async function analyzeCurrentPage() {
    console.log('현재 페이지 분석 시작');
    
    try {
      const newsData = extractNewsData();
      
      if (!newsData.title || !newsData.content) {
        throw new Error('페이지에서 뉴스 데이터를 추출할 수 없습니다.');
      }
      
      // 백엔드로 분석 요청
      const result = await apiRequest('/url', {
        method: 'POST',
        body: JSON.stringify({ url: window.location.href })
      });
      
      console.log('현재 페이지 분석 완료:', result);
      
      // 결과를 팝업으로 표시
      await openDetailPopup(result);
      
      // 통계 업데이트
      chrome.storage.local.get(['analyzedCount'], (storageResult) => {
        const count = (storageResult.analyzedCount || 0) + 1;
        chrome.storage.local.set({ analyzedCount: count });
      });
      
      // 데이터 새로고침
      await refreshAllData();
      
    } catch (error) {
      console.error('현재 페이지 분석 실패:', error);
      alert(`페이지 분석에 실패했습니다: ${error.message}`);
    }
  }

  // ── 15. 뉴스 데이터 추출 ─────────────────────────────────
  function extractNewsData() {
    const title = document.querySelector('h2.media_end_head_headline')?.textContent?.trim();
    const content = document.querySelector('#dic_area')?.textContent?.trim();
    const url = window.location.href;
    
    return {
      title: title || '',
      content: content || '',
      url: url
    };
  }

  // ── 16. 뉴스 데이터 자동 전송 ─────────────────────────────
  function extractAndSendNewsData() {
    const newsData = extractNewsData();
    
    if (newsData.title && newsData.content) {
      // background script로 전송
      chrome.runtime.sendMessage({
        action: 'extractArticle',
        data: newsData
      }, (response) => {
        if (response?.status === 'sent') {
          console.log('뉴스 데이터 자동 전송 완료');
        } else {
          console.warn('뉴스 데이터 전송 실패');
        }
      });
    } else {
      console.log('ℹ추출할 뉴스 데이터가 없습니다.');
    }
  }

  // ── 17. 데이터 새로고침 ─────────────────────────────────
  async function refreshAllData() {
    console.log('데이터 새로고침');
    
    try {
      await renderBasicList();
      
      // Detail 탭이 활성화되어 있으면 Detail 리스트도 새로고침
      const detailDiv = document.querySelector('.detail-content');
      if (detailDiv && detailDiv.style.display !== 'none') {
        await renderDetailList();
      }
      
      console.log('데이터 새로고침 완료');
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  }

  // ── 18. 도움말 표시 ─────────────────────────────────
  function showHelp() {
    const helpText = `
News Crawler 도움말

주요 기능:
• 뉴스 기사 자동 분석 및 요약
• 유사 기사 추천
• 제목-내용 일치도 분석

사용법:
1. 네이버 뉴스 기사를 열면 자동으로 카드가 표시됩니다
2. '자동 요약' 탭에서 최근 분석된 기사를 확인하세요
3. 기사를 클릭하면 상세 분석 결과를 볼 수 있습니다
4. 북마크 아이콘으로 관심 기사를 저장하세요

설정:
• 확장프로그램 아이콘을 클릭하여 더 많은 옵션에 접근하세요
• 카드 하단의 체크박스로 활성화/비활성화 가능
    `;
    
    alert(helpText);
  }

  // ── 19. 메시지 리스너 (팝업과의 통신) ─────────────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeCurrentPage') {
      analyzeCurrentPage()
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error('메시지 처리 실패:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 비동기 응답
    }
    
    if (request.action === 'refreshData') {
      refreshAllData()
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error('새로고침 실패:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 비동기 응답
    }
  });

  // ── 20. 초기화 및 이벤트 바인딩 ─────────────────────────
  window.addEventListener('summary-card-ready', () => {
    console.log('카드 준비 완료 - 이벤트 바인딩 시작');
    
    // 이벤트 바인딩
    bindTabButtons();
    bindBasicClickSwitch();
    bindDetailClick();
    bindMoreButton();
    bindCardToggle();
    
    // 초기 데이터 로드
    renderBasicList();
    
    console.log('모든 이벤트 바인딩 완료');
  });

  console.log('News Crawler 컨텐츠 스크립트 로드 완료');
})();