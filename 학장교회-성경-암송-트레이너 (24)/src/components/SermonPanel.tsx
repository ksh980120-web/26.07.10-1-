/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, User, BookOpen, Video, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { Sermon } from '../types';

interface SermonPanelProps {
  sermons: Sermon[];
}

export default function SermonPanel({ sermons = [] }: SermonPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSermonId, setExpandedSermonId] = useState<string | null>(null);

  // Filter out any soft-deleted sermons or those with empty content
  const activeSermons = sermons.filter(s => {
    if (!s.isActive) return false;
    // Handle soft delete prefix
    if (s.content && s.content.startsWith('__DELETED__')) return false;
    return true;
  });

  const filteredSermons = activeSermons.filter(s => {
    const titleMatch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    const preacherMatch = (s.preacher || '').toLowerCase().includes(searchTerm.toLowerCase());
    const passageMatch = (s.passage || '').toLowerCase().includes(searchTerm.toLowerCase());
    const contentMatch = s.content.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || preacherMatch || passageMatch || contentMatch;
  });

  const toggleExpand = (id: string) => {
    setExpandedSermonId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Header */}
      <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-serif font-black text-[#5A5A40] flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#8A9A5B]" />
            설교요약
          </h3>
          <p className="text-xs text-[#7A7A6A] mt-1">
            예수교장로회 한국총공회 학장교회의 은혜로운 설교내용을 다시 읽고 묵상해보세요.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="제목, 본문, 설교자 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-[#A0A090]" />
        </div>
      </div>

      {/* Sermons List */}
      <div className="space-y-4">
        {filteredSermons.length === 0 ? (
          <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-12 text-center space-y-3 shadow-sm">
            <Mic className="w-8 h-8 text-[#A0A090] mx-auto animate-pulse" />
            <p className="text-sm font-medium text-[#7A7A6A] font-serif">
              {searchTerm ? '검색어와 일치하는 설교요약이 없습니다.' : '등록된 설교요약이 아직 없습니다.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-[#8A9A5B] font-bold hover:underline"
              >
                검색 조건 초기화
              </button>
            )}
          </div>
        ) : (
          filteredSermons.map((sermon) => {
            const isExpanded = expandedSermonId === sermon.id;
            const rawPreacher = sermon.preacher || '';
            const [preacherName, sermonCategory] = rawPreacher.includes('|') ? rawPreacher.split('|') : [rawPreacher, '주일예배'];

            return (
              <div
                key={sermon.id}
                className="bg-white border border-[#E9E3D8] hover:border-[#8A9A5B]/30 rounded-[24px] p-6 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden"
              >
                {/* Visual accent left line */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#8A9A5B]/20" />

                <div className="space-y-4 pl-1.5">
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[#F5F2EB] pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8A9A5B] bg-[#8A9A5B]/10 px-2.5 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {sermon.date}
                        </span>
                        {sermonCategory && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] text-[#5A5A40] px-2.5 py-0.5 rounded-full border border-[#8A9A5B]/20">
                            🏷️ {sermonCategory}
                          </span>
                        )}
                        {preacherName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A5A40] bg-[#F5F5F0] px-2.5 py-0.5 rounded-full border border-[#E9E3D8]/60">
                            <User className="w-3 h-3 text-[#8A9A5B]" />
                            {preacherName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-serif font-black text-[#5A5A40] pt-1">
                        {sermon.title}
                      </h4>
                    </div>

                    {sermon.url && (
                      <a
                        href={sermon.url}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[11px] font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>설교 영상 보기</span>
                      </a>
                    )}
                  </div>

                  {sermon.passage && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#7A7A6A] bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E9E3D8]/50">
                      <BookOpen className="w-4 h-4 text-[#8A9A5B]" />
                      <span>본문 말씀: {sermon.passage}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div
                      className={`text-xs text-[#5A5A50] font-serif leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}
                    >
                      {sermon.content}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(sermon.id)}
                      className="text-[11px] text-[#8A9A5B] hover:text-[#78884F] font-bold flex items-center gap-1 mt-1 cursor-pointer transition select-none"
                    >
                      <span>{isExpanded ? '요약 내용 접기' : '전체 요약 펼쳐서 읽기'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
