// src/components/ScheduleModal.tsx
'use client'

import { useState } from 'react'
//import { createClient } from '@/utils/supabase/client' // 본인의 supabase client 경로
import { supabase } from '../lib/supabase'
export default function ScheduleModal({ 
  selectedDate, 
  onClose, 
  onSave 
}: { 
  selectedDate: Date, 
  onClose: () => void, 
  onSave: () => void 
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('가족행사')
  const [loading, setLoading] = useState(false)
  

  const handleSave = async () => {
    if (!title) return alert('일정 제목을 입력해주세요!')
    
    setLoading(true)
    const { error } = await supabase
      .from('schedules')
      .insert([
        { 
          title, 
          category,
          start_at: selectedDate.toISOString(),
          description: "" // 필요시 추가 입력창 구현
        }
      ])

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      onSave() // 목록 새로고침 호출
      onClose() // 모달 닫기
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {selectedDate.toLocaleDateString()} 일정 추가
          </h3>
          <button onClick={onClose} className="text-slate-400 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">일정 내용</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 할머니 생신, 외식 등"
              className="w-full p-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">카테고리</label>
            <div className="flex gap-2">
              {['🏠 가족행사', '🍱 외식', '🧹 청소', '✈️ 여행'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    category === cat ? 'bg-blue-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition disabled:bg-slate-300"
          >
            {loading ? '저장 중...' : '일정 등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}