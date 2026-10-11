'use client';

import React from 'react';
import { X, MessageSquare, Store, MapPin, Sparkles, ShoppingBag, Users, Swords } from 'lucide-react';

interface UserStoreModalProps {
    selectedUserStore: {
        id?: string;
        name: string;
        avatar: string;
        user_code?: string;
    };
    userTradePosts: any[];
    categories: any[];
    storeCategoryFilter: string;
    setStoreCategoryFilter: (cat: string) => void;
    isDarkMode: boolean;
    onClose: () => void;
    onSelectPost: (post: any) => void;
    onOpenChat: (post: any) => void;
    renderPriceTag: (post: any) => React.ReactNode;
    renderAvatar: (src: string) => React.ReactNode;
}

export default function UserStoreModal({
    selectedUserStore,
    userTradePosts,
    categories,
    storeCategoryFilter,
    setStoreCategoryFilter,
    isDarkMode,
    onClose,
    onSelectPost,
    onOpenChat,
    renderPriceTag,
    renderAvatar
}: UserStoreModalProps) {
    // 사용자의 총 거래글 수
    const totalPosts = userTradePosts.length;
    // 완료된 거래 수
    const completedPosts = userTradePosts.filter(p => p.status === 'COMPLETED').length;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>

                {/* 헤더 영역 (프로필 정보) */}
                <div className={`p-6 border-b flex items-start justify-between shrink-0 ${isDarkMode ? 'border-slate-700/80 bg-slate-900/50 rounded-t-3xl' : 'border-slate-200 bg-slate-50 rounded-t-3xl'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                            {renderAvatar(selectedUserStore.avatar)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                                {selectedUserStore.name}
                                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                    {selectedUserStore.user_code || '#????'}
                                </span>
                            </h2>
                            <div className="flex gap-3 mt-2 text-xs md:text-sm font-bold text-slate-400">
                                <span className="flex items-center gap-1"><Store className="w-4 h-4" /> 등록된 글 {totalPosts}개</span>
                                <span>·</span>
                                <span className="text-emerald-400">거래 완료 {completedPosts}건</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 바디 영역 (글 목록) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {/* 카테고리 필터 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = storeCategoryFilter === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setStoreCategoryFilter(cat.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border ${isActive
                                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                                            : isDarkMode ? 'bg-[#2a2f3d] text-slate-400 border-slate-700/80 hover:border-amber-500/50' : 'bg-slate-100 text-slate-500 border-slate-300 hover:border-amber-500/50'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* 게시글 리스트 */}
                    {userTradePosts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 space-y-3">
                            <Store className="w-12 h-12 mx-auto text-slate-700" />
                            <p className="text-sm font-bold">등록된 거래글이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userTradePosts.map((post) => (
                                <div
                                    key={post.id}
                                    onClick={() => onSelectPost(post)}
                                    className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all ${isDarkMode ? 'bg-[#1a1d24] border-slate-700/70 hover:border-amber-500/60' : 'bg-white border-slate-200 hover:border-amber-500/60 shadow-sm'
                                        }`}
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold ${post.status === 'RECRUITING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400 border border-slate-600'}`}>
                                                {post.status === 'RECRUITING' ? '거래가능' : '거래완료'}
                                            </span>
                                            <span className="text-[10px] md:text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-700 text-slate-300">
                                                {categories.find((c) => c.id === post.category)?.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500 ml-auto">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className={`font-bold text-sm md:text-base ${post.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                            {post.title}
                                        </h3>

                                        <div className="flex items-center gap-3 text-[10px] md:text-xs text-slate-400 flex-wrap">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {post.location_or_boss}</span>
                                            <span>|</span>
                                            <span>{renderPriceTag(post)}</span>
                                        </div>
                                    </div>

                                    {post.status === 'RECRUITING' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenChat(post); }}
                                            className="bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shrink-0 md:w-auto w-full transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 fill-current" /> 문의하기
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}