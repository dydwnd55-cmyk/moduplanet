'use client';

import React from 'react';
import { X } from 'lucide-react';

interface WriteModalProps {
    mainTab: 'TRADE' | 'BOARD';
    setMainTab: (tab: 'TRADE' | 'BOARD') => void;
    newTradePost: any;
    setNewTradePost: React.Dispatch<React.SetStateAction<any>>;
    newBoardPost: any;
    setNewBoardPost: React.Dispatch<React.SetStateAction<any>>;
    itemSearchQuery: string;
    filteredItemDB: any[];
    isDarkMode: boolean;
    onClose: () => void;
    onItemSearchChange: (q: string) => void;
    onSelectItemFromDB: (item: any) => void;
    onCreateTradePost: (e: React.FormEvent) => void;
    onCreateBoardPost: (e: React.FormEvent) => void;
}

export default function WriteModal({
    mainTab,
    setMainTab,
    newTradePost,
    setNewTradePost,
    newBoardPost,
    setNewBoardPost,
    itemSearchQuery,
    filteredItemDB,
    isDarkMode,
    onClose,
    onItemSearchChange,
    onSelectItemFromDB,
    onCreateTradePost,
    onCreateBoardPost,
}: WriteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>

                <div className="flex gap-2 border-b border-slate-700/80 pb-3">
                    <button onClick={() => setMainTab('TRADE')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'TRADE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                        거래글 작성
                    </button>
                    <button onClick={() => setMainTab('BOARD')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'BOARD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                        자유게시판 글 작성
                    </button>
                </div>

                {mainTab === 'TRADE' ? (
                    <form onSubmit={onCreateTradePost} className="space-y-3.5 text-xs md:text-sm">
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
                                onChange={(e) => onItemSearchChange(e.target.value)}
                                className="w-full border rounded-xl p-3 bg-slate-900 border-amber-500/50 text-amber-300 focus:outline-none"
                            />
                            {filteredItemDB.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800">
                                    {filteredItemDB.map((item) => (
                                        <div key={item.id} onClick={() => onSelectItemFromDB(item)} className="p-3 hover:bg-slate-800 cursor-pointer flex items-center justify-between">
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
                    <form onSubmit={onCreateBoardPost} className="space-y-3.5 text-xs md:text-sm">
                        <input type="text" required placeholder="글 제목" value={newBoardPost.title} onChange={(e) => setNewBoardPost({ ...newBoardPost, title: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                        <textarea rows={5} required placeholder="내용을 입력하세요..." value={newBoardPost.content} onChange={(e) => setNewBoardPost({ ...newBoardPost, content: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100" />
                        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all">게시글 작성</button>
                    </form>
                )}
            </div>
        </div>
    );
}