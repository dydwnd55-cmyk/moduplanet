'use client';

import React, { useState } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfileModalProps {
    userProfile: { id: string; name: string; avatar: string; user_code?: string };
    isDarkMode: boolean;
    onClose: () => void;
    onSuccess: (updated: any) => void;
}

export default function ProfileModal({ userProfile, isDarkMode, onClose, onSuccess }: ProfileModalProps) {
    const [profileName, setProfileName] = useState(userProfile.name);
    const [profileAvatar, setProfileAvatar] = useState(userProfile.avatar);
    const [isUploading, setIsUploading] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('이미지 용량은 2MB 이하로 업로드해주세요.');
            return;
        }

        setIsUploading(true);
        try {
            const filePath = `avatars/${userProfile.id}_${Date.now()}`;
            const { error } = await supabase.storage.from('profiles').upload(filePath, file, { upsert: true });
            if (error) throw error;

            const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
            setProfileAvatar(data.publicUrl);
        } catch (err: any) {
            alert('업로드 실패: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileName.trim()) return alert('캐릭터명을 입력해주세요.');

        // profiles 테이블 업데이트
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ character_name: profileName, avatar: profileAvatar })
            .eq('id', userProfile.id);

        // Auth 메타데이터 업데이트 (호환성 유지)
        const { error: authError } = await supabase.auth.updateUser({
            data: { character_name: profileName, avatar: profileAvatar }
        });

        if (profileError || authError) {
            alert('프로필 업데이트 실패');
        } else {
            alert('프로필이 저장되었습니다.');
            onSuccess({ name: profileName, avatar: profileAvatar });
            onClose();
        }
    };

    const renderAvatar = (src: string) => {
        if (src && (src.startsWith('http') || src.startsWith('data:image'))) {
            return <img src={src} alt="Avatar" className="w-full h-full object-cover" />;
        }
        return <span className="text-4xl">{src || '🍁'}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`border rounded-3xl p-7 max-w-sm w-full space-y-6 shadow-2xl relative ${isDarkMode ? 'bg-[#222631] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-200 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                <div>
                    <h3 className="text-xl font-black">내 프로필 설정</h3>
                    <p className="text-xs text-slate-400 mt-1">플래닛에서 사용될 정보를 수정합니다.</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden shadow-lg transition-transform group-hover:scale-105">
                            {renderAvatar(profileAvatar)}
                        </div>
                        <label className="absolute bottom-[-10px] right-[-10px] bg-amber-500 p-2.5 rounded-full text-slate-950 cursor-pointer shadow-lg hover:bg-amber-400 transition-colors">
                            <Upload className="w-4 h-4" />
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} className="hidden" />
                        </label>
                    </div>
                    {isUploading && <span className="text-xs text-amber-400 animate-pulse font-bold">이미지 업로드 중...</span>}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">고유 식별 번호 (자동 부여)</label>
                        <div className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-400 text-sm font-mono font-bold flex items-center justify-between">
                            <span>{userProfile.user_code || '#????'}</span>
                            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-lg">변경 불가</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">메이플 캐릭터명 (필수)</label>
                        <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full border rounded-xl p-3.5 bg-slate-900 border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button onClick={handleSaveProfile} disabled={isUploading} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md">
                        <Check className="w-5 h-5" /> 프로필 저장 완료
                    </button>
                </div>
            </div>
        </div>
    );
}