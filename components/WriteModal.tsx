'use client';

import React from 'react';
import { X, Upload } from 'lucide-react';

interface WriteModalProps {
    mainTab: 'TRADE' | 'BOARD';
    setMainTab: (tab: 'TRADE' | 'BOARD') => void;
    newTradePost: any;
    setNewTradePost: React.Dispatch<React.SetStateAction<any>>;
    newBoardPost: any;
    setNewBoardPost: React.Dispatch<React.SetStateAction<any>>;
    isDarkMode: boolean;
    isUploadingImage: boolean;
    onClose: () => void;
    onCreateTradePost: (e: React.FormEvent) => void;
    onCreateBoardPost: (e: React.FormEvent) => void;
    onBoardImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function WriteModal({
    mainTab, setMainTab, newTradePost, setNewTradePost, newBoardPost, setNewBoardPost,
    isDarkMode, isUploadingImage, onClose, onCreateTradePost, onCreateBoardPost, onBoardImageUpload
}: WriteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400"><X className="w-6 h-6" /></button>

                <div className="flex gap-2 border-b border-slate-700/80 pb-3">
                    <button onClick={() => setMainTab('TRADE')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'TRADE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>거래글 작성</button>
                    <button onClick={() => setMainTab('BOARD')} className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl ${mainTab === 'BOARD' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>자유게시판 글 작성</button>
                </div>

                {mainTab === 'TRADE' ? (
                    <form onSubmit={onCreateTradePost} className="space-y-3.5 text-xs md:text-sm">
                        <div>
                            <label className="block text-slate-400 mb-1 font-bold">카테고리</label>
                            <select value={newTradePost.category} onChange={(e) => setNewTradePost({ ...newTradePost, category: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none">
                                <option value="SELL">팝니다</option>
                                <option value="BUY">삽니다</option>
                                <option value="SPOT">사냥터자리</option>
                                <option value="PARTY">파티사냥</option>
                                <option value="EXPEDITION">원정대</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <input type="text" required placeholder="아이템명 (예: 노가다 목장갑)" value={newTradePost.itemName} onChange={(e) => setNewTradePost({ ...newTradePost, itemName: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />
                            <input type="text" required placeholder="수량 (예: 1개)" value={newTradePost.quantity} onChange={(e) => setNewTradePost({ ...newTradePost, quantity: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />
                        </div>

                        <input type="text" placeholder="옵션 (예: 공8 / 업횟 0회) - 선택사항" value={newTradePost.equipStats} onChange={(e) => setNewTradePost({ ...newTradePost, equipStats: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />

                        <input type="text" required placeholder="게시글 제목을 적어주세요" value={newTradePost.title} onChange={(e) => setNewTradePost({ ...newTradePost, title: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />

                        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                            <label className="block font-bold text-amber-400">💰 가격 단위 선택</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'MESO' })} className={`w-1/3 py-2.5 rounded-xl font-bold border transition-colors ${newTradePost.currencyType === 'MESO' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>메소만</button>
                                <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'CASH' })} className={`w-1/3 py-2.5 rounded-xl font-bold border transition-colors ${newTradePost.currencyType === 'CASH' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>현금만</button>
                                <button type="button" onClick={() => setNewTradePost({ ...newTradePost, currencyType: 'BOTH' })} className={`w-1/3 py-2.5 rounded-xl font-bold border transition-colors ${newTradePost.currencyType === 'BOTH' ? 'bg-purple-500 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>둘 다 가능</button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                {(newTradePost.currencyType === 'MESO' || newTradePost.currencyType === 'BOTH') && (
                                    <input type="text" placeholder="예: 4,500만 메소" value={newTradePost.priceMeso} onChange={(e) => setNewTradePost({ ...newTradePost, priceMeso: e.target.value })} className="w-full border rounded-xl p-2.5 bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500 focus:outline-none" />
                                )}
                                {(newTradePost.currencyType === 'CASH' || newTradePost.currencyType === 'BOTH') && (
                                    <input type="text" placeholder="예: 15,000원" value={newTradePost.priceCash} onChange={(e) => setNewTradePost({ ...newTradePost, priceCash: e.target.value })} className="w-full border rounded-xl p-2.5 bg-slate-900 border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none" />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            {/* 유저가 닉네임만 적어도 DB에는 자동 합체되어 저장됨 */}
                            <input type="text" required placeholder="내 캐릭터명" disabled value={newTradePost.character_name} onChange={(e) => setNewTradePost({ ...newTradePost, character_name: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 opacity-50 cursor-not-allowed" />
                            <input type="text" required placeholder="거래 장소 (자유입력)" value={newTradePost.location_or_boss} onChange={(e) => setNewTradePost({ ...newTradePost, location_or_boss: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />
                        </div>

                        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all">등록 완료</button>
                    </form>
                ) : (
                    <form onSubmit={onCreateBoardPost} className="space-y-3.5 text-xs md:text-sm">
                        <input type="text" required placeholder="글 제목" value={newBoardPost.title} onChange={(e) => setNewBoardPost({ ...newBoardPost, title: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />

                        <div className="flex flex-col gap-2">
                            <label className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500/60 p-2.5 rounded-xl text-center font-bold cursor-pointer text-amber-400 flex items-center justify-center gap-2 transition">
                                <Upload className="w-4 h-4" /> {newBoardPost.image_url ? '첨부 사진 변경' : '게시글에 사진 첨부 (선택)'}
                                <input type="file" accept="image/*" onChange={onBoardImageUpload} className="hidden" />
                            </label>
                            {newBoardPost.image_url && (
                                <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-48 w-full bg-slate-950 flex items-center justify-center">
                                    <img src={newBoardPost.image_url} alt="첨부됨" className="max-h-48 w-auto object-contain" />
                                    <button type="button" onClick={() => setNewBoardPost({ ...newBoardPost, image_url: '' })} className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-lg text-white hover:bg-black">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <textarea rows={5} required placeholder="내용을 입력하세요..." value={newBoardPost.content} onChange={(e) => setNewBoardPost({ ...newBoardPost, content: e.target.value })} className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none" />
                        <button type="submit" disabled={isUploadingImage} className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all disabled:opacity-50">
                            {isUploadingImage ? '사진 업로드 중...' : '게시글 작성'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}