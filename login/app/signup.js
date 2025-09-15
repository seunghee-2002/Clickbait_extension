// app/signup.js - 회원가입 통신 로직

document.addEventListener('DOMContentLoaded', () => {
  // 1) 폼 요소 찾기
  const form     = document.getElementById('signup-form');
  const errorMsg = document.getElementById('signup-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();  // 페이지 리로드 방지

    // 2) 입력값 읽기 및 유효성 검사
    const username = form.username.value.trim();
    const email    = form.email.value.trim();
    const password = form.password.value;
    const phone    = form.phone.value.trim();
    const agree    = form.agree.checked;

    // 필수 입력값 검사
    if (!username) {
      errorMsg.textContent = '이름을 입력해주세요.';
      return;
    }
    if (!email) {
      errorMsg.textContent = '이메일을 입력해주세요.';
      return;
    }
    if (!password) {
      errorMsg.textContent = '비밀번호를 입력해주세요.';
      return;
    }
    if (password.length < 8) {
      errorMsg.textContent = '비밀번호는 8자 이상이어야 합니다.';
      return;
    }
    if (!agree) {
      errorMsg.textContent = '개인정보 수집 및 활용에 동의해주세요.';
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMsg.textContent = '올바른 이메일 형식을 입력해주세요.';
      return;
    }

    // 3) 로딩 상태 표시
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '가입 중...';
    submitBtn.disabled = true;
    errorMsg.textContent = ''; // 이전 에러 메시지 클리어

    // 4) 회원가입 요청 데이터 준비
    const signupRequest = {
      username: username,
      email: email,
      password: password,
      tel: phone || null, // 선택 사항이므로 빈 값이면 null
      agree: agree
    };

    try {
      // 5) 회원가입 요청
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(signupRequest)
      });

      const result = await response.json();

      // 6) 에러 처리
      if (!response.ok) {
        // 서버에서 반환한 구체적인 에러 메시지 사용
        throw new Error(result.message || `회원가입 실패 (${response.status})`);
      }

      // 7) 성공 처리
      console.log('회원가입 성공:', result);
      
      // 성공 메시지 표시
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      
      // 폼 초기화
      form.reset();
      
      // 로그인 페이지로 이동 (현재 페이지에서 로그인 탭으로 전환)
      const signinCard   = document.getElementById('card-signin');
      const signupCard   = document.getElementById('card-signup');
      const switchSignin = document.getElementById('switch-signin');
      const switchSignup = document.getElementById('switch-signup');

      if (signinCard && signupCard) {
        // 회원가입 카드 숨기고 로그인 카드 보이기
        signupCard.classList.add('ng-hide');
        switchSignup.classList.add('ng-hide');
        signinCard.classList.remove('ng-hide');
        switchSignin.classList.remove('ng-hide');
      } else {
        // 별도 로그인 페이지로 이동
        window.location.href = 'login-signup.html';
      }

    } catch (err) {
      console.error('회원가입 실패:', err);
      errorMsg.textContent = err.message;
    } finally {
      // 8) 로딩 상태 해제
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // 9) 실시간 입력 유효성 검사 (선택사항)
  const emailInput = form.email;
  const passwordInput = form.password;

  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.style.borderColor = '#d32f2f';
    } else {
      emailInput.style.borderColor = '';
    }
  });

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (password.length > 0 && password.length < 8) {
      passwordInput.style.borderColor = '#d32f2f';
    } else {
      passwordInput.style.borderColor = '';
    }
  });
});