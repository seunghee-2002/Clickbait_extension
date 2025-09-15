// background.js
const SERVER_URL = 'http://127.0.0.1:3000';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extractArticle') {
    console.log('[NewsCrawler] background received:', msg.data);

    // 백엔드로 POST 요청 (sendResponse는 오직 여기서만 호출)
    fetch(`${SERVER_URL}/api/news`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(msg.data)
    })
    .then(res => {
        console.log('[NewsCrawler] backend status:', res.status);
        sendResponse({ status: res.ok ? 'sent' : 'error' });
      })
    .catch(err => {
      console.error('[NewsCrawler] fetch error:', err);
      sendResponse({ status: 'error' });
    });

    // 비동기 sendResponse를 위해 true 반환
    return true;
  }
});
