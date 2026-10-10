'use client';

import React from 'react';
import { X, MessageSquare, Store, Trash2 } from 'lucide-react';

interface TradeDetailModalProps {
    selectedPostDetail: any;
    userProfile: any;
    categories: any[];
    isDarkMode: boolean;
    onClose: () => void;
    onOpenStore: (post: any) => void;
    onOpenChat: (post: any) => void;
    onToggleStatus: (post: any) => void;
    onDeletePost: (postId: string) => void;
    renderPriceTag: (post: any) => React.ReactNode;
}

export default function TradeDetailModal({
    selectedPostDetail,
    userProfile,
    categories,
    isDarkMode,
    onClose,
    onOpenStore,
    onOpenChat,
    onToggleStatus,
    onDeletePost,
    renderPriceTag,
}: TradeDetailModalProps) {
    const isOwner = userProfile?.id && (selectedPostDetail.user_id === userProfile.id || selectedPostDetail.character_name === userProfile.name);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-5 relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"><X className="w-6 h-6" /></button>

                <div className="flex items-center gap-2 text-xs md:text-sm">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg font-bold">
                        {categories.find((c) => c.id === selectedPostDetail.category)?.label}
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
                        <span className="text-slate-400 block mb-1">판매자</span>
                        <button
                            onClick={() => { onClose(); onOpenStore(selectedPostDetail); }}
                            className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                        >
                            {selectedPostDetail.character_name}
                            <Store className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div>
                        <span className="text-slate-400 block mb-1">희망 가격</span>
                        {renderPriceTag(selectedPostDetail)}
                    </div>
                </div>

                {isOwner && (
                    <div className="flex gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                        <button
                            onClick={() => onToggleStatus(selectedPostDetail)}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 py-2 rounded-lg font-bold"
                        >
                            {selectedPostDetail.status === 'RECRUITING' ? '✅ 거래 완료 상태로 변경' : '🔄 거래가능 상태로 변경'}
                        </button>
                        <button
                            onClick={() => onDeletePost(selectedPostDetail.id)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 px-3 py-2 rounded-lg font-bold flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" /> 삭제
                        </button>
                    </div>
                )}

                <button
                    onClick={() => { onClose(); onOpenChat(selectedPostDetail); }}
                    className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs md:text-sm shadow-md"
                >
                    <MessageSquare className="w-5 h-5 fill-current" /> 1:1 라이브 챗 시작하기
                </button>
            </div>
        </div>
    );
}