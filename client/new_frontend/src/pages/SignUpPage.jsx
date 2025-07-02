import React, { useState } from 'react';
import { httpClient } from '../../config/httpClient.js';
import { API_ENDPOINTS } from '../../config/api.js';

const SignUpPage = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (!formData.email.trim()) {
      showAlertMessage('请输入邮箱');
      return;
    }

    if (!validateEmail(formData.email)) {
      showAlertMessage('请输入有效的邮箱地址');
      return;
    }

    try {
      // 发送验证码接口
      const response = await httpClient.post(
        API_ENDPOINTS.AUTH.VERIFY_TOKEN.replace('verify', 'send-code'),
        { email: formData.email }
      );
      if (response.success) {
        setCodeSent(true);
        showAlertMessage('验证码已发送到您的邮箱');
      } else if (response.message && response.message.includes('注册')) {
        showAlertMessage('该邮箱已被注册');
      } else {
        showAlertMessage(response.message || '发送验证码失败');
      }
    } catch (error) {
      showAlertMessage(error.message || '发送验证码失败');
    }
  };

  // 只保留异步 handleRegister 版本
  const handleRegister = async () => {
    // 检查所有字段是否为空
    const requiredFields = [
      { field: 'email', name: '邮箱' },
      { field: 'nickname', name: '昵称' },
      { field: 'password', name: '密码' },
      { field: 'confirmPassword', name: '确认密码' },
      { field: 'verificationCode', name: '验证码' }
    ];

    for (const { field, name } of requiredFields) {
      if (!formData[field].trim()) {
        showAlertMessage(`请输入${name}`);
        return;
      }
    }

    if (!validateEmail(formData.email)) {
      showAlertMessage('请输入有效的邮箱地址');
      return;
    }

    if (formData.password.length < 6) {
      showAlertMessage('密码长度至少6位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlertMessage('两次输入的密码不一致');
      return;
    }

    try {
      // 注册接口
      const response = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: formData.email,
        username: formData.nickname,
        password: formData.password,
        vericode: formData.verificationCode
      });
      if (response.success) {
        showAlertMessage('注册成功！即将跳转到登录页面');
        setTimeout(() => {
          onNavigateToLogin();
        }, 1000);
      } else if (response.message && response.message.includes('注册')) {
        showAlertMessage('该邮箱已被注册');
      } else if (response.message && response.message.includes('验证码')) {
        showAlertMessage('验证码错误');
      } else {
        showAlertMessage(response.message || '注册失败');
      }
    } catch (error) {
      showAlertMessage(error.message || '注册失败，请重试');
    }
  };

  const handleLoginPage = () => {
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

  const codeInputContainerStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
  };

  const codeInputStyle = {
    ...inputStyle,
    flex: 1,
  };

  const sendCodeButtonStyle = {
    padding: '14px 20px',
    backgroundColor: codeSent ? '#c8e6c9' : '#f8bbd9',
    color: codeSent ? '#4caf50' : '#e91e63',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: codeSent ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  const registerButtonStyle = {
    width: '100%',
    padding: '14px 28px',
    backgroundColor: '#e91e63',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '35px',
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

  const Button = ({ style, onClick, children, disabled = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isActive, setIsActive] = useState(false);

    if (disabled) {
      return (
        <button style={style} disabled>
          {children}
        </button>
      );
    }

    const hoverStyle = {
      backgroundColor: '#c2185b',
      transform: 'translateY(-1px)'
    };
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
        <h1 style={titleStyle}>注册</h1>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>邮箱</label>
          <input
            style={inputStyle}
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请输入邮箱"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>昵称</label>
          <input
            style={inputStyle}
            type="text"
            value={formData.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请输入昵称"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>密码</label>
          <input
            style={inputStyle}
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请输入密码（至少6位）"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>确认密码</label>
          <input
            style={inputStyle}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => {
              e.target.style.borderColor = '#f8bbd9';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="请再次输入密码"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>验证码</label>
          <div style={codeInputContainerStyle}>
            <input
              style={codeInputStyle}
              type="text"
              value={formData.verificationCode}
              onChange={(e) => handleInputChange('verificationCode', e.target.value)}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = '#f8bbd9';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="请输入验证码"
            />
            <button
              style={sendCodeButtonStyle}
              onClick={handleSendCode}
              disabled={codeSent}
            >
              {codeSent ? '已发送' : '发送验证码'}
            </button>
          </div>
        </div>

        <Button
          style={registerButtonStyle}
          onClick={handleRegister}
        >
          注册
        </Button>

        <div style={linkStyle}>
          <a
            style={linkTextStyle}
            onClick={handleLoginPage}
            onMouseEnter={(e) => e.target.style.color = '#c2185b'}
            onMouseLeave={(e) => e.target.style.color = '#e91e63'}
          >
            已有账号？去登录
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

export default SignUpPage;
