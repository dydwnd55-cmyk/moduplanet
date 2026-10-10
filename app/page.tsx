'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Sparkles, ShoppingBag, Users, Swords, LogIn, LogOut,
  Search, Plus, MessageSquare, X, Moon, Sun, MapPin,
  Trash2, ThumbsUp, Coins, CreditCard, ChevronLeft, Flame,
  MoreVertical, Settings, MessageCircle, Store, Upload
} from 'lucide-react';

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

const JOB_ICONS: Record<string, string> = {
  '비숍': '🔮', '나이트로드': '🗡️', '크루세이더': '⚔️',
  '허밋': '🗡️', '보우마스터': '🏹', '캡틴': '🔫', '기타': '🍁'
};

const AVATAR_OPTIONS = ['🍁', '🔮', '🗡️', '⚔️', '🏹', '🔫', '👑', '🥊', '🧙‍♂️'];

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
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; job: string; level: number; avatar: string } | null>(null);

  // 모달 제어
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<any>(null);

  // 🏪 개인상점 모달 상태
  const [isUserStoreModalOpen, setIsUserStoreModalOpen] = useState(false);
  const [selectedUserStore, setSelectedUserStore] = useState<{ id?: string; name: string; job: string; level: number; avatar: string } | null>(null);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('ALL');

  // 프로필 수정 입력 상태
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    job: '크루세이더',
    level: 80,
    avatar: '🍁'
  });

  // 댓글 기능 상태
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ id: string; author: string; text: string; time: string }>>>({
    'b1': [{ id: 'c1', author: '클래식고수', text: '좋은 정보 감사합니다!', time: '10분 전' }]
  });
  const [newCommentInput, setNewCommentInput] = useState('');

  // 1:1 라이브 채팅
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatTarget, setActiveChatTarget] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ id?: string; sender: 'me' | 'other' | 'system'; sender_name?: string; text: string; time: string }>>([]);
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
    job: '크루세이더',
    level: 80,
    location_or_boss: '',
    currencyType: 'MESO',
    priceMeso: '',
    priceCash: '',
    content: '',
    isSafeTrade: true
  });

  const [newBoardPost, setNewBoardPost] = useState({ title: '', content: '' });

  // -------------------------------------------------------------
  // 🔄 Supabase 데이터 Fetch
  // -------------------------------------------------------------
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: trades, error: tradeErr } = await supabase
        .from('trade_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tradeErr && trades) {
        setTradePosts(trades);
      }

      const { data: boards, error: boardErr } = await supabase
        .from('board_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!boardErr && boards) {
        setBoardPosts(boards);
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎮 디스코드 로그인
  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      alert('디스코드 로그인 에러: ' + error.message);
    }
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
          job: meta.job || '크루세이더',
          level: meta.level || 80,
          avatar: meta.avatar || meta.avatar_url || '🍁',
        };
        setUserProfile(profile);
        setEditProfileForm({
          name: profile.name,
          job: profile.job,
          level: profile.level,
          avatar: profile.avatar
        });
        setNewTradePost((prev: any) => ({
          ...prev,
          character_name: profile.name,
          job: profile.job,
          level: profile.level
        }));
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        const profile = {
          id: session.user.id,
          name: meta.character_name || meta.full_name || meta.name || '플래닛모험가',
          job: meta.job || '크루세이더',
          level: meta.level || 80,
          avatar: meta.avatar || meta.avatar_url || '🍁',
        };
        setUserProfile(profile);
        setEditProfileForm({
          name: profile.name,
          job: profile.job,
          level: profile.level,
          avatar: profile.avatar
        });
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 👤 프로필 정보 수정
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const { error } = await supabase.auth.updateUser({
      data: {
        character_name: editProfileForm.name,
        job: editProfileForm.job,
        level: Number(editProfileForm.level),
        avatar: editProfileForm.avatar
      }
    });

    if (error) {
      alert('프로필 수정 중 에러: ' + error.message);
    } else {
      const updated = {
        ...userProfile,
        name: editProfileForm.name,
        job: editProfileForm.job,
        level: Number(editProfileForm.level),
        avatar: editProfileForm.avatar
      };
      setUserProfile(updated);
      setNewTradePost((prev: any) => ({
        ...prev,
        character_name: updated.name,
        job: updated.job,
        level: updated.level
      }));
      alert('프로필이 성공적으로 변경되었습니다!');
      setIsProfileModalOpen(false);
    }
  };

  // 🖼️ 프로필 이미지 파일 업로드 핸들러
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 용량은 2MB 이하로 업로드해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setEditProfileForm((prev: any) => ({ ...prev, avatar: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserProfile(null);
  };

  // 🏬 개인 상점 열기
  const openUserStore = (post: any) => {
    setSelectedUserStore({
      id: post.user_id,
      name: post.character_name || '모험가',
      job: post.job || '기타',
      level: post.level || 1,
      avatar: post.user_avatar || '🍁'
    });
    setStoreCategoryFilter('ALL');
    setIsUserStoreModalOpen(true);
  };

  // Supabase 거래글 작성
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
      job: userProfile?.job || newTradePost.job,
      level: Number(userProfile?.level || newTradePost.level),
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

    if (error) {
      alert('글 등록 실패: ' + error.message);
    } else {
      alert('거래 글이 등록되었습니다!');
      setIsWriteModalOpen(false);
      fetchAllData();
    }
  };

  // 거래글 완료 상태 변경 및 삭제
  const handleTogglePostStatus = async (post: any) => {
    const nextStatus = post.status === 'RECRUITING' ? 'COMPLETED' : 'RECRUITING';
    const { error } = await supabase.from('trade_posts').update({ status: nextStatus }).eq('id', post.id);

    if (!error) {
      alert(`게시글 상태가 [${nextStatus === 'COMPLETED' ? '완료됨' : '거래가능'}]으로 변경되었습니다.`);
      setSelectedPostDetail((prev: any) => (prev ? { ...prev, status: nextStatus } : null));
      fetchAllData();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('trade_posts').delete().eq('id', postId);

    if (!error) {
      alert('게시글이 삭제되었습니다.');
      setIsDetailModalOpen(false);
      fetchAllData();
    } else {
      alert('삭제 실패: ' + error.message);
    }
  };

  // 자유게시판 글 등록
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

    if (error) {
      alert('게시글 등록 실패: ' + error.message);
    } else {
      alert('자유게시글이 작성되었습니다!');
      setIsWriteModalOpen(false);
      fetchAllData();
    }
  };

  const handleLikeBoardPost = async (id: string, currentLikes: number) => {
    const { error } = await supabase
      .from('board_posts')
      .update({ likes: currentLikes + 1 })
      .eq('id', id);

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
    setCommentsMap((prev: any) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentObj]
    }));
    setNewCommentInput('');
  };

  const handleItemSearchChange = (query: string) => {
    setItemSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItemDB([]);
    } else {
      setFilteredItemDB(MOCK_ITEM_DB.filter(i => i.name.toLowerCase().includes(query.toLowerCase())));
    }
  };

  const selectItemFromDB = (item: typeof MOCK_ITEM_DB[0]) => {
    setNewTradePost((prev: any) => ({
      ...prev,
      itemName: item.name,
      itemIcon: item.icon,
      equipStats: item.defaultStats,
      title: prev.title || `[${item.name}] 거래합니다.`
    }));
    setItemSearchQuery(item.name);
    setFilteredItemDB([]);
  };

  // 1:1 라이브 챗
  const fetchChatMessages = async (postId: string) => {
    const { data: msgs, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('trade_post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && msgs && msgs.length > 0) {
      const formatted = msgs.map((m: any) => ({
        id: m.id,
        sender: m.user_id === userProfile?.id ? ('me' as const) : ('other' as const),
        sender_name: m.sender_name,
        text: m.message,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setChatMessages(formatted);
    } else {
      setChatMessages([
        { sender: 'system', text: `[${activeChatTarget?.title || '거래글'}] 1:1 라이브 대화방`, time: '방금 전' },
        { sender: 'other', text: '안녕하세요! 구매 및 거래 문의드립니다.', time: '방금 전' }
      ]);
    }
  };

  const openKakaoChat = (post: any) => {
    if (!isLoggedIn) {
      alert('1:1 채팅 문의를 위해 로그인해주세요!');
      setIsLoginModalOpen(true);
      return;
    }
    setActiveChatTarget(post);
    setIsChatModalOpen(true);
    fetchChatMessages(post.id);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatTarget) return;

    const now = new Date();
    const timeStr = `${now.getHours() > 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const messageText = inputMessage;
    setInputMessage('');

    setChatMessages((prev: any) => [...prev, { sender: 'me', text: messageText, time: timeStr }]);

    await supabase.from('chat_messages').insert([{
      trade_post_id: activeChatTarget.id,
      sender_name: userProfile?.name || '익명',
      message: messageText,
      user_id: userProfile?.id
    }]);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const filteredTradePosts = tradePosts.filter(post => {
    const matchesCategory = activeCategory === 'ALL' || post.category === activeCategory;
    const matchesSearch = (post.title || '').includes(searchTerm) ||
      (post.item_name || '').includes(searchTerm) ||
      (post.character_name || '').includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  // 선택된 유저의 개인상점 거래글 목록
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
    if (post.currency_type === 'BOTH') {
      return (
        <span className="flex items-center gap-1.5 font-extrabold text-amber-400 text-sm md:text-base">
          <Coins className="w-4 h-4 text-amber-400" /> {post.price_meso}
          <span className="text-slate-500 font-normal">|</span>
          <CreditCard className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">{post.price_cash}</span>
        </span>
      );
    }
    if (post.currency_type === 'CASH') {
      return (
        <span className="flex items-center gap-1.5 font-extrabold text-emerald-400 text-sm md:text-base">
          <CreditCard className="w-4 h-4" /> {post.price_cash} (현금)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 font-extrabold text-amber-400 text-sm md:text-base">
        <Coins className="w-4 h-4" /> {post.price_meso || '가격 협의'}
      </span>
    );
  };

  const renderAvatar = (avatarSrc: string) => {
    if (avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image'))) {
      return <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />;
    }
    return <span>{avatarSrc || '🍁'}</span>;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? 'bg-[#1a1d24] text-slate-100' : 'bg-[#f1f3f7] text-slate-900'
      }`}>
      {/* 1. 상단 내비게이션 */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${isDarkMode ? 'bg-[#222631]/90 border-slate-700/60' : 'bg-white/95 border-slate-300/70 shadow-sm'
        }`}>
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMainTab('TRADE')}>
              <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-2xl font-bold text-slate-950">
                🍁
              </div>
              <span className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                모두<span className="text-amber-500">플래닛</span>
              </span>
            </div>

            <nav className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-[#14171f]/80 border-slate-700/80' : 'bg-slate-200/80 border-slate-300'
              }`}>
              <button
                onClick={() => setMainTab('TRADE')}
                className={`px-4 py-2.5 rounded-xl text-sm md:text-base font-bold transition-all ${mainTab === 'TRADE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                거래 센터
              </button>
              <button
                onClick={() => setMainTab('BOARD')}
                className={`px-4 py-2.5 rounded-xl text-sm md:text-base font-bold transition-all ${mainTab === 'BOARD' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                자유게시판
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600 text-amber-400 hover:bg-slate-700' : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300'
                }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) { alert('글 작성을 위해 로그인해주세요!'); setIsLoginModalOpen(true); return; }
                setIsWriteModalOpen(true);
              }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm md:text-base px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-5 h-5 stroke-[3]" /> 글쓰기
            </button>

            {isLoggedIn ? (
              <div
                onClick={() => setIsProfileModalOpen(true)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-sm md:text-base cursor-pointer transition-all hover:border-amber-500/80 ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600' : 'bg-slate-200/80 border-slate-300'
                  }`}
              >
                <div className="w-7 h-7 overflow-hidden rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-sm">
                  {renderAvatar(userProfile?.avatar || '🍁')}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs md:text-sm leading-tight">{userProfile?.name}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Lv.{userProfile?.level} {userProfile?.job}</span>
                </div>
                <Settings className="w-4 h-4 text-slate-400 ml-1 hover:text-amber-400" />
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`flex items-center gap-2 border font-bold text-sm md:text-base px-4 py-2.5 rounded-2xl transition-all ${isDarkMode ? 'bg-[#2a2f3d] border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
                  }`}
              >
                <LogIn className="w-5 h-5 text-amber-500" /> 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* 안심 배너 */}
        <div className={`rounded-3xl p-5 border flex flex-col md:flex-row justify-between items-center gap-4 transition-all ${isDarkMode
          ? 'bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-[#222631] border-amber-500/40'
          : 'bg-gradient-to-r from-amber-100/80 via-emerald-50/80 to-white border-amber-300 shadow-sm'
          }`}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 text-xl font-bold">
              🛡️
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg">중개 수수료 5%</span>
                <h2 className="text-base md:text-lg font-extrabold text-amber-400">모두플래닛 안전거래 보증 시스템</h2>
              </div>
              <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                먹튀 사기 걱정 없는 1:1 중개 거래! 거래 상대방의 프로필 사진을 클릭하면 **개인 상점**을 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: 거래 Center */}
        {mainTab === 'TRADE' && (
          <>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TRADE_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm md:text-base font-bold transition-all whitespace-nowrap border ${isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                      : isDarkMode ? 'bg-[#222631] text-slate-300 border-slate-700/80 hover:border-slate-500' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 shadow-sm'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 검색창 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="아이템명, 사냥터, 캐릭터명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm md:text-base focus:outline-none focus:border-amber-500 font-medium ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
              />
            </div>

            {/* 거래 리스트 */}
            <div className="space-y-3">
              {filteredTradePosts.length > 0 ? (
                filteredTradePosts.map(post => {
                  const catObj = TRADE_CATEGORIES.find(c => c.id === post.category);
                  const jobIcon = JOB_ICONS[post.job] || '🍁';

                  return (
                    <div
                      key={post.id}
                      onClick={() => { setSelectedPostDetail(post); setIsDetailModalOpen(true); }}
                      className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all cursor-pointer group ${isDarkMode ? 'bg-[#222631] border-slate-700/70 hover:border-amber-500/60' : 'bg-white border-slate-200 hover:border-amber-500/60 shadow-sm hover:shadow-md'
                        }`}
                    >
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold ${post.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400'}`}>
                            {post.status === 'RECRUITING' ? '거래가능' : '완료됨'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg font-bold border ${catObj?.badgeColor}`}>
                            {catObj?.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                          {post.item_name && (
                            <span className="bg-slate-800 text-amber-300 border border-amber-500/40 font-bold px-3 py-1 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shrink-0">
                              <span className="text-base">{post.item_icon || '📦'}</span>
                              {post.item_name}
                              {post.quantity && <span className="text-slate-400 font-normal">({post.quantity})</span>}
                            </span>
                          )}
                          <h3 className={`font-bold text-base md:text-lg group-hover:text-amber-400 transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {post.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs md:text-sm text-slate-400">
                          {/* 🏬 유저 개인상점 보기 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserStore(post);
                            }}
                            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                          >
                            <div className="w-5 h-5 overflow-hidden rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">
                              {renderAvatar(post.user_avatar || '🍁')}
                            </div>
                            <strong className="text-slate-200">{post.character_name}</strong>
                            <span className="text-[11px] text-amber-400/80">(Lv.{post.level} {post.job})</span>
                            <Store className="w-3.5 h-3.5 ml-0.5 text-amber-400" />
                          </button>

                          <span>📍 {post.location_or_boss}</span>
                          <span>{renderPriceTag(post)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-700/60 pt-3 md:pt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openKakaoChat(post);
                          }}
                          className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black px-4 py-2.5 rounded-2xl text-xs md:text-sm flex items-center gap-2 shadow-md transition-all"
                        >
                          <MessageSquare className="w-4 h-4 fill-current" /> 1:1 라이브 챗
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`text-center py-20 rounded-2xl border ${isDarkMode ? 'bg-[#222631] border-slate-700/70' : 'bg-white border-slate-200'}`}>
                  <p className="text-slate-400 font-bold text-base md:text-lg">
                    {isLoading ? '데이터를 로딩 중입니다...' : '등록된 거래글이 없습니다.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: 자유 게시판 */}
        {mainTab === 'BOARD' && (
          <div className="space-y-5">
            <div className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-[#222631] border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className="text-sm md:text-base font-extrabold text-amber-400 flex items-center gap-2">
                <Flame className="w-5 h-5 fill-amber-400" /> 자유게시판
              </span>
              <div className="flex gap-2 text-xs md:text-sm">
                <button
                  onClick={() => setBoardSortBy('likes')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all ${boardSortBy === 'likes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  🔥 추천순
                </button>
                <button
                  onClick={() => setBoardSortBy('latest')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all ${boardSortBy === 'latest' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  최신순
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {sortedBoardPosts.map(post => {
                const postComments = commentsMap[post.id] || [];

                return (
                  <div key={post.id} className={`p-5 border rounded-2xl space-y-4 transition-all ${isDarkMode ? 'bg-[#222631] border-slate-700/70' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(post.likes || 0) >= 5 && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 fill-rose-400" /> 인기글
                            </span>
                          )}
                          <h3 className="font-bold text-base md:text-lg text-slate-100">{post.title}</h3>
                        </div>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      <button
                        onClick={() => handleLikeBoardPost(post.id, post.likes || 0)}
                        className="flex flex-col items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2.5 rounded-2xl transition-all shrink-0 ml-4"
                      >
                        <ThumbsUp className="w-5 h-5 fill-amber-400/20" />
                        <span className="text-xs md:text-sm font-extrabold mt-1">{post.likes || 0}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700/60 text-xs md:text-sm text-slate-400">
                      <span>작성자: <strong className="text-slate-200">{post.author_name || '익명'}</strong></span>
                      <span className="flex items-center gap-1 font-bold text-slate-400">
                        <MessageCircle className="w-4 h-4 text-amber-400" /> 댓글 {postComments.length}개
                      </span>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-3.5 space-y-3 border border-slate-800/80">
                      {postComments.map(c => (
                        <div key={c.id} className="flex justify-between items-center text-xs md:text-sm border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                          <span className="text-slate-300">
                            <strong className="text-amber-400 mr-2">{c.author}:</strong> {c.text}
                          </span>
                          <span className="text-[10px] text-slate-500">{c.time}</span>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="댓글을 작성하세요..."
                          value={newCommentInput}
                          onChange={(e) => setNewCommentInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs md:text-sm"
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 3. 모달 레이어 */}

      {/* 🏬 3-1. 유저 개인 상점 모달 */}
      {isUserStoreModalOpen && selectedUserStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-2xl w-full space-y-5 relative shadow-2xl max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsUserStoreModalOpen(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"><X className="w-6 h-6" /></button>

            {/* 유저 상점 프로필 헤더 */}
            <div className="flex items-center gap-4 border-b border-slate-700/80 pb-4">
              <div className="w-16 h-16 overflow-hidden rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                {renderAvatar(selectedUserStore.avatar)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded">개인상점</span>
                  <h2 className="text-xl font-black text-amber-400">{selectedUserStore.name} 님의 상점</h2>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Lv.{selectedUserStore.level} {selectedUserStore.job} | 등록한 글 총 {selectedUserTradePosts.length}개
                </p>
              </div>
            </div>

            {/* 개인상점 내 카테고리 필터 */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TRADE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setStoreCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${storeCategoryFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 해당 유저의 거래 글 목록 */}
            <div className="space-y-2.5">
              {selectedUserTradePosts.length > 0 ? (
                selectedUserTradePosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => {
                      setIsUserStoreModalOpen(false);
                      setSelectedPostDetail(post);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/50 cursor-pointer flex justify-between items-center transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded">
                          {TRADE_CATEGORIES.find(c => c.id === post.category)?.label}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100">{post.title}</h4>
                      </div>
                      <div className="text-xs text-slate-400 flex gap-3">
                        <span>📍 {post.location_or_boss}</span>
                        <span>{renderPriceTag(post)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserStoreModalOpen(false);
                        openKakaoChat(post);
                      }}
                      className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-bold px-3 py-1.5 rounded-xl text-xs shrink-0"
                    >
                      1:1 대화
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  이 사용자가 작성한 거래글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 👤 3-2. 프로필 수정 모달 (사진 직접 업로드 지원) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-5 relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>

            <div className="flex items-center gap-3 border-b border-slate-700/80 pb-4">
              <div className="w-14 h-14 overflow-hidden rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                {renderAvatar(editProfileForm.avatar)}
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-400">내 프로필 설정</h3>
                <p className="text-xs text-slate-400">개인상점 및 거래 시 표시되는 커스텀 프로필입니다.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs md:text-sm">
              {/* 프로필 이미지 선택 및 파일 업로드 */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-bold">프로필 사진 / 이모지 변경</label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 bg-slate-900 border border-slate-700 hover:border-amber-500/60 p-2.5 rounded-xl text-center font-bold cursor-pointer text-amber-400 flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4" /> 내 컴퓨터 사진 업로드
                    <input type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setEditProfileForm({ ...editProfileForm, avatar: av })}
                      className={`p-2.5 rounded-xl border text-xl transition-all ${editProfileForm.avatar === av ? 'bg-amber-500/20 border-amber-500 scale-110' : 'bg-slate-900 border-slate-800'
                        }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">대표 캐릭터명</label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">주직업</label>
                  <select
                    value={editProfileForm.job}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, job: e.target.value })}
                    className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100"
                  >
                    <option value="크루세이더">크루세이더</option>
                    <option value="나이트로드">나이트로드</option>
                    <option value="비숍">비숍</option>
                    <option value="허밋">허밋</option>
                    <option value="보우마스터">보우마스터</option>
                    <option value="캡틴">캡틴</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">캐릭터 레벨</label>
                  <input
                    type="number"
                    required
                    value={editProfileForm.level}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, level: Number(e.target.value) })}
                    className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all mt-2"
              >
                저장 완료
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🟡 3-3. 1:1 라이브 대화방 UI */}
      {isChatModalOpen && activeChatTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md h-[650px] bg-[#ABC1D1] rounded-3xl flex flex-col justify-between relative shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-[#A0B4C4] px-5 py-4 flex justify-between items-center border-b border-black/10 text-[#191919]">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsChatModalOpen(false)} className="hover:opacity-70">
                  <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                </button>
                <div>
                  <h3 className="font-extrabold text-base">{activeChatTarget.character_name}</h3>
                  <span className="text-xs text-slate-800 font-medium">{activeChatTarget.title}</span>
                </div>
              </div>
              <MoreVertical className="w-6 h-6 text-slate-800" />
            </div>

            <div ref={chatScrollRef} className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs md:text-sm font-sans">
              {chatMessages.map((msg, idx) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={idx} className="text-center my-2">
                      <span className="bg-black/25 text-white text-xs px-3.5 py-1.5 rounded-full font-medium">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === 'me';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && (
                      <div className="w-9 h-9 rounded-2xl bg-amber-400 flex items-center justify-center text-base font-bold text-slate-950 shrink-0 self-start shadow-sm">
                        🍁
                      </div>
                    )}
                    {isMe && <span className="text-[10px] text-slate-700 font-medium mb-1">{msg.time}</span>}
                    <div className={`p-3 max-w-[75%] text-xs md:text-sm font-medium leading-relaxed shadow-sm ${isMe
                      ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-2xl rounded-tl-none'
                      }`}>
                      {msg.text}
                    </div>
                    {!isMe && <span className="text-[10px] text-slate-700 font-medium mb-1">{msg.time}</span>}
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-3 flex items-center gap-2 border-t border-black/5">
              <form onSubmit={handleSendChatMessage} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="메시지 입력..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs md:text-sm text-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className={`px-4 py-2.5 rounded-full text-xs md:text-sm font-extrabold transition-all ${inputMessage.trim() ? 'bg-[#FEE500] text-[#191919]' : 'bg-slate-200 text-slate-400'}`}
                >
                  전송
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 3-4. 상세보기 모달 */}
      {isDetailModalOpen && selectedPostDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-5 relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"><X className="w-6 h-6" /></button>

            <div className="flex items-center gap-2 text-xs md:text-sm">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg font-bold">
                {TRADE_CATEGORIES.find(c => c.id === selectedPostDetail.category)?.label}
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-bold">
                🛡️ 수수료 5% 에스크로
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-extrabold text-amber-400">{selectedPostDetail.title}</h2>

            {selectedPostDetail.item_name && (
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5 font-bold text-base text-slate-100">
                    <span className="text-3xl">{selectedPostDetail.item_icon || '📦'}</span>
                    <span>{selectedPostDetail.item_name}</span>
                  </div>
                  <span className="text-xs md:text-sm bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg">
                    수량: {selectedPostDetail.quantity || '1개'}
                  </span>
                </div>

                {selectedPostDetail.equip_stats && (
                  <div className="pt-1 text-xs md:text-sm">
                    <span className="text-amber-400 font-bold block mb-1">⚔️ 옵션:</span>
                    <p className="text-slate-200 font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedPostDetail.equip_stats}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs md:text-sm bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block mb-1">판매자 / 직업</span>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    openUserStore(selectedPostDetail);
                  }}
                  className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  {selectedPostDetail.character_name} (Lv.{selectedPostDetail.level} {selectedPostDetail.job})
                  <Store className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">희망 가격</span>
                {renderPriceTag(selectedPostDetail)}
              </div>
            </div>

            {/* 작성자 본인 제어 버튼 */}
            {userProfile?.id && (selectedPostDetail.user_id === userProfile.id || selectedPostDetail.character_name === userProfile.name) && (
              <div className="flex gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => handleTogglePostStatus(selectedPostDetail)}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 py-2 rounded-lg font-bold"
                >
                  {selectedPostDetail.status === 'RECRUITING' ? '✅ 거래 완료 상태로 변경' : '🔄 거래가능 상태로 변경'}
                </button>
                <button
                  onClick={() => handleDeletePost(selectedPostDetail.id)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-3 py-2 rounded-lg font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openKakaoChat(selectedPostDetail);
                }}
                className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs md:text-sm shadow-md"
              >
                <MessageSquare className="w-5 h-5 fill-current" /> 1:1 라이브 챗 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✍️ 3-5. 새 글 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsWriteModalOpen(false)} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>

            <div className="flex gap-2 border-b border-slate-700/80 pb-3">
              <button onClick={() => setMainTab('TRADE')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'TRADE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                거래글 작성
              </button>
              <button onClick={() => setMainTab('BOARD')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'BOARD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                자유게시판 글 작성
              </button>
            </div>

            {mainTab === 'TRADE' ? (
              <form onSubmit={handleCreateTradePost} className="space-y-3.5 text-xs md:text-sm">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">카테고리</label>
                  <select value={newTradePost.category} onChange={(e) => setNewTradePost({ ...newTradePost, category: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100">
                    <option value="SELL">팝니다</option>
                    <option value="BUY">삽니다</option>
                    <option value="SPOT">사냥터자리</option>
                    <option value="PARTY">파티사냥</option>
                    <option value="EXPEDITION">원정대</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-amber-400 font-bold mb-1">📦 아이템 DB 검색</label>
                  <input
                    type="text"
                    placeholder="아이템 이름 검색..."
                    value={itemSearchQuery}
                    onChange={(e) => handleItemSearchChange(e.target.value)}
                    className="w-full border rounded-xl p-3 bg-slate-900 border-amber-500/50 text-amber-300 focus:outline-none"
                  />
                  {filteredItemDB.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800">
                      {filteredItemDB.map(item => (
                        <div key={item.id} onClick={() => selectItemFromDB(item)} className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between">
                          <span className="font-bold text-slate-200">{item.icon} {item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" required placeholder="아이템명" value={newTradePost.itemName} onChange={(e) => setNewTradePost({ ...newTradePost, itemName: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                  <input type="text" required placeholder="수량" value={newTradePost.quantity} onChange={(e) => setNewTradePost({ ...newTradePost, quantity: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                </div>

                <input type="text" placeholder="옵션 (예: 공8 / 업횟 0회)" value={newTradePost.equipStats} onChange={(e) => setNewTradePost({ ...newTradePost, equipStats: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                <input type="text" required placeholder="제목" value={newTradePost.title} onChange={(e) => setNewTradePost({ ...newTradePost, title: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />

                <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                  <label className="block font-bold text-amber-400">💰 가격 단위 선택</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'MESO' })} className={`w-1/3 py-2.5 rounded-xl font-bold border ${newTradePost.currencyType === 'MESO' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>메소만</button>
                    <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'CASH' })} className={`w-1/3 py-2.5 rounded-xl font-bold border ${newTradePost.currencyType === 'CASH' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>현금만</button>
                    <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'BOTH' })} className={`w-1/3 py-2.5 rounded-xl font-bold border ${newTradePost.currencyType === 'BOTH' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-400'}`}>둘 다 가능</button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {(newTradePost.currencyType === 'MESO' || newTradePost.currencyType === 'BOTH') && (
                      <input type="text" placeholder="예: 4,500만 메소" value={newTradePost.priceMeso} onChange={(e) => setNewTradePost({ ...newTradePost, priceMeso: e.target.value })} className="w-full border rounded-xl p-2.5 bg-slate-900 border-slate-800 text-slate-100" />
                    )}
                    {(newTradePost.currencyType === 'CASH' || newTradePost.currencyType === 'BOTH') && (
                      <input type="text" placeholder="예: 15,000원" value={newTradePost.priceCash} onChange={(e) => setNewTradePost({ ...newTradePost, priceCash: e.target.value })} className="w-full border rounded-xl p-2.5 bg-slate-900 border-slate-800 text-slate-100" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" required placeholder="캐릭터명" value={newTradePost.character_name} onChange={(e) => setNewTradePost({ ...newTradePost, character_name: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                  <input type="text" required placeholder="거래 장소" value={newTradePost.location_or_boss} onChange={(e) => setNewTradePost({ ...newTradePost, location_or_boss: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                </div>

                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all">등록 완료</button>
              </form>
            ) : (
              <form onSubmit={handleCreateBoardPost} className="space-y-3.5 text-xs md:text-sm">
                <input type="text" required placeholder="글 제목" value={newBoardPost.title} onChange={(e) => setNewBoardPost({ ...newBoardPost, title: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                <textarea rows={5} required placeholder="내용을 입력하세요..." value={newBoardPost.content} onChange={(e) => setNewBoardPost({ ...newBoardPost, content: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all">게시글 작성</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 🎮 3-6. 디스코드 로그인 모달 */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`border rounded-3xl p-7 max-w-sm w-full space-y-6 text-center relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>
            <div className="w-14 h-14 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">🍁</div>
            <div>
              <h3 className="text-xl font-black">모두플래닛 시작하기</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1.5 leading-relaxed">로그인 후 1:1 라이브 챗과 개인상점 기능을 이용해 보세요.</p>
            </div>
            <button
              onClick={handleDiscordLogin}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm md:text-base shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a74.53,74.53,0,0,0,64.3,0c.87.69,1.76,1.37,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.94-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.92,53.87,53,48.8,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.92,96.1,53,91,65.69,84.69,65.69Z" />
              </svg>
              디스코드 계정으로 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}