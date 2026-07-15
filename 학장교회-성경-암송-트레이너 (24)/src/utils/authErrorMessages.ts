/**
 * Supabase Auth 관련 에러 메시지를 한국어로 변환해주는 공통 유틸리티 함수입니다.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';

  // error 객체가 string인 경우와 객체인 경우를 모두 처리
  const errorMsg = typeof error === 'string' ? error : (error.message || '');
  const errorCode = typeof error === 'object' ? (error.code || '') : '';
  
  const msg = errorMsg.toLowerCase();
  const code = errorCode.toLowerCase();

  // 1. 구체적인 에러 코드 매칭
  if (
    code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials')
  ) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  if (
    code === 'email_address_invalid' ||
    msg.includes('unable to validate email address') ||
    msg.includes('invalid format') ||
    msg.includes('invalid email') ||
    msg.includes('email format')
  ) {
    return '올바른 이메일 형식을 입력해주세요.';
  }

  if (
    code === 'email_rate_limit_exceeded' ||
    msg.includes('email rate limit exceeded') ||
    msg.includes('rate limit exceeded') ||
    msg.includes('request_limit_exceeded') ||
    code === 'over_query_limit'
  ) {
    return `[Auth Rate Limit Error] Code: ${errorCode || 'NoCode'}, Message: ${errorMsg}`;
  }

  if (
    code === 'weak_password' ||
    msg.includes('password should be at least 6 characters') ||
    msg.includes('password should be') ||
    msg.includes('signup_weak_password')
  ) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }

  if (
    code === 'user_already_exists' ||
    msg.includes('user already exists') ||
    msg.includes('already registered') ||
    msg.includes('email already in use')
  ) {
    return '이미 등록된 회원입니다.';
  }

  if (msg.includes('email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다.';
  }

  if (
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error')
  ) {
    return '네트워크 연결이 불안정합니다. 연결 상태를 확인 후 다시 시도해 주세요.';
  }

  // 2. 그 외 특정 영어 메시지들을 걸러내어 한국어로 표시
  if (msg.includes('user not found') || msg.includes('cannot find user')) {
    return '등록되지 않은 사용자입니다.';
  }

  if (msg.includes('password reset required') || msg.includes('reset password')) {
    return '비밀번호 재설정이 필요합니다.';
  }

  // 기본 반환 메시지 (영어 메시지가 직접 노출되는 것을 방지)
  return '요청 처리 중 문제가 발생했습니다. 입력 정보를 확인 후 다시 시도해주세요.';
}
