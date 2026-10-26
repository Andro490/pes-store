import { useState, useEffect, useRef } from 'react';
import { supportApi, type SupportConversationItem, type SupportMessageItem } from '../../services/api';

export function AdminSupportChat() {
  const [conversations, setConversations] = useState<SupportConversationItem[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await supportApi.getConversations();
      if (res.success) {
        setConversations(res.data);
        // If nothing selected and we have conversations, select first
        if (!selectedPhone && res.data.length > 0) {
          setSelectedPhone(res.data[0].phone);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  // 2. Fetch messages for the selected conversation
  const fetchMessages = async (phone: string) => {
    try {
      const res = await supportApi.getMessages(phone);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Poll conversations every 5 seconds
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll selected conversation messages every 4 seconds
  useEffect(() => {
    if (!selectedPhone) return;
    fetchMessages(selectedPhone);
    const interval = setInterval(() => {
      fetchMessages(selectedPhone);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedPhone]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Admin Reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPhone || !replyText.trim() || isSending) return;

    try {
      setIsSending(true);
      const res = await supportApi.sendReply(selectedPhone, replyText.trim());
      if (res.success) {
        setMessages((prev) => [...prev, res.data]);
        setReplyText('');
        fetchConversations();
      }
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الرد');
    } finally {
      setIsSending(false);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!selectedPhone) return;
    if (!window.confirm(`هل أنت متأكد من حذف محادثة الرقم ${selectedPhone}؟`)) return;

    try {
      setIsLoading(true);
      const res = await supportApi.deleteConversation(selectedPhone);
      if (res.success) {
        setSelectedPhone(null);
        setMessages([]);
        fetchConversations();
      }
    } catch (err: any) {
      alert(err.message || 'فشل حذف المحادثة');
    } finally {
      setIsLoading(false);
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
    <div
      dir="rtl"
      style={{
        background: '#0a0814',
        border: '1px solid rgba(236, 72, 153, 0.25)',
        borderRadius: '20px',
        overflow: 'hidden',
        height: '680px',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* ── Left / Main Chat Pane ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(220, 38, 38, 0.2)',
          background: 'linear-gradient(180deg, rgba(16, 18, 26, 0.9) 0%, rgba(8, 9, 13, 0.95) 100%)',
        }}
      >
        {selectedPhone ? (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(220, 38, 38, 0.2)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                  }}
                />
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>
                  المحادثة مع:{' '}
                  <span style={{ color: '#ef4444', direction: 'ltr', display: 'inline-block' }}>
                    {selectedPhone}
                  </span>
                </span>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleDeleteConversation}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <span>🗑️</span>
                <span>حذف</span>
              </button>
            </div>

            {/* Messages Feed */}
            <div
              style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', marginTop: '60px' }}>
                  لا توجد رسائل في هذه المحادثة بعد
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdmin ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          background: isAdmin
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                            : 'rgba(255, 255, 255, 0.07)',
                          color: '#ffffff',
                          padding: '12px 18px',
                          borderRadius: isAdmin ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                          fontSize: '13px',
                          fontWeight: isAdmin ? 700 : 400,
                          lineHeight: '1.6',
                          border: isAdmin ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
                          boxShadow: isAdmin ? '0 4px 16px rgba(220, 38, 38, 0.35)' : 'none',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.message}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          marginTop: '4px',
                          padding: '0 4px',
                        }}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Bar */}
            <form
              onSubmit={handleSendReply}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(220, 38, 38, 0.2)',
                background: 'rgba(10, 11, 16, 0.95)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="اكتب ردك هنا..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                style={{
                  background: (!replyText.trim() || isSending)
                    ? 'rgba(220, 38, 38, 0.25)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: (!replyText.trim() || isSending) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {isSending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '40px' }}>💬</span>
            <span>اختر محادثة من القائمة الجانبية لعرض الرسائل والرد عليها</span>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Conversations List ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 14, 20, 0.98)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(220, 38, 38, 0.2)',
            fontWeight: 800,
            fontSize: '15px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>المحادثات</span>
          <span
            style={{
              background: 'rgba(220, 38, 38, 0.2)',
              color: '#f87171',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 800,
            }}
          >
            {conversations.length}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', fontSize: '13px' }}>
              لا توجد أي محادثات دعم فني حالياً
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedPhone === conv.phone;
              return (
                <div
                  key={conv.phone}
                  onClick={() => setSelectedPhone(conv.phone)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isSelected ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
                    borderRight: isSelected ? '3px solid #ef4444' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? '#ef4444' : '#fff', direction: 'ltr' }}>
                      {conv.phone}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {formatTime(conv.lastTime as any)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: isSelected ? '#cbd5e1' : '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {conv.lastSender === 'admin' ? '↩️ ردك: ' : ''}{conv.lastMessage}
                  </div>

                  {conv.unreadCount > 0 && (
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          borderRadius: '10px',
                          padding: '1px 7px',
                          fontSize: '10px',
                          fontWeight: 900,
                        }}
                      >
                        {conv.unreadCount} جديد
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
