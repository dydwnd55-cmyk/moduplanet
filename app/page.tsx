'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Sparkles, ShoppingBag, Users, Swords, LogIn, Search, Plus, MessageSquare, X,
  Moon, Sun, MapPin, ThumbsUp, Coins, CreditCard, Flame, Settings, MessageCircle, Store
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

const MOCK_ITEM_DB = [
  { id: 'i1', name: '노가다 목장갑 (공8 노목)', category: '장비', icon: '🥊', defaultStats: '공격력 +8 / 업횟 0회' },
  { id: 'i2', name: '자쿰의 투구', category: '장비', icon: '👑', defaultStats: 'STR +15, DEX +15, INT +15, LUK +15' },
  { id: 'i3', name: '혼돈의 주문서 60%', category: '주문서', icon: '📜', defaultStats: '장비 옵션 무작위 재설정' },
  { id: 'i4', name: '장갑 공격력 주문서 60%', category: '주문서', icon: '📜', defaultStats: '공격력 +1, 성공률 60%' },
  { id: 'i5', name: '뇌전 수리검', category: '소비', icon: '⚡', defaultStats: '공격력 +21' },
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

  // 유저 정보
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; avatar: string } | null>(null);

  // 모달 제어
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<any>(null);

  // 개인상점 모달
  const [isUserStoreModalOpen, setIsUserStoreModalOpen] = useState(false);
  const [selectedUserStore, setSelectedUserStore] = useState<{ id?: string; name: string; avatar: string } | null>(null);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('ALL');

  // 댓글
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; text: string; time: string }>>>({
    'b1': [{ id: 'c1', author: '클래식고수', text: '좋은 정보 감사합니다!', time: '10분 전' }]
  });
  const [newCommentInput, setNewCommentInput] = useState('');

  // 1:1 라이브 챗
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 아이템 DB 검색
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [filteredItemDB, setFilteredItemDB] = useState<typeof MOCK_ITEM_DB>([]);

  // 폼 입력 상태
  const [newTradePost, setNewTradePost] = useState({
    category: 'SELL',
    title: '',
    itemName: '',
    itemIcon: '📦',
    quantity: '1개',
    equipStats: '',
    character_name: '',
    location_or_boss: '',
    currencyType: 'MESO',
    priceMeso: '',
    priceCash: '',
    content: '',
    isSafeTrade: true
  });
  const [newBoardPost, setNewBoardPost] = useState({ title: '', content: '' });

  // 데이터 로딩
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: trades } = await supabase.from('trade_posts').select('*').order('created_at', { ascending: false });
      if (trades) setTradePosts(trades);

      const { data: boards } = await supabase.from('board_posts').select('*').order('created_at', { ascending: false });
      if (boards) setBoardPosts(boards);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}` },
    });
  };

  useEffect(() => {
    fetchAllData();

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const meta = user.user_metadata || {};
        const profile = {
          id: user.id,
          name: meta.character_name || meta.full_name || meta.name || '플래닛모험가',
          avatar: meta.avatar || meta.avatar_url || '🍁',
        };
        setUserProfile(profile);
        setNewTradePost((prev: any) => ({ ...prev, character_name: profile.name }));
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        const profile = {
          id: session.user.id,
          name: meta.character_name || meta.full_name || meta.name || '플래닛모험가',
          avatar: meta.avatar || meta.avatar_url || '🍁',
        };
        setUserProfile(profile);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const openUserStore = (post: any) => {
    setSelectedUserStore({
      id: post.user_id,
      name: post.character_name || '모험가',
      avatar: post.user_avatar || '🍁'
    });
    setStoreCategoryFilter('ALL');
    setIsUserStoreModalOpen(true);
  };

  const handleCreateTradePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const postPayload = {
      category: newTradePost.category,
      title: newTradePost.title,
      item_name: newTradePost.itemName,
      item_icon: newTradePost.itemIcon || '📦',
      quantity: newTradePost.quantity,
      equip_stats: newTradePost.equipStats,
      character_name: userProfile?.name || newTradePost.character_name,
      location_or_boss: newTradePost.location_or_boss,
      currency_type: newTradePost.currencyType,
      price_meso: newTradePost.priceMeso,
      price_cash: newTradePost.priceCash,
      content: newTradePost.content,
      is_safe_trade: true,
      status: 'RECRUITING',
      user_id: userProfile?.id,
      user_avatar: userProfile?.avatar
    };

    const { error } = await supabase.from('trade_posts').insert([postPayload]);
    if (!error) {
      alert('거래 글이 등록되었습니다!');
      setIsWriteModalOpen(false);
      fetchAllData();
    }
  };

  const handleTogglePostStatus = async (post: any) => {
    const nextStatus = post.status === 'RECRUITING' ? 'COMPLETED' : 'RECRUITING';
    const { error } = await supabase.from('trade_posts').update({ status: nextStatus }).eq('id', post.id);
    if (!error) {
      setSelectedPostDetail((prev: any) => (prev ? { ...prev, status: nextStatus } : null));
      fetchAllData();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('trade_posts').delete().eq('id', postId);
    if (!error) {
      setIsDetailModalOpen(false);
      fetchAllData();
    }
  };

  const handleCreateBoardPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const boardPayload = {
      title: newBoardPost.title,
      content: newBoardPost.content,
      author_name: userProfile?.name || '익명유저',
      likes: 0,
      user_id: userProfile?.id
    };

    const { error } = await supabase.from('board_posts').insert([boardPayload]);
    if (!error) {
      alert('게시글이 작성되었습니다!');
      setIsWriteModalOpen(false);
      fetchAllData();
    }
  };

  const handleLikeBoardPost = async (id: string, currentLikes: number) => {
    const { error } = await supabase.from('board_posts').update({ likes: currentLikes + 1 }).eq('id', id);
    if (!error) {
      setBoardPosts(boardPosts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  const handleAddComment = (postId: string) => {
    if (!newCommentInput.trim()) return;
    const commentObj = {
      id: 'c_' + Date.now(),
      author: userProfile?.name || '방문자',
      text: newCommentInput,
      time: '방금 전'
    };
    setCommentsMap((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), commentObj] }));
    setNewCommentInput('');
  };

  const openKakaoChat = async (post: any) => {
    if (!isLoggedIn) {
      alert('1:1 채팅 문의를 위해 로그인해주세요!');
      setIsLoginModalOpen(true);
      return;
    }
    setActiveChatTarget(post);
    setIsChatModalOpen(true);

    const { data: msgs } = await supabase.from('chat_messages').select('*').eq('trade_post_id', post.id).order('created_at', { ascending: true });
    if (msgs && msgs.length > 0) {
      setChatMessages(msgs.map((m: any) => ({
        id: m.id,
        sender: m.user_id === userProfile?.id ? 'me' : 'other',
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    } else {
      setChatMessages([
        { sender: 'system', text: `[${post.title}] 1:1 라이브 대화방`, time: '방금 전' },
        { sender: 'other', text: '안녕하세요! 문의드립니다.', time: '방금 전' }
      ]);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatTarget) return;

    const now = new Date();
    const timeStr = `${now.getHours() > 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const msgText = inputMessage;
    setInputMessage('');

    setChatMessages((prev) => [...prev, { sender: 'me', text: msgText, time: timeStr }]);
    await supabase.from('chat_messages').insert([{
      trade_post_id: activeChatTarget.id,
      sender_name: userProfile?.name || '익명',
      message: msgText,
      user_id: userProfile?.id
    }]);
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

  const renderPriceTag = (post: any) => {
    if (post.currency_type === 'BOTH') {
      return (
        <span className="flex items-center gap-1 font-extrabold text-amber-400 text-sm">
          <Coins className="w-4 h-4" /> {post.price_meso} | <CreditCard className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">{post.price_cash}</span>
        </span>
      );
    }
    if (post.currency_type === 'CASH') {
      return (
        <span className="flex items-center gap-1 font-extrabold text-emerald-400 text-sm">
          <CreditCard className="w-4 h-4" /> {post.price_cash} (현금)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 font-extrabold text-amber-400 text-sm">
        <Coins className="w-4 h-4" /> {post.price_meso || '가격 협의'}
      </span>
    );
  };

  const renderAvatar = (avatarSrc: string) => {
    if (avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image'))) {
      return <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-xl" />;
    }
    return <span>{avatarSrc || '🍁'}</span>;
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#1a1d24] text-slate-100' : 'bg-[#f1f3f7] text-slate-900'}`}>
      {/* 헤더 */}
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
              <div onClick={() => setIsProfileModalOpen(true)} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border cursor-pointer ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600' : 'bg-slate-200 border-slate-300'}`}>
                <div className="w-7 h-7 overflow-hidden rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-sm">
                  {renderAvatar(userProfile?.avatar || '🍁')}
                </div>
                <span className="font-bold text-sm">{userProfile?.name}</span>
                <Settings className="w-4 h-4 text-slate-400 hover:text-amber-400" />
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 border font-bold text-sm px-4 py-2.5 rounded-2xl bg-white text-slate-800">
                <LogIn className="w-5 h-5 text-amber-500" /> 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* 안심 배너 */}
        <div className={`rounded-3xl p-5 border flex justify-between items-center ${isDarkMode ? 'bg-[#222631] border-amber-500/40' : 'bg-white border-amber-300'}`}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold">🛡️</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg">중개 수수료 5%</span>
                <h2 className="text-base font-extrabold text-amber-400">모두플래닛 안전거래 보증 시스템</h2>
              </div>
              <p className="text-xs text-slate-300">프로필을 클릭하면 작성자의 **개인 상점**을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* TAB 1: 거래 센터 */}
        {mainTab === 'TRADE' && (
          <>
            {/* 카테고리 & 검색 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TRADE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border ${isActive ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-[#222631] text-slate-300 border-slate-700'}`}>
                    <Icon className="w-5 h-5" /> {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="아이템명, 캐릭터명 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm bg-[#222631] border-slate-700 text-slate-100 focus:outline-none" />
            </div>

            {/* 거래글목록 */}
            <div className="space-y-3">
              {filteredTradePosts.map((post) => (
                <div key={post.id} onClick={() => { setSelectedPostDetail(post); setIsDetailModalOpen(true); }} className="border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer bg-[#222631] border-slate-700 hover:border-amber-500/60">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${post.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400'}`}>{post.status === 'RECRUITING' ? '거래가능' : '완료됨'}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-700">{TRADE_CATEGORIES.find((c) => c.id === post.category)?.label}</span>
                    </div>

                    <h3 className="font-bold text-base md:text-lg text-slate-100">{post.title}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <button onClick={(e) => { e.stopPropagation(); openUserStore(post); }} className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                        <div className="w-5 h-5 overflow-hidden rounded-lg">{renderAvatar(post.user_avatar || '🍁')}</div>
                        <strong className="text-slate-200">{post.character_name}</strong>
                        <Store className="w-3.5 h-3.5" />
                      </button>
                      <span>📍 {post.location_or_boss}</span>
                      <span>{renderPriceTag(post)}</span>
                    </div>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); openKakaoChat(post); }} className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 fill-current" /> 1:1 라이브 챗
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: 자유게시판 */}
        {mainTab === 'BOARD' && (
          <div className="space-y-4">
            {boardPosts.map((post) => (
              <div key={post.id} className="p-5 border rounded-2xl space-y-3 bg-[#222631] border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{post.title}</h3>
                    <p className="text-xs text-slate-300 mt-1">{post.content}</p>
                  </div>
                  <button onClick={() => handleLikeBoardPost(post.id, post.likes || 0)} className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <ThumbsUp className="w-4 h-4" /> {post.likes || 0}
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                  <span>작성자: <strong className="text-slate-200">{post.author_name}</strong></span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 text-amber-400" /> 댓글 {(commentsMap[post.id] || []).length}개</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 모달 모음 */}
      {isProfileModalOpen && userProfile && (
        <ProfileModal
          userProfile={userProfile}
          isDarkMode={isDarkMode}
          onClose={() => setIsProfileModalOpen(false)}
          onSuccess={(updated) => setUserProfile((prev: any) => ({ ...prev, ...updated }))}
        />
      )}

      {isUserStoreModalOpen && selectedUserStore && (
        <UserStoreModal
          selectedUserStore={selectedUserStore}
          userTradePosts={selectedUserTradePosts}
          categories={TRADE_CATEGORIES}
          storeCategoryFilter={storeCategoryFilter}
          setStoreCategoryFilter={setStoreCategoryFilter}
          isDarkMode={isDarkMode}
          onClose={() => setIsUserStoreModalOpen(false)}
          onSelectPost={(p) => { setSelectedPostDetail(p); setIsDetailModalOpen(true); }}
          onOpenChat={openKakaoChat}
          renderPriceTag={renderPriceTag}
          renderAvatar={renderAvatar}
        />
      )}

      {isChatModalOpen && activeChatTarget && (
        <ChatModal
          activeChatTarget={activeChatTarget}
          chatMessages={chatMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          chatScrollRef={chatScrollRef}
          onClose={() => setIsChatModalOpen(false)}
          onSendMessage={handleSendChatMessage}
        />
      )}

      {isDetailModalOpen && selectedPostDetail && (
        <TradeDetailModal
          selectedPostDetail={selectedPostDetail}
          userProfile={userProfile}
          categories={TRADE_CATEGORIES}
          isDarkMode={isDarkMode}
          onClose={() => setIsDetailModalOpen(false)}
          onOpenStore={openUserStore}
          onOpenChat={openKakaoChat}
          onToggleStatus={handleTogglePostStatus}
          onDeletePost={handleDeletePost}
          renderPriceTag={renderPriceTag}
        />
      )}

      {isWriteModalOpen && (
        <WriteModal
          mainTab={mainTab}
          setMainTab={setMainTab}
          newTradePost={newTradePost}
          setNewTradePost={setNewTradePost}
          newBoardPost={newBoardPost}
          setNewBoardPost={setNewBoardPost}
          itemSearchQuery={itemSearchQuery}
          filteredItemDB={filteredItemDB}
          isDarkMode={isDarkMode}
          onClose={() => setIsWriteModalOpen(false)}
          onItemSearchChange={(q) => {
            setItemSearchQuery(q);
            setFilteredItemDB(q.trim() === '' ? [] : MOCK_ITEM_DB.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())));
          }}
          onSelectItemFromDB={(item) => {
            setNewTradePost((prev: any) => ({ ...prev, itemName: item.name, itemIcon: item.icon, equipStats: item.defaultStats, title: prev.title || `[${item.name}] 거래합니다.` }));
            setItemSearchQuery(item.name);
            setFilteredItemDB([]);
          }}
          onCreateTradePost={handleCreateTradePost}
          onCreateBoardPost={handleCreateBoardPost}
        />
      )}
    </div>
  );
}