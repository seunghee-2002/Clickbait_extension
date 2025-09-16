// login/app/ui-toggle.js - 로그인/회원가입 화면 전환 로직

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM 로드 완료');
  
  // 요소들 가져오기
  const signinCard   = document.getElementById('card-signin');
  const signupCard   = document.getElementById('card-signup');
  const switchSignin = document.getElementById('switch-signin');
  const switchSignup = document.getElementById('switch-signup');
  const btnShowSignup = document.getElementById('btn-show-signup');
  const btnShowLogin = document.getElementById('btn-show-login');

  // 요소 존재 확인
  console.log('요소 확인:', {
    signinCard: !!signinCard,
    signupCard: !!signupCard,
    switchSignin: !!switchSignin,
    switchSignup: !!switchSignup,
    btnShowSignup: !!btnShowSignup,
    btnShowLogin: !!btnShowLogin
  });

  // 회원가입 버튼 클릭 이벤트
  if (btnShowSignup) {
    btnShowSignup.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('회원가입 버튼 클릭됨');
      
      // 로그인 요소들 숨기기
      if (signinCard) signinCard.classList.add('ng-hide');
      if (switchSignin) switchSignin.classList.add('ng-hide');
      
      // 회원가입 요소들 보이기
      if (signupCard) signupCard.classList.remove('ng-hide');
      if (switchSignup) switchSignup.classList.remove('ng-hide');
      
      console.log('회원가입 화면으로 전환됨');
    });
  }

  // 로그인 버튼 클릭 이벤트
  if (btnShowLogin) {
    btnShowLogin.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('로그인 버튼 클릭됨');
      
      // 회원가입 요소들 숨기기
      if (signupCard) signupCard.classList.add('ng-hide');
      if (switchSignup) switchSignup.classList.add('ng-hide');
      
      // 로그인 요소들 보이기
      if (signinCard) signinCard.classList.remove('ng-hide');
      if (switchSignin) switchSignin.classList.remove('ng-hide');
      
      console.log('로그인 화면으로 전환됨');
    });
  }
});