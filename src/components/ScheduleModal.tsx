// src/components/ScheduleModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/lib/auth-context'

type ScheduleItem = {
  id?: string | number
  title: string
  category?: string | null
  description?: string | null
  start_at: string
  family_id?: string | null
}

const getCategoryClasses = (category?: string | null) => {
  if (category?.includes('가족')) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (category?.includes('외식')) return 'bg-orange-100 text-orange-700 border-orange-200'
  if (category?.includes('청소')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (category?.includes('여행')) return 'bg-sky-100 text-sky-700 border-sky-200'
  if (category?.includes('회의')) return 'bg-violet-100 text-violet-700 border-violet-200'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export default function ScheduleModal({
  selectedDate,
  daySchedules,
  onClose,
  onSave,
}: {
  selectedDate: Date
  daySchedules: ScheduleItem[]
  onClose: () => void
  onSave: () => void | Promise<void>
}) {
  const { familyId } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('🏠 가족행사')
  const [loading, setLoading] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)

  const resetForm = () => {
    setTitle('')
    setCategory('🏠 가족행사')
    setEditingSchedule(null)
  }

  const handleEdit = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule)
    setTitle(schedule.title)
    setCategory(schedule.category || '🏠 가족행사')
  }

  const handleDelete = async (schedule: ScheduleItem) => {
    if (!schedule.id) {
      alert('삭제할 일정 정보를 찾을 수 없어요.')
      return
    }

    const confirmed = window.confirm(`'${schedule.title}' 일정을 삭제할까요?`)
    if (!confirmed) return

    setLoading(true)
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id)

    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      await onSave()
      if (editingSchedule?.id === schedule.id) {
        resetForm()
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!title.trim()) return alert('일정 제목을 입력해주세요!')

    setLoading(true)

    const payload = {
      title: title.trim(),
      category,
      start_at: editingSchedule?.start_at || selectedDate.toISOString(),
      description: editingSchedule?.description || '',
      family_id: editingSchedule?.family_id || familyId,
    }

    if (!editingSchedule && !familyId) {
      alert('가족 정보가 없어서 일정을 저장할 수 없습니다.')
      setLoading(false)
      return
    }

    const query = editingSchedule?.id
      ? supabase.from('schedules').update(payload).eq('id', editingSchedule.id)
      : supabase.from('schedules').insert([payload])

    const { error } = await query

    if (error) {
      alert(`${editingSchedule ? '수정' : '저장'} 실패: ${error.message}`)
    } else {
      await onSave()
      resetForm()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {selectedDate.toLocaleDateString()} 일정
          </h3>
          <button onClick={onClose} className="text-slate-400 text-2xl">&times;</button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">등록된 일정</p>
            {daySchedules.length > 0 ? (
              <div className="space-y-2">
                {daySchedules.map((schedule, index) => (
                  <div
                    key={schedule.id ?? `${schedule.title}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{schedule.title}</p>
                        {schedule.description && (
                          <p className="mt-1 text-xs text-slate-500">{schedule.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${getCategoryClasses(schedule.category)}`}>
                        {schedule.category || '일정'}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        disabled={loading}
                        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(schedule)}
                        disabled={loading}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 disabled:opacity-60"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                이 날짜에는 아직 등록된 일정이 없어요.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">
                {editingSchedule ? '일정 수정' : '새 일정 추가'}
              </p>
              {editingSchedule && (
                <button
                  onClick={resetForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  수정 취소
                </button>
              )}
            </div>

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
              <div className="flex gap-2 flex-wrap">
                {['🏠 가족행사', '🍱 외식', '🧹 청소', '✈️ 여행'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-sm transition border ${
                      category === cat
                        ? `${getCategoryClasses(cat)} font-bold`
                        : 'bg-slate-100 text-slate-600 border-slate-200'
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
              {loading ? (editingSchedule ? '수정 중...' : '저장 중...') : (editingSchedule ? '일정 수정하기' : '일정 등록하기')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}