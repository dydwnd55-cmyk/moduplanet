'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Upload, Check, User } from 'lucide-react';

const AVATAR_OPTIONS = ['🍁', '👑', '🥊', '🧙‍♂️', '⚡', '📜', '💎', '🔥'];

interface ProfileModalProps {
    userProfile: { id: string; name: string; avatar: string };
    isDarkMode: boolean;
    onClose: () => void;
    onSuccess: (updatedProfile: { name: string; avatar: string }) => void;
}

export default function ProfileModal({ userProfile, isDarkMode, onClose, onSuccess }: ProfileModalProps) {
    const [name, setName] = useState(userProfile.name || '');
    const [avatar, setAvatar] = useState(userProfile.avatar || '🍁');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 📸 이미지 1:1 정방향 중앙 자르기 & 리사이징 (Canvas)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('5MB 이하의 이미지만 업로드 가능합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 200; // 200x200 고해상도 정사각형
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    const minSide = Math.min(img.width, img.height);
                    const sx = (img.width - minSide) / 2;
                    const sy = (img.height - minSide) / 2;

                    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
                    const resizedDataUrl = canvas.toDataURL('image/webp', 0.85);
                    setAvatar(resizedDataUrl);
                }
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    character_name: name,
                    avatar: avatar,
                },
            });

            if (error) throw error;

            onSuccess({ name, avatar });
            alert('프로필이 성공적으로 변경되었습니다!');
            onClose();
        } catch (err: any) {
            alert('프로필 변경 에러: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const renderAvatarPreview = (src: string) => {
        if (src && (src.startsWith('http') || src.startsWith('data:image'))) {
            return <img src={src} alt="Avatar" className="w-full h-full object-cover" />;
        }
        return <span className="text-3xl">{src || '🍁'}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl p-6 max-w-md w-full space-y-5 relative shadow-2xl ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-200"><X className="w-6 h-6" /></button>

                <div className="flex items-center gap-3 border-b border-slate-700/80 pb-4">
                    <div className="w-14 h-14 overflow-hidden rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        {renderAvatarPreview(avatar)}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-amber-400">내 프로필 설정</h3>
                        <p className="text-xs text-slate-400">대표 캐릭터명과 프로필 사진을 변경합니다.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
                    {/* 프로필 이미지 선택 */}
                    <div className="space-y-2">
                        <label className="block text-slate-400 font-bold">프로필 사진 등록</label>
                        <label className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500/60 p-3 rounded-xl text-center font-bold cursor-pointer text-amber-400 flex items-center justify-center gap-2 transition">
                            <Upload className="w-4 h-4" /> 내 사진 업로드 (자동 1:1 정비율 자르기)
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>

                        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
                            {AVATAR_OPTIONS.map((av) => (
                                <button
                                    type="button"
                                    key={av}
                                    onClick={() => setAvatar(av)}
                                    className={`p-2.5 rounded-xl border text-xl transition-all shrink-0 ${avatar === av ? 'bg-amber-500/20 border-amber-500 scale-105' : 'bg-slate-900 border-slate-800'}`}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 캐릭터명 입력 */}
                    <div>
                        <label className="block text-slate-400 mb-1 font-bold">대표 캐릭터명</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded-xl p-3 bg-slate-900 border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-amber-500 hover:bg-amber-400 font-extrabold py-3.5 rounded-2xl text-slate-950 text-sm md:text-base shadow-md transition-all mt-2 flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" /> 저장 완료
                    </button>
                </form>
            </div>
        </div>
    );
}