'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function MeetingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<any>(null)
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFullMeetingData() {
      // 1. 메인 회의 정보 가져오기
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()

      // 2. 해당 회의의 모든 상세 항목 가져오기
      const { data: detailsData } = await supabase
        .from('meeting_details')
        .select('*')
        .eq('meeting_id', id)
        .order('sort_order', { ascending: true })

      setMeeting(meetingData)
      setDetails(detailsData || [])
      setLoading(false)
    }
    if (id) fetchFullMeetingData()
  }, [id])

  if (loading) return <div className="p-10 text-center">기록 읽어오는 중...</div>
  if (!meeting) return <div className="p-10 text-center">기록을 찾을 수 없습니다.</div>

  // 타입별로 데이터 분류하기
  const renderSection = (title: string, type: string, emoji: string) => {
    const items = details.filter(d => d.item_type === type)
    if (items.length === 0) return null; // 데이터 없으면 섹션 숨김

    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
        <ul className="space-y-2">
          {items.map((item: any, idx: number) => (
            <li key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-slate-700">
              {item.content}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      {/* 헤더 섹션 */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-slate-400">← 뒤로가기</button>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {meeting.meeting_date} 회의
        </span>
      </div>

      {/* 장소 사진 (있을 경우만) */}
      {meeting.location_img && (
        <div className="mb-8 rounded-3xl overflow-hidden shadow-lg aspect-video">
          <img src={meeting.location_img} alt="회의 장소" className="w-full h-full object-cover" />
        </div>
      )}

      {/* 섹션별 출력 */}
      {renderSection("이 주의 이슈", "ISSUE", "🚩")}
      {renderSection("이 주의 안건", "AGENDA", "💡")}
      {renderSection("그 외 이슈", "ETC", "💬")}
      {renderSection("구매 리스트", "SHOPPING", "🛒")}

      {/* 삭제 버튼 (선택 사항) */}
      <button 
        onClick={async () => {
          if(confirm('정말 삭제하시겠습니까?')) {
            await supabase.from('meetings').delete().eq('id', id)
            router.push('/minutes')
          }
        }}
        className="w-full mt-10 py-4 text-red-400 text-sm font-medium"
      >
        이 기록 삭제하기
      </button>
    </div>
  )
}