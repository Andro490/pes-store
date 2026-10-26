import { useState, useEffect, useRef } from 'react';
import { supportApi, type SupportMessageItem } from '../../services/api';

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState(() => localStorage.getItem('pes_support_phone') || '');
  const [phoneInput, setPhoneInput] = useState(() => localStorage.getItem('pes_support_phone') || '');
  const [isEditingPhone, setIsEditingPhone] = useState(!localStorage.getItem('pes_support_phone'));
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [unreadAdminCount, setUnreadAdminCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll messages every 4s if phone is set
  useEffect(() => {
    if (!phone) return;

    let isMounted = true;
    const fetchChat = async () => {
      try {
        const res = await supportApi.getMessages(phone);
        if (res.success && isMounted) {
          setMessages(res.data);

          // Calculate unread admin messages
          if (!isOpen) {
            const lastSeen = localStorage.getItem('pes_support_last_seen') || '1970-01-01T00:00:00Z';
            const unread = res.data.filter(
              (m) => m.sender === 'admin' && m.createdAt > lastSeen
            ).length;
            setUnreadAdminCount(unread);
          } else {
            // When open, mark all as seen
            localStorage.setItem('pes_support_last_seen', new Date().toISOString());
            setUnreadAdminCount(0);
          }
        }
      } catch {
        // Silent fail on background poll
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [phone, isOpen]);

  // When opening widget, clear unread count
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('pes_support_last_seen', new Date().toISOString());
      setUnreadAdminCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSavePhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = phoneInput.trim();
    if (!clean || clean.length < 9) {
      alert('يرجى إدخال رقم موبايل صحيح (9 أرقام على الأقل)');
      return;
    }
    setPhone(clean);
    localStorage.setItem('pes_support_phone', clean);
    setIsEditingPhone(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone) {
      setIsEditingPhone(true);
      return;
    }
    const cleanMsg = messageText.trim();
    if (!cleanMsg) return;

    try {
      setIsSending(true);
      const res = await supportApi.sendMessage(phone, cleanMsg);
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setMessageText('');
      }
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #ffe600, #f59e0b)',
          color: '#08090c',
          border: '1px solid rgba(255, 235, 150, 0.6)',
          borderRadius: '50px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.45)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <span style={{ fontSize: '18px' }}>💬</span>
        <span>الدعم الفني</span>
        {unreadAdminCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-6px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              minWidth: '22px',
              height: '22px',
              padding: '0 6px',
              fontSize: '12px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.7)',
              border: '2px solid #fff',
            }}
          >
            {unreadAdminCount}
          </span>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '24px',
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'linear-gradient(180deg, #10121a 0%, #08090d 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.15)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(255, 230, 0, 0.08))',
              borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', color: '#ffd700' }}>💬</span>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>الدعم الفني</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Mandatory Phone Banner */}
          {(!phone || isEditingPhone) ? (
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(212, 175, 55, 0.08)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffd700', marginBottom: '8px' }}>
                📱 رقم الموبايل مطلوب أولاً للتواصل والرد عليك:
              </div>
              <form onSubmit={handleSavePhone} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 01012345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#090a0f',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #ffe600, #f59e0b)',
                    color: '#08090c',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  حفظ
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <span style={{ color: '#94a3b8' }}>
                رقمك: <strong style={{ color: '#ffd700', direction: 'ltr', display: 'inline-block' }}>{phone}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffe600',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                تغيير
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Welcome message */}
            <div style={{ textAlign: 'center', margin: '20px 0 10px' }}>
              <div style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                مرحباً بك! كيف يمكننا مساعدتك اليوم؟
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                اكتب استفسارك وسيرد عليك فريق الدعم فوراً
              </div>
            </div>

            {/* Message List */}
            {messages.map((msg) => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAdmin ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      background: isAdmin
                        ? 'linear-gradient(135deg, #ffe600, #f59e0b)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isAdmin ? '#08090c' : '#fff',
                      padding: '10px 14px',
                      borderRadius: isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      fontSize: '13px',
                      fontWeight: isAdmin ? 600 : 400,
                      lineHeight: '1.5',
                      boxShadow: isAdmin ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
                      border: isAdmin ? 'none' : '1px solid rgba(212, 175, 55, 0.2)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.message}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                      marginTop: '3px',
                      padding: '0 4px',
                    }}
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              background: '#090a0f',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder={phone ? 'اكتب رسالتك...' : 'أدخل رقم الموبايل أولاً...'}
              disabled={!phone || isSending}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                color: '#fff',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!phone || !messageText.trim() || isSending}
              style={{
                background: (!phone || !messageText.trim() || isSending)
                  ? 'rgba(212, 175, 55, 0.25)'
                  : 'linear-gradient(135deg, #ffe600, #f59e0b)',
                color: '#08090c',
                border: 'none',
                borderRadius: '12px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!phone || !messageText.trim() || isSending) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                flexShrink: 0,
              }}
            >
              {isSending ? '...' : '✈️'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
