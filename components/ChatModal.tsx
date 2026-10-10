'use client';

import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';

interface ChatModalProps {
    activeChatTarget: any;
    chatMessages: any[];
    inputMessage: string;
    setInputMessage: (val: string) => void;
    chatScrollRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onSendMessage: (e: React.FormEvent) => void;
}

export default function ChatModal({
    activeChatTarget,
    chatMessages,
    inputMessage,
    setInputMessage,
    chatScrollRef,
    onClose,
    onSendMessage,
}: ChatModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md h-[650px] bg-[#ABC1D1] rounded-3xl flex flex-col justify-between relative shadow-2xl overflow-hidden border border-slate-700">
                <div className="bg-[#A0B4C4] px-5 py-4 flex justify-between items-center border-b border-black/10 text-[#191919]">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="hover:opacity-70">
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
                                <div className={`p-3 max-w-[75%] text-xs md:text-sm font-medium leading-relaxed shadow-sm ${isMe ? 'bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-none' : 'bg-white text-slate-900 rounded-2xl rounded-tl-none'}`}>
                                    {msg.text}
                                </div>
                                {!isMe && <span className="text-[10px] text-slate-700 font-medium mb-1">{msg.time}</span>}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white p-3 flex items-center gap-2 border-t border-black/5">
                    <form onSubmit={onSendMessage} className="flex-1 flex gap-2">
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
    );
}