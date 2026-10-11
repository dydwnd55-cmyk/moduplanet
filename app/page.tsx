'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Sparkles, ShoppingBag, Users, Swords, LogIn, Search, Plus, MessageSquare, X,
  Moon, Sun, MapPin, ThumbsUp, Coins, CreditCard, Flame, Settings, MessageCircle, Store, ChevronDown, Send
} from 'lucide-react';

import ProfileModal from '@/components/ProfileModal';
import UserStoreModal from '@/components/UserStoreModal';
import ChatModal from '@/components/ChatModal';
import TradeDetailModal from '@/components/TradeDetailModal';
import WriteModal from '@/components/WriteModal';

const TRADE_CATEGORIES = [
  { id: 'ALL', label: '전체', icon: Sparkles, badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'BUY', label: '삽니다', icon: ShoppingBag, badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'SELL', label: '팝니다', icon: ShoppingBag, badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'PARTY', label: '파티사냥', icon: Users, badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'EXPEDITION', label: '원정대', icon: Swords, badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'SPOT', label: '사냥터자리', icon: MapPin, badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
];

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mainTab, setMainTab] = useState<'TRADE' | 'BOARD'>('TRADE');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [tradePosts, setTradePosts] = useState<any[]>([]);
  const [boardPosts, setBoardPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boardSortBy, setBoardSortBy] = useState<'likes' | 'latest'>('likes');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; avatar: string; user_code?: string } | null>(null);

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [newCommentInput, setNewCommentInput] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentSortType, setCommentSortType] = useState<'latest' | 'likes'>('latest');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<any>(null);

  const [isUserStoreModalOpen, setIsUserStoreModalOpen] = useState(false);
  const [selectedUserStore, setSelectedUserStore] = useState<{ id?: string; name: string; avatar: string; user_code?: string } | null>(null);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('ALL');

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalChatMessages, setGlobalChatMessages] = useState<any[]>([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [anonymousId] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const globalChatScrollRef = useRef<HTMLDivElement>(null);

  const [newTradePost, setNewTradePost] = useState({
    category: 'SELL', title: '', itemName: '', quantity: '1개',
    equipStats: '', location_or_boss: '', currencyType: 'MESO',
    priceMeso: '', priceCash: '', content: '', isSafeTrade: true
  });
  const [newBoardPost, setNewBoardPost] = useState({ title: '', content: '', image_url: '' });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: trades } = await supabase.from('trade_posts').select('*').order('created_at', { ascending: false }).limit(30);
      if (trades) setTradePosts(trades);

      const { data: boards } = await supabase.from('board_posts').select('*').order('created_at', { ascending: false }).limit(30);
      if (boards) setBoardPosts(boards);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchUserLikes = async (userId: string) => {
    const { data: postLikes } = await supabase.from('board_likes').select('post_id').eq('user_id', userId);
    if (postLikes) setLikedPosts(new Set(postLikes.map(l => l.post_id)));
    const { data: commentLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', userId);
    if (commentLikes) setLikedComments(new Set(commentLikes.map(l => l.comment_id)));
  };

  const fetchCommentsForPost = async (postId: string) => {
    const { data: comments } = await supabase.from('board_comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
    if (comments) setCommentsMap(prev => ({ ...prev, [postId]: comments }));
  };

  // 🔥 확실하게 유저 프로필 정보를 가져오고 세션을 확정하는 함수
  const verifyAndSetUser = async (user: any) => {
    setIsLoggedIn(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setUserProfile({ id: data.id, name: data.character_name || '모험가', avatar: data.avatar || '🍁', user_code: data.user_code });
      } else {
        const fallbackCode = `#${Math.floor(1000 + Math.random() * 9000)}`;
        const fallbackName = user.user_metadata?.character_name || user.user_metadata?.full_name || '모험가';
        setUserProfile({ id: user.id, name: fallbackName, avatar: '🍁', user_code: fallbackCode });

        await supabase.from('profiles').upsert([{
          id: user.id, character_name: fallbackName, avatar: '🍁', user_code: fallbackCode
        }]);
      }
    } catch (e) {
      console.error(e);
      setUserProfile({ id: user.id, name: '모험家', avatar: '🍁', user_code: '#9999' });
    }
  };

  useEffect(() => {
    fetchAllData();

    // 초기 접속 시 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        verifyAndSetUser(session.user);
        fetchUserLikes(session.user.id);
      }
    });

    // 실시간 인증 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        await verifyAndSetUser(session.user);
        fetchUserLikes(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
        setLikedPosts(new Set());
        setLikedComments(new Set());
      }
    });

    // 광장 챗 실시간 구독
    const chatSubscription = supabase.channel('public:global_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chats' }, (payload) => {
        setGlobalChatMessages((prev) => [...prev, payload.new]);
        setTimeout(() => {
          if (globalChatScrollRef.current) {
            globalChatScrollRef.current.scrollTop = globalChatScrollRef.current.scrollHeight;
          }
        }, 100);
      }).subscribe();

    supabase.from('global_chats').select('*').order('created_at', { ascending: true }).limit(50).then(({ data }) => {
      if (data) setGlobalChatMessages(data);
    });

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(chatSubscription);
    };
  }, []);

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: `${window.location.origin}` } });
  };

  const openMyStore = () => {
    if (!userProfile) {
      alert("로그인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setSelectedUserStore({
      id: userProfile.id,
      name: userProfile.name,
      avatar: userProfile.avatar,
      user_code: userProfile.user_code
    });
    setStoreCategoryFilter('ALL');
    setIsDropdownOpen(false);
    setIsUserStoreModalOpen(true);
  };

  const handleSendGlobalChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalChatInput.trim()) return;

    // 🔥 로그인 상태면 무조건 정확한 닉네임과 식별번호 사용
    const senderName = (isLoggedIn && userProfile) ? `${userProfile.name} ${userProfile.user_code || ''}` : `익명_${anonymousId}`;
    const msg = globalChatInput;
    setGlobalChatInput('');

    await supabase.from('global_chats').insert([{
      sender_name: senderName,
      message: msg,
      user_id: userProfile?.id || null
    }]);
  };

  const handleBoardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('용량은 2MB 이하로 업로드해주세요.');
    setIsUploadingImage(true);
    try {
      const filePath = `board/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('profiles').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      setNewBoardPost(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (err: any) { alert('사진 업로드 실패: ' + err.message); } finally { setIsUploadingImage(false); }
  };

  const handleCreateBoardPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !userProfile) { alert('로그인 후 이용 가능합니다.'); setIsLoginModalOpen(true); return; }

    const fullAuthorName = `${userProfile.name} ${userProfile.user_code || ''}`;
    const { error } = await supabase.from('board_posts').insert([{ title: newBoardPost.title, content: newBoardPost.content, image_url: newBoardPost.image_url, author_name: fullAuthorName, likes: 0, user_id: userProfile.id }]);
    if (!error) { alert('게시글이 작성되었습니다!'); setIsWriteModalOpen(false); setNewBoardPost({ title: '', content: '', image_url: '' }); fetchAllData(); } else { alert('❌ 실패: ' + error.message); }
  };

  const handleLikeBoardPost = async (postId: string, currentLikes: number) => {
    if (!isLoggedIn || !userProfile) { alert('로그인 후 이용 가능합니다.'); setIsLoginModalOpen(true); return; }
    if (likedPosts.has(postId)) {
      await supabase.from('board_likes').delete().match({ post_id: postId, user_id: userProfile.id });
      await supabase.from('board_posts').update({ likes: currentLikes - 1 }).eq('id', postId);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setBoardPosts(boardPosts.map(p => p.id === postId ? { ...p, likes: currentLikes - 1 } : p));
    } else {
      const { error } = await supabase.from('board_likes').insert([{ post_id: postId, user_id: userProfile.id }]);
      if (!error) {
        await supabase.from('board_posts').update({ likes: currentLikes + 1 }).eq('id', postId);
        setLikedPosts(prev => new Set(prev).add(postId));
        setBoardPosts(boardPosts.map(p => p.id === postId ? { ...p, likes: currentLikes + 1 } : p));
      }
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number, postId: string) => {
    if (!isLoggedIn || !userProfile) { alert('로그인 후 이용 가능합니다.'); setIsLoginModalOpen(true); return; }
    if (likedComments.has(commentId)) {
      await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: userProfile.id });
      await supabase.from('board_comments').update({ likes: currentLikes - 1 }).eq('id', commentId);
      setLikedComments(prev => { const next = new Set(prev); next.delete(commentId); return next; });
      setCommentsMap(prev => ({ ...prev, [postId]: prev[postId].map(c => c.id === commentId ? { ...c, likes: currentLikes - 1 } : c) }));
    } else {
      const { error } = await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: userProfile.id }]);
      if (!error) {
        await supabase.from('board_comments').update({ likes: currentLikes + 1 }).eq('id', commentId);
        setLikedComments(prev => new Set(prev).add(commentId));
        setCommentsMap(prev => ({ ...prev, [postId]: prev[postId].map(c => c.id === commentId ? { ...c, likes: currentLikes + 1 } : c) }));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!isLoggedIn || !userProfile) { alert('로그인 후 이용해주세요.'); setIsLoginModalOpen(true); return; }
    if (!newCommentInput.trim()) return;

    const fullAuthorName = `${userProfile.name} ${userProfile.user_code || ''}`;
    const { error } = await supabase.from('board_comments').insert([{ post_id: postId, user_id: userProfile.id, author_name: fullAuthorName, content: newCommentInput }]);
    if (!error) { setNewCommentInput(''); fetchCommentsForPost(postId); } else { alert('댓글 실패: ' + error.message); }
  };

  const toggleCommentSection = (postId: string) => {
    if (activeCommentPostId === postId) { setActiveCommentPostId(null); } else { setActiveCommentPostId(postId); fetchCommentsForPost(postId); }
  };

  const openUserStore = (post: any) => { setSelectedUserStore({ id: post.user_id, name: post.character_name || '모험가', avatar: post.user_avatar || '🍁', user_code: post.user_code }); setStoreCategoryFilter('ALL'); setIsUserStoreModalOpen(true); };

  const handleCreateTradePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !userProfile) { alert('로그인 후 이용 가능합니다.'); setIsLoginModalOpen(true); return; }

    const fullAuthorName = `${userProfile.name} ${userProfile.user_code || ''}`;
    const postPayload = { category: newTradePost.category, title: newTradePost.title, item_name: newTradePost.itemName, item_icon: '📦', quantity: newTradePost.quantity, equip_stats: newTradePost.equipStats, character_name: fullAuthorName, location_or_boss: newTradePost.location_or_boss, currency_type: newTradePost.currencyType, price_meso: newTradePost.priceMeso, price_cash: newTradePost.priceCash, content: newTradePost.content, is_safe_trade: true, status: 'RECRUITING', user_id: userProfile.id, user_avatar: userProfile.avatar, user_code: userProfile.user_code };
    const { error } = await supabase.from('trade_posts').insert([postPayload]);
    if (!error) { alert('등록되었습니다!'); setIsWriteModalOpen(false); fetchAllData(); } else { alert('❌ 실패: ' + error.message); }
  };

  const handleTogglePostStatus = async (post: any) => {
    const nextStatus = post.status === 'RECRUITING' ? 'COMPLETED' : 'RECRUITING';
    const { error } = await supabase.from('trade_posts').update({ status: nextStatus }).eq('id', post.id);
    if (!error) { setSelectedPostDetail((prev: any) => (prev ? { ...prev, status: nextStatus } : null)); fetchAllData(); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('trade_posts').delete().eq('id', postId);
    if (!error) { setIsDetailModalOpen(false); fetchAllData(); }
  };

  const openKakaoChat = async (post: any) => {
    if (!isLoggedIn) { alert('로그인 후 이용해주세요!'); setIsLoginModalOpen(true); return; }
    setActiveChatTarget(post); setIsChatModalOpen(true);
    const { data: msgs } = await supabase.from('chat_messages').select('*').eq('trade_post_id', post.id).order('created_at', { ascending: true });
    if (msgs && msgs.length > 0) { setChatMessages(msgs.map((m: any) => ({ id: m.id, sender: m.user_id === userProfile?.id ? 'me' : 'other', text: m.message, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))); }
    else { setChatMessages([{ sender: 'system', text: `[${post.title}] 1:1 라이브 대화방`, time: '방금 전' }, { sender: 'other', text: '안녕하세요! 문의드립니다.', time: '방금 전' }]); }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatTarget || !userProfile) return;
    const now = new Date();
    const timeStr = `${now.getHours() > 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const msgText = inputMessage; setInputMessage('');
    setChatMessages(prev => [...prev, { sender: 'me', text: msgText, time: timeStr }]);
    const fullAuthorName = `${userProfile.name} ${userProfile.user_code || ''}`;
    await supabase.from('chat_messages').insert([{ trade_post_id: activeChatTarget.id, sender_name: fullAuthorName, message: msgText, user_id: userProfile.id }]);
  };

  const filteredTradePosts = tradePosts.filter(post => {
    const matchesCategory = activeCategory === 'ALL' || post.category === activeCategory;
    const matchesSearch = (post.title || '').includes(searchTerm) || (post.item_name || '').includes(searchTerm) || (post.character_name || '').includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const selectedUserTradePosts = tradePosts.filter(post => {
    const isOwner = selectedUserStore?.id ? post.user_id === selectedUserStore.id : post.character_name === selectedUserStore?.name;
    const matchesCategory = storeCategoryFilter === 'ALL' || post.category === storeCategoryFilter;
    return isOwner && matchesCategory;
  });

  const sortedBoardPosts = [...boardPosts].sort((a, b) => {
    if (boardSortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    return 0;
  });

  const renderPriceTag = (post: any) => {
    if (post.currency_type === 'BOTH') return (<span className="flex items-center gap-1 font-extrabold text-amber-400 text-sm"><Coins className="w-4 h-4" /> {post.price_meso} | <CreditCard className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">{post.price_cash}</span></span>);
    if (post.currency_type === 'CASH') return (<span className="flex items-center gap-1 font-extrabold text-emerald-400 text-sm"><CreditCard className="w-4 h-4" /> {post.price_cash} (현금)</span>);
    return (<span className="flex items-center gap-1 font-extrabold text-amber-400 text-sm"><Coins className="w-4 h-4" /> {post.price_meso || '가격 협의'}</span>);
  };

  const renderAvatar = (avatarSrc: string) => {
    if (avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image'))) return <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-xl" />;
    return <span>{avatarSrc || '🍁'}</span>;
  };

  return (
    <div className={`min-h-screen font-sans relative ${isDarkMode ? 'bg-[#1a1d24] text-slate-100' : 'bg-[#f1f3f7] text-slate-900'}`}>
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#222631]/90 border-slate-700/60' : 'bg-white/95 border-slate-300'}`}>
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMainTab('TRADE')}>
              <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-950">🍁</div>
              <span className="text-2xl font-black">모두<span className="text-amber-500">플래닛</span></span>
            </div>

            <nav className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-[#14171f]/80 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
              <button onClick={() => setMainTab('TRADE')} className={`px-4 py-2 rounded-xl text-sm font-bold ${mainTab === 'TRADE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>거래 센터</button>
              <button onClick={() => setMainTab('BOARD')} className={`px-4 py-2 rounded-xl text-sm font-bold ${mainTab === 'BOARD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>자유게시판</button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-2xl border ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600 text-amber-400' : 'bg-slate-200 border-slate-300'}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => { if (!isLoggedIn) { alert('로그인 후 이용하세요'); setIsLoginModalOpen(true); return; } setIsWriteModalOpen(true); }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-2xl text-sm">
              <Plus className="w-5 h-5" /> 글쓰기
            </button>

            {isLoggedIn ? (
              <div className="relative">
                {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}

                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`relative z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border cursor-pointer hover:border-amber-500/50 transition-colors ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600' : 'bg-slate-200 border-slate-300'}`}>
                  <div className="w-7 h-7 overflow-hidden rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-sm">{renderAvatar(userProfile?.avatar || '🍁')}</div>
                  <span className="font-bold text-sm hidden md:block">
                    {userProfile?.name || '모험가'} <span className="text-[10px] text-amber-400/80">{userProfile?.user_code}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-50 overflow-hidden border animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="p-2 space-y-1">
                      <button onClick={openMyStore} className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'hover:bg-amber-500 hover:text-slate-950 text-slate-200' : 'hover:bg-amber-500 hover:text-white text-slate-700'}`}>
                        🏪 마이페이지
                      </button>
                      <button onClick={() => { setIsProfileModalOpen(true); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'hover:bg-amber-500 hover:text-slate-950 text-slate-200' : 'hover:bg-amber-500 hover:text-white text-slate-700'}`}>
                        ⚙️ 회원정보 변경
                      </button>
                      <div className="h-px bg-slate-700/50 my-1"></div>
                      <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-colors text-rose-400 hover:bg-rose-500/10`}>
                        🚪 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 border font-bold text-sm px-4 py-2.5 rounded-2xl bg-white text-slate-800"><LogIn className="w-5 h-5 text-amber-500" /> 로그인</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {mainTab === 'TRADE' && (
          <>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TRADE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border transition-all ${isActive ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105' : isDarkMode ? 'bg-[#222631] text-slate-300 border-slate-700/80' : 'bg-white text-slate-700 border-slate-300'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} /> {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="아이템명, 사냥터, 캐릭터명 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm md:text-base focus:outline-none focus:border-amber-500 font-medium ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} />
            </div>

            <div className="space-y-3">
              {filteredTradePosts.map((post) => (
                <div key={post.id} onClick={() => { setSelectedPostDetail(post); setIsDetailModalOpen(true); }} className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all cursor-pointer ${isDarkMode ? 'bg-[#222631] border-slate-700/70 hover:border-amber-500/60' : 'bg-white border-slate-200 hover:border-amber-500/60 shadow-sm'}`}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${post.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400'}`}>{post.status === 'RECRUITING' ? '거래가능' : '완료됨'}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-700">{TRADE_CATEGORIES.find((c) => c.id === post.category)?.label}</span>
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-slate-100">{post.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <button onClick={(e) => { e.stopPropagation(); openUserStore(post); }} className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl hover:bg-amber-500/20 transition">
                        <div className="w-5 h-5 overflow-hidden rounded-lg">{renderAvatar(post.user_avatar || '🍁')}</div>
                        <strong className="text-slate-200">{post.character_name}</strong>
                        <Store className="w-3.5 h-3.5" />
                      </button>
                      <span>📍 {post.location_or_boss}</span>
                      <span>{renderPriceTag(post)}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openKakaoChat(post); }} className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0"><MessageSquare className="w-4 h-4 fill-current" /> 1:1 라이브 챗</button>
                </div>
              ))}
            </div>
          </>
        )}

        {mainTab === 'BOARD' && (
          <div className="space-y-5">
            <div className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="text-sm md:text-base font-extrabold text-amber-400 flex items-center gap-2"><Flame className="w-5 h-5 fill-amber-400" /> 자유게시판</span>
              <div className="flex gap-2 text-xs md:text-sm">
                <button onClick={() => setBoardSortBy('likes')} className={`px-3.5 py-2 rounded-xl font-bold ${boardSortBy === 'likes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>🔥 추천순</button>
                <button onClick={() => setBoardSortBy('latest')} className={`px-3.5 py-2 rounded-xl font-bold ${boardSortBy === 'latest' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>최신순</button>
              </div>
            </div>

            <div className="space-y-4">
              {sortedBoardPosts.map((post) => {
                const isLiked = likedPosts.has(post.id);
                const postComments = commentsMap[post.id] || [];
                const isCommentOpen = activeCommentPostId === post.id;

                const sortedComments = [...postComments].sort((a, b) => {
                  if (commentSortType === 'likes') return (b.likes || 0) - (a.likes || 0);
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                return (
                  <div key={post.id} className={`p-5 border rounded-2xl space-y-4 ${isDarkMode ? 'bg-[#222631] border-slate-700/70' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 w-full pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(post.likes || 0) >= 5 && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1"><Flame className="w-3.5 h-3.5 fill-rose-400" /> 인기글</span>}
                          <h3 className="font-bold text-base md:text-lg text-slate-100">{post.title}</h3>
                        </div>

                        {post.image_url && (
                          <div className="py-2">
                            <img src={post.image_url} alt="첨부됨" className="max-h-96 w-auto rounded-xl object-contain border border-slate-700/50" />
                          </div>
                        )}
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      <button onClick={() => handleLikeBoardPost(post.id, post.likes || 0)} className={`flex flex-col items-center justify-center border px-3.5 py-2.5 rounded-2xl shrink-0 transition-all ${isLiked ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'}`}>
                        <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-slate-950' : 'fill-amber-400/20'}`} />
                        <span className="text-xs md:text-sm font-extrabold mt-1">{post.likes || 0}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700/60 text-xs md:text-sm text-slate-400">
                      <span>작성자: <strong className="text-slate-200">{post.author_name || '익명'}</strong></span>
                      <button onClick={() => toggleCommentSection(post.id)} className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors">
                        <MessageCircle className="w-4 h-4" /> {isCommentOpen ? '댓글 닫기' : `댓글 ${postComments.length}개 보기`}
                      </button>
                    </div>

                    {isCommentOpen && (
                      <div className="bg-slate-900/60 rounded-xl p-4 space-y-3 border border-slate-800/80 mt-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-800/50 pb-2">
                          <span className="text-xs font-bold text-slate-400">전체 댓글 {postComments.length}개</span>
                          <div className="flex gap-2 text-xs">
                            <button onClick={() => setCommentSortType('latest')} className={`${commentSortType === 'latest' ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>최신순</button>
                            <span className="text-slate-700">|</span>
                            <button onClick={() => setCommentSortType('likes')} className={`${commentSortType === 'likes' ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>추천순</button>
                          </div>
                        </div>

                        {sortedComments.length > 0 ? (
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {sortedComments.map(c => {
                              const isCommentLiked = likedComments.has(c.id);
                              return (
                                <div key={c.id} className="flex flex-col text-xs md:text-sm border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <strong className="text-amber-400">{c.author_name}</strong>
                                      <span className="text-[10px] text-slate-500">
                                        {new Date(c.created_at).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <button onClick={() => handleLikeComment(c.id, c.likes || 0, post.id)} className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold px-2 py-1 rounded-lg border transition-all ${isCommentLiked ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/40'}`}>
                                      <ThumbsUp className={`w-3 h-3 ${isCommentLiked ? 'fill-amber-400' : ''}`} /> {c.likes || 0}
                                    </button>
                                  </div>
                                  <span className="text-slate-300 break-all">{c.content}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-500 py-4">첫 번째 댓글을 남겨보세요!</div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-slate-800/50 mt-3">
                          <input type="text" placeholder={isLoggedIn ? "댓글을 작성하세요..." : "로그인 후 작성 가능합니다"} value={newCommentInput} onChange={(e) => setNewCommentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)} disabled={!isLoggedIn} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-50" />
                          <button onClick={() => handleAddComment(post.id)} disabled={!isLoggedIn || !newCommentInput.trim()} className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm transition-colors">등록</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        {!isGlobalChatOpen ? (
          <button
            onClick={() => setIsGlobalChatOpen(true)}
            className="w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
          >
            <MessageSquare className="w-6 h-6 text-slate-950 fill-current" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-[#1a1d24]"></span>
            </span>
          </button>
        ) : (
          <div className={`w-80 md:w-96 h-[32rem] flex flex-col rounded-3xl shadow-2xl border animate-in slide-in-from-bottom-5 ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-3xl ${isDarkMode ? 'border-slate-700/80 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-xl shadow-inner">🏕️</div>
                <div>
                  <h3 className="font-black text-sm md:text-base">플래닛 광장 챗</h3>
                  <p className="text-[10px] text-slate-400">{isLoggedIn ? '로그인 됨' : `익명 접속 중`}</p>
                </div>
              </div>
              <button onClick={() => setIsGlobalChatOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors p-1"><X className="w-5 h-5" /></button>
            </div>

            <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs md:text-sm">
              <div className="text-center my-2">
                <span className="bg-slate-800/60 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold">광장 채팅방에 오신 것을 환영합니다!</span>
              </div>
              {globalChatMessages.map((msg, idx) => {
                const isMe = msg.user_id === userProfile?.id || msg.sender_name === `익명_${anonymousId}`;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 mb-0.5 ml-1">{msg.sender_name}</span>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 break-words ${isMe ? 'bg-amber-500 text-slate-950 rounded-br-sm' : isDarkMode ? 'bg-slate-800 text-slate-100 rounded-bl-sm' : 'bg-slate-200 text-slate-900 rounded-bl-sm'}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700/80 bg-slate-900/50 rounded-b-3xl' : 'border-slate-200 bg-slate-50 rounded-b-3xl'}`}>
              <form onSubmit={handleSendGlobalChat} className="flex gap-2">
                <input
                  type="text"
                  value={globalChatInput}
                  onChange={(e) => setGlobalChatInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className={`flex-1 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-amber-500 border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`}
                />
                <button type="submit" disabled={!globalChatInput.trim()} className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 p-2.5 rounded-xl transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {isProfileModalOpen && userProfile && <ProfileModal userProfile={userProfile} isDarkMode={isDarkMode} onClose={() => setIsProfileModalOpen(false)} onSuccess={(updated) => setUserProfile((prev: any) => ({ ...prev, ...updated }))} />}
      {isUserStoreModalOpen && selectedUserStore && <UserStoreModal selectedUserStore={selectedUserStore} userTradePosts={selectedUserTradePosts} categories={TRADE_CATEGORIES} storeCategoryFilter={storeCategoryFilter} setStoreCategoryFilter={setStoreCategoryFilter} isDarkMode={isDarkMode} onClose={() => setIsUserStoreModalOpen(false)} onSelectPost={(p) => { setSelectedPostDetail(p); setIsDetailModalOpen(true); }} onOpenChat={openKakaoChat} renderPriceTag={renderPriceTag} renderAvatar={renderAvatar} />}
      {isChatModalOpen && activeChatTarget && <ChatModal activeChatTarget={activeChatTarget} chatMessages={chatMessages} inputMessage={inputMessage} setInputMessage={setInputMessage} chatScrollRef={chatScrollRef} onClose={() => setIsChatModalOpen(false)} onSendMessage={handleSendChatMessage} />}
      {isDetailModalOpen && selectedPostDetail && <TradeDetailModal selectedPostDetail={selectedPostDetail} userProfile={userProfile} categories={TRADE_CATEGORIES} isDarkMode={isDarkMode} onClose={() => setIsDetailModalOpen(false)} onOpenStore={openUserStore} onOpenChat={openKakaoChat} onToggleStatus={handleTogglePostStatus} onDeletePost={handleDeletePost} renderPriceTag={renderPriceTag} />}

      {isWriteModalOpen && (
        <WriteModal mainTab={mainTab} setMainTab={setMainTab} newTradePost={newTradePost} setNewTradePost={setNewTradePost} newBoardPost={newBoardPost} setNewBoardPost={setNewBoardPost} isDarkMode={isDarkMode} isUploadingImage={isUploadingImage} onClose={() => setIsWriteModalOpen(false)} onCreateTradePost={handleCreateTradePost} onCreateBoardPost={handleCreateBoardPost} onBoardImageUpload={handleBoardImageUpload} />
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-7 max-w-sm w-full space-y-6 text-center relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>
            <div className="w-14 h-14 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">🍁</div>
            <div>
              <h3 className="text-xl font-black">모두플래닛 시작하기</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">로그인 후 글 작성 및 1:1 라이브 챗 기능을 이용해 보세요.</p>
            </div>
            <button onClick={handleDiscordLogin} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm shadow-md">
              디스코드 계정으로 계속하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}