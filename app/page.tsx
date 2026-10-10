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

  // 데이터 리스트
  const [tradePosts, setTradePosts] = useState<any[]>([]);
  const [boardPosts, setBoardPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boardSortBy, setBoardSortBy] = useState<'likes' | 'latest'>('likes');

  // 유저 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; avatar: string } | null>(null);

  // 좋아요(추천) 여부 로컬 추적용 Set
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // 댓글 데이터 (DB 연동)
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [newCommentInput, setNewCommentInput] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null); // 현재 댓글창이 열린 게시물

  // 모달 제어
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<any>(null);

  const [isUserStoreModalOpen, setIsUserStoreModalOpen] = useState(false);
  const [selectedUserStore, setSelectedUserStore] = useState<{ id?: string; name: string; avatar: string } | null>(null);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('ALL');

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [filteredItemDB, setFilteredItemDB] = useState<typeof MOCK_ITEM_DB>([]);

  const [newTradePost, setNewTradePost] = useState({
    category: 'SELL', title: '', itemName: '', itemIcon: '📦', quantity: '1개',
    equipStats: '', character_name: '', location_or_boss: '', currencyType: 'MESO',
    priceMeso: '', priceCash: '', content: '', isSafeTrade: true
  });
  const [newBoardPost, setNewBoardPost] = useState({ title: '', content: '' });

  // -------------------------------------------------------------
  // 🔄 데이터 가져오기 (페이지네이션 적용)
  // -------------------------------------------------------------
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 거래글 최신 30개만 가져오기 (요금 최적화)
      const { data: trades } = await supabase
        .from('trade_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (trades) setTradePosts(trades);

      // 자유게시판 최신 30개만 가져오기
      const { data: boards } = await supabase
        .from('board_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (boards) setBoardPosts(boards);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 시 사용자가 추천한 글 목록 불러오기
  const fetchUserLikes = async (userId: string) => {
    const { data: likes } = await supabase
      .from('board_likes')
      .select('post_id')
      .eq('user_id', userId);

    if (likes) {
      setLikedPosts(new Set(likes.map(l => l.post_id)));
    }
  };

  // 특정 게시글의 댓글 불러오기
  const fetchCommentsForPost = async (postId: string) => {
    const { data: comments } = await supabase
      .from('board_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (comments) {
      setCommentsMap(prev => ({ ...prev, [postId]: comments }));
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
        setNewTradePost(prev => ({ ...prev, character_name: profile.name }));
        fetchUserLikes(user.id);
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
        fetchUserLikes(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
        setLikedPosts(new Set());
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // -------------------------------------------------------------
  // ✍️ 게시판 기능 (추천 1회 제한 및 실제 댓글 연동)
  // -------------------------------------------------------------
  const handleLikeBoardPost = async (postId: string, currentLikes: number) => {
    if (!isLoggedIn || !userProfile) {
      alert('추천은 로그인 후 이용 가능합니다.');
      setIsLoginModalOpen(true);
      return;
    }

    const isAlreadyLiked = likedPosts.has(postId);

    if (isAlreadyLiked) {
      // 추천 취소 (-1)
      await supabase.from('board_likes').delete().match({ post_id: postId, user_id: userProfile.id });
      await supabase.from('board_posts').update({ likes: currentLikes - 1 }).eq('id', postId);

      setLikedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setBoardPosts(boardPosts.map(p => p.id === postId ? { ...p, likes: currentLikes - 1 } : p));
    } else {
      // 추천 하기 (+1)
      const { error } = await supabase.from('board_likes').insert([{ post_id: postId, user_id: userProfile.id }]);
      if (!error) {
        await supabase.from('board_posts').update({ likes: currentLikes + 1 }).eq('id', postId);

        setLikedPosts(prev => new Set(prev).add(postId));
        setBoardPosts(boardPosts.map(p => p.id === postId ? { ...p, likes: currentLikes + 1 } : p));
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!isLoggedIn || !userProfile) {
      alert('댓글을 작성하려면 로그인해주세요.');
      setIsLoginModalOpen(true);
      return;
    }
    if (!newCommentInput.trim()) return;

    const { error } = await supabase.from('board_comments').insert([{
      post_id: postId,
      user_id: userProfile.id,
      author_name: userProfile.name,
      content: newCommentInput
    }]);

    if (!error) {
      setNewCommentInput('');
      fetchCommentsForPost(postId); // 방금 작성한 댓글 다시 불러와서 화면에 반영
    } else {
      alert('댓글 작성 실패: ' + error.message);
    }
  };

  const toggleCommentSection = (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      fetchCommentsForPost(postId);
    }
  };

  // -------------------------------------------------------------
  // 🏪 거래글 기능 (기존 로직 유지)
  // -------------------------------------------------------------
  const openUserStore = (post: any) => {
    setSelectedUserStore({ id: post.user_id, name: post.character_name || '모험가', avatar: post.user_avatar || '🍁' });
    setStoreCategoryFilter('ALL');
    setIsUserStoreModalOpen(true);
  };

  const handleCreateTradePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const postPayload = {
      category: newTradePost.category, title: newTradePost.title, item_name: newTradePost.itemName,
      item_icon: newTradePost.itemIcon || '📦', quantity: newTradePost.quantity, equip_stats: newTradePost.equipStats,
      character_name: userProfile?.name || newTradePost.character_name, location_or_boss: newTradePost.location_or_boss,
      currency_type: newTradePost.currencyType, price_meso: newTradePost.priceMeso, price_cash: newTradePost.priceCash,
      content: newTradePost.content, is_safe_trade: true, status: 'RECRUITING', user_id: userProfile?.id, user_avatar: userProfile?.avatar
    };
    const { error } = await supabase.from('trade_posts').insert([postPayload]);
    if (!error) { alert('거래 글이 등록되었습니다!'); setIsWriteModalOpen(false); fetchAllData(); }
  };

  const handleCreateBoardPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('board_posts').insert([{ title: newBoardPost.title, content: newBoardPost.content, author_name: userProfile?.name || '익명유저', likes: 0, user_id: userProfile?.id }]);
    if (!error) { alert('게시글이 작성되었습니다!'); setIsWriteModalOpen(false); fetchAllData(); }
  };

  const handleTogglePostStatus = async (post: any) => {
    const nextStatus = post.status === 'RECRUITING' ? 'COMPLETED' : 'RECRUITING';
    const { error } = await supabase.from('trade_posts').update({ status: nextStatus }).eq('id', post.id);
    if (!error) { setSelectedPostDetail((prev: any) => (prev ? { ...prev, status: nextStatus } : null)); fetchAllData(); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('trade_posts').delete().eq('id', postId);
    if (!error) { setIsDetailModalOpen(false); fetchAllData(); }
  };

  const openKakaoChat = async (post: any) => {
    if (!isLoggedIn) { alert('1:1 채팅 문의를 위해 로그인해주세요!'); setIsLoginModalOpen(true); return; }
    setActiveChatTarget(post); setIsChatModalOpen(true);
    const { data: msgs } = await supabase.from('chat_messages').select('*').eq('trade_post_id', post.id).order('created_at', { ascending: true });
    if (msgs && msgs.length > 0) {
      setChatMessages(msgs.map((m: any) => ({ id: m.id, sender: m.user_id === userProfile?.id ? 'me' : 'other', text: m.message, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })));
    } else {
      setChatMessages([{ sender: 'system', text: `[${post.title}] 1:1 라이브 대화방`, time: '방금 전' }, { sender: 'other', text: '안녕하세요! 문의드립니다.', time: '방금 전' }]);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatTarget) return;
    const now = new Date();
    const timeStr = `${now.getHours() > 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const msgText = inputMessage; setInputMessage('');
    setChatMessages(prev => [...prev, { sender: 'me', text: msgText, time: timeStr }]);
    await supabase.from('chat_messages').insert([{ trade_post_id: activeChatTarget.id, sender_name: userProfile?.name || '익명', message: msgText, user_id: userProfile?.id }]);
  };

  // 필터링 & 정렬
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
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-[#1a1d24] text-slate-100' : 'bg-[#f1f3f7] text-slate-900'}`}>
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
                <div className="w-7 h-7 overflow-hidden rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-sm">{renderAvatar(userProfile?.avatar || '🍁')}</div>
                <span className="font-bold text-sm hidden md:block">{userProfile?.name}</span>
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
                      <button onClick={(e) => { e.stopPropagation(); openUserStore(post); }} className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                        <div className="w-5 h-5 overflow-hidden rounded-lg">{renderAvatar(post.user_avatar || '🍁')}</div>
                        <strong className="text-slate-200">{post.character_name}</strong>
                        <Store className="w-3.5 h-3.5" />
                      </button>
                      <span>📍 {post.location_or_boss}</span>
                      <span>{renderPriceTag(post)}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openKakaoChat(post); }} className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shrink-0">
                    <MessageSquare className="w-4 h-4 fill-current" /> 1:1 라이브 챗
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAB 2: 자유게시판 (추천 토글 & 실DB 댓글 연동) */}
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
                const isLiked = likedPosts.has(post.id); // 사용자가 이미 추천했는지 여부
                const postComments = commentsMap[post.id] || []; // DB에서 불러온 댓글
                const isCommentOpen = activeCommentPostId === post.id;

                return (
                  <div key={post.id} className={`p-5 border rounded-2xl space-y-4 ${isDarkMode ? 'bg-[#222631] border-slate-700/70' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(post.likes || 0) >= 5 && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1"><Flame className="w-3.5 h-3.5 fill-rose-400" /> 인기글</span>}
                          <h3 className="font-bold text-base md:text-lg text-slate-100">{post.title}</h3>
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* 추천 (좋아요) 토글 버튼 */}
                      <button
                        onClick={() => handleLikeBoardPost(post.id, post.likes || 0)}
                        className={`flex flex-col items-center justify-center border px-3.5 py-2.5 rounded-2xl shrink-0 ml-4 transition-all ${isLiked
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-slate-950' : 'fill-amber-400/20'}`} />
                        <span className="text-xs md:text-sm font-extrabold mt-1">{post.likes || 0}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700/60 text-xs md:text-sm text-slate-400">
                      <span>작성자: <strong className="text-slate-200">{post.author_name || '익명'}</strong></span>
                      <button
                        onClick={() => toggleCommentSection(post.id)}
                        className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {isCommentOpen ? '댓글 닫기' : '댓글 보기'}
                      </button>
                    </div>

                    {/* 실 DB 연동 댓글 영역 */}
                    {isCommentOpen && (
                      <div className="bg-slate-900/60 rounded-xl p-4 space-y-3 border border-slate-800/80 mt-2 animate-in fade-in zoom-in-95 duration-200">
                        {postComments.length > 0 ? (
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {postComments.map(c => (
                              <div key={c.id} className="flex flex-col text-xs md:text-sm border-b border-slate-800/50 pb-2.5 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <strong className="text-amber-400">{c.author_name}</strong>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(c.created_at).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span className="text-slate-300 break-all">{c.content}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-500 py-2">첫 번째 댓글을 남겨보세요!</div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-slate-800/50">
                          <input
                            type="text"
                            placeholder={isLoggedIn ? "댓글을 작성하세요..." : "로그인 후 댓글 작성이 가능합니다"}
                            value={newCommentInput}
                            onChange={(e) => setNewCommentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            disabled={!isLoggedIn}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!isLoggedIn || !newCommentInput.trim()}
                            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs md:text-sm transition-colors"
                          >
                            등록
                          </button>
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

      {/* 모달 영역 */}
      {isProfileModalOpen && userProfile && <ProfileModal userProfile={userProfile} isDarkMode={isDarkMode} onClose={() => setIsProfileModalOpen(false)} onSuccess={(updated) => setUserProfile((prev: any) => ({ ...prev, ...updated }))} />}
      {isUserStoreModalOpen && selectedUserStore && <UserStoreModal selectedUserStore={selectedUserStore} userTradePosts={selectedUserTradePosts} categories={TRADE_CATEGORIES} storeCategoryFilter={storeCategoryFilter} setStoreCategoryFilter={setStoreCategoryFilter} isDarkMode={isDarkMode} onClose={() => setIsUserStoreModalOpen(false)} onSelectPost={(p) => { setSelectedPostDetail(p); setIsDetailModalOpen(true); }} onOpenChat={openKakaoChat} renderPriceTag={renderPriceTag} renderAvatar={renderAvatar} />}
      {isChatModalOpen && activeChatTarget && <ChatModal activeChatTarget={activeChatTarget} chatMessages={chatMessages} inputMessage={inputMessage} setInputMessage={setInputMessage} chatScrollRef={chatScrollRef} onClose={() => setIsChatModalOpen(false)} onSendMessage={handleSendChatMessage} />}
      {isDetailModalOpen && selectedPostDetail && <TradeDetailModal selectedPostDetail={selectedPostDetail} userProfile={userProfile} categories={TRADE_CATEGORIES} isDarkMode={isDarkMode} onClose={() => setIsDetailModalOpen(false)} onOpenStore={openUserStore} onOpenChat={openKakaoChat} onToggleStatus={handleTogglePostStatus} onDeletePost={handleDeletePost} renderPriceTag={renderPriceTag} />}
      {isWriteModalOpen && <WriteModal mainTab={mainTab} setMainTab={setMainTab} newTradePost={newTradePost} setNewTradePost={setNewTradePost} newBoardPost={newBoardPost} setNewBoardPost={setNewBoardPost} itemSearchQuery={itemSearchQuery} filteredItemDB={filteredItemDB} isDarkMode={isDarkMode} onClose={() => setIsWriteModalOpen(false)} onItemSearchChange={(q) => { setItemSearchQuery(q); setFilteredItemDB(q.trim() === '' ? [] : MOCK_ITEM_DB.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))); }} onSelectItemFromDB={(item) => { setNewTradePost((prev: any) => ({ ...prev, itemName: item.name, itemIcon: item.icon, equipStats: item.defaultStats, title: prev.title || `[${item.name}] 거래합니다.` })); setItemSearchQuery(item.name); setFilteredItemDB([]); }} onCreateTradePost={handleCreateTradePost} onCreateBoardPost={handleCreateBoardPost} />}

      {/* 로그인 모달 */}
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