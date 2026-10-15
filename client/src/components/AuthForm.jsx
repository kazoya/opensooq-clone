import React, { useState } from 'react';

const AuthForm = ({ type, onSubmit, onToggle, error }) => {
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const userData = {
        email: authEmail,
        password: authPassword
      };
      if (type === 'register') {
        userData.name = authName;
      }
      onSubmit(userData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggle = () => {
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    onToggle();
  };

  return (
    <form onSubmit={handleSubmit} data-testid="auth-form">
      {type === 'register' && (
        <div>
          <label>
            الاسم:
            <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} required data-testid="auth-name" />
          </label>
        </div>
      )}
      <div>
        <label>
          البريد الإلكتروني:
          <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required data-testid="auth-email" />
        </label>
      </div>
      <div>
        <label>
          كلمة المرور:
          <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required data-testid="auth-password" />
        </label>
      </div>
      {error && <p data-testid="error-message">{error}</p>}
      <button type="submit" data-testid="auth-submit">{type === 'register' ? 'تسجيل' : 'دخول'}</button>
      <button type="button" onClick={handleToggle} data-testid="auth-toggle">
        {type === 'register' ? 'تسجيل الدخول' : 'إنشاء حساب'}
      </button>
    </form>
  );
};

export default AuthForm;
