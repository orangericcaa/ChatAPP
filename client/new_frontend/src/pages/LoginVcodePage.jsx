import React, { useState } from 'react';
import { httpClient } from '../../config/httpClient.js';
import { API_ENDPOINTS } from '../../config/api.js';

const LoginVcodePage = ({ onNavigateToLogin, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email.trim()) {
      showAlertMessage('请输入邮箱');
      return;
    }

    try {
      // 发送验证码接口
      const response = await httpClient.post(
        API_ENDPOINTS.AUTH.VERIFY_TOKEN.replace('verify', 'send-code'),
        { email }
      );
      if (response.success) {
        setCodeSent(true);
        showAlertMessage('验证码已发送到您的邮箱');
      } else if (response.message && response.message.includes('用户不存在')) {
        showAlertMessage('该用户不存在，请注册');
      } else {
        showAlertMessage(response.message || '发送验证码失败');
      }
    } catch (error) {
      showAlertMessage(error.message || '发送验证码失败');
    }
  };

  // 验证码登录
  const handleLogin = async () => {
    if (!email.trim()) {
      showAlertMessage('请输入邮箱');
      return;
    }
    if (!verificationCode.trim()) {
      showAlertMessage('请输入验证码');
      return;
    }

    try {
      // 登录接口
      const response = await httpClient.post(
        API_ENDPOINTS.AUTH.VERIFY_TOKEN.replace('verify', 'login-with-code'),
        { email, code: verificationCode }
      );
      if (response.success) {
        localStorage.setItem('authToken', response.token || '');
        showAlertMessage('登录成功！');
        setTimeout(async () => {
          // 获取用户信息
          let userInfo = { email, name: '' };
          try {
            const profileRes = await httpClient.get(API_ENDPOINTS.USER.PROFILE, { email });
            if (profileRes.success && profileRes.data) {
              userInfo = {
                email: profileRes.data.email,
                name: profileRes.data.name,
                token: response.token || '',
              };
            }
          } catch {
            // 获取用户信息失败，忽略
          }
          onLoginSuccess(userInfo);
        }, 1000);
      } else if (response.message && response.message.includes('用户不存在')) {
        showAlertMessage('该用户不存在，请注册');
      } else if (response.message && response.message.includes('验证码')) {
        showAlertMessage('验证码错误，请重试');
      } else {
        showAlertMessage(response.message || '登录失败');
      }
    } catch (error) {
      showAlertMessage(error.message || '登录失败，请重试');
    }
  };

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handlePasswordLogin = () => {
    onNavigateToLogin();
  };

  // 样式定义同原版
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundImage: 'url("/LoginBack.png")',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    minWidth: '1200px',
    width: '100vw',
    boxSizing: 'border-box',
  };

  const formContainerStyle = {
    backgroundColor: 'rgba(252, 252, 252, 0.8)',
    borderRadius: '16px',
    padding: '50px 60px',
    boxShadow: '0 8px 32px rgba(233, 30, 99, 0.15)',
    width: '100%',
    maxWidth: '480px',
    minWidth: '400px',
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '600',
    color: '#e91e63',
    textAlign: 'center',
    marginBottom: '40px',
  };

  const inputGroupStyle = {
    marginBottom: '24px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '16px',
    fontWeight: '500',
    color: '#424242',
    marginBottom: '10px',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    border: '1px solid #f8bbd9',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  };

  const inputFocusStyle = {
    borderColor: '#e91e63',
    boxShadow: '0 0 0 3px rgba(233, 30, 99, 0.1)',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '15px',
    marginTop: '35px',
  };

  const buttonStyle = {
    flex: 1,
    padding: '14px 28px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const sendCodeButtonStyle = {
    ...buttonStyle,
    backgroundColor: codeSent ? '#c8e6c9' : '#f8bbd9',
    color: codeSent ? '#4caf50' : '#e91e63',
    cursor: codeSent ? 'default' : 'pointer',
  };

  const loginButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e91e63',
    color: '#ffffff',
  };

  const linkStyle = {
    textAlign: 'center',
    marginTop: '20px',
  };

  const linkTextStyle = {
    color: '#e91e63',
    fontSize: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  };

  const alertStyle = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    color: '#e91e63',
    padding: '12px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(233, 30, 99, 0.2)',
    border: '1px solid #f8bbd9',
    zIndex: 1000,
    animation: showAlert ? 'slideDown 0.3s ease' : 'slideUp 0.3s ease',
  };

  const Button = ({ style, onClick, children, type = 'button', disabled = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    if (disabled) {
      return (
        <button style={style} disabled>
          {children}
        </button>
      );
    }

    const hoverStyle = type === 'sendCode'
      ? { backgroundColor: '#f48fb1', transform: 'translateY(-1px)' }
      : { backgroundColor: '#c2185b', transform: 'translateY(-1px)' };

    const activeStyle = { transform: 'translateY(0px) scale(0.98)' };

    return (
      <button
        style={{
          ...style,
          ...(isHovered ? hoverStyle : {}),
          ...(isActive ? activeStyle : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h1 style={titleStyle}>验证码登录</h1>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>邮箱</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请输入邮箱"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>验证码</label>
          <input
            style={inputStyle}
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请输入验证码"
          />
        </div>

        <div style={buttonContainerStyle}>
          <Button
            style={sendCodeButtonStyle}
            onClick={handleSendCode}
            type="sendCode"
            disabled={codeSent}
          >
            {codeSent ? '已发送' : '发送验证码'}
          </Button>
          <Button
            style={loginButtonStyle}
            onClick={handleLogin}
            type="login"
          >
            登录
          </Button>
        </div>

        <div style={linkStyle}>
          <a
            style={linkTextStyle}
            onClick={handlePasswordLogin}
            onMouseEnter={(e) => e.target.style.color = '#c2185b'}
            onMouseLeave={(e) => e.target.style.color = '#e91e63'}
          >
            密码登录
          </a>
        </div>
      </div>

      {/* alert 弹窗 */}
      {showAlert && (
        <div style={alertStyle}>
          {alertMessage}
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateX(-50%) translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
            to {
              transform: translateX(-50%) translateY(-100%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoginVcodePage;
