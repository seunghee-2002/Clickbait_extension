// app/login.js - 로그인 통신 로직

document.addEventListener('DOMContentLoaded', () => {
  // 1) 폼 요소 찾기
  const form     = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();  // 페이지 리로드 방지

    // 2) 입력값 읽기
    const loginRequest = {
      email: form.email.value.trim(),
      password: form.password.value,
    }

    // 3) 로딩 상태 표시
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;
    errorMsg.textContent = ''; // 이전 에러 메시지 클리어

    try {
      // 4) 로그인 요청
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginRequest)
      });

      const result = await response.json();

      // 5) 에러 처리
      if (!response.ok) {
        throw new Error(result.message || `서버 오류 (${response.status})`);
      }

      // 6) 성공 시 사용자 정보 저장
      // if (result.token) {
      //   localStorage.setItem('token', result.token);
      //   localStorage.setItem('username', result.username || '');
      //   localStorage.setItem('email', loginRequest.email);
      // } else {
      //   throw new Error('토큰이 반환되지 않았습니다.');
      // }
      
      // 임시: 토큰 없이 사용자 정보만 저장
      localStorage.setItem('username', result.username || loginRequest.email);
      localStorage.setItem('email', loginRequest.email);
      
      console.log('로그인 성공:', result);
      
      // 7) 메인 대시보드로 이동
      window.location.href = 'index.html';

    } catch (err) {
      console.error('로그인 실패:', err);
      errorMsg.textContent = err.message;
    } finally {
      // 8) 로딩 상태 해제
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // 9) 이미 로그인된 경우 메인으로 리다이렉트 
  // const token = localStorage.getItem('token');
  // if (token) {
  //   try {
  //     // JWT 토큰이라면 만료 시간 체크 가능
  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     const currentTime = Math.floor(Date.now() / 1000);
  //     
  //     if (payload.exp && payload.exp > currentTime) {
  //       // 토큰이 아직 유효하면 메인으로
  //       window.location.href = 'index.html';
  //     } else {
  //       // 만료된 토큰 제거
  //       localStorage.removeItem('token');
  //       localStorage.removeItem('username');
  //       localStorage.removeItem('email');
  //     }
  //   } catch (e) {
  //     // 토큰 파싱 실패 시 제거
  //     localStorage.removeItem('token');
  //   }
  // }
  
  // 임시: 사용자명이 있으면 로그인된 것으로 간주
  const username = localStorage.getItem('username');
  if (username) {
    window.location.href = 'index.html';
  }
});