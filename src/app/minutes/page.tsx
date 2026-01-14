'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function MinutesListPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeetings() {
      // 최신 회의가 위로 오도록 정렬해서 가져오기11
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: false })

      if (!error) setMeetings(data || [])
      setLoading(false)
    }
    fetchMeetings()
  }, [])

  if (loading) return <div className="p-10 text-center text-slate-500">가족 회의록 불러오는 중...</div>

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">📋 회의록 목록</h2>
        <Link href="/minutes/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
          새로 쓰기
        </Link>
      </div>

      <div className="grid gap-4">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <Link href={`/minutes/${meeting.id}`} key={meeting.id}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 active:scale-[0.98] transition-transform">
                {/* 회의 장소 사진 (있을 경우만) */}
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                  {meeting.location_img ? (
                    <img src={meeting.location_img} alt="장소" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                  )}
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-blue-500 mb-1">
                    {meeting.meeting_date}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">
                    {meeting.meeting_date} 가족 회의
                  </h3>
                  <p className="text-sm text-slate-500 truncate w-48">
                    우리 가족의 소중한 기록을 확인하세요.
                  </p>
                </div>
                
                <div className="ml-auto flex items-center text-slate-300">
                  <span>❯</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">아직 등록된 회의록이 없어요.</p>
            <p className="text-slate-400 text-sm mt-1">첫 번째 회의록을 작성해 보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}