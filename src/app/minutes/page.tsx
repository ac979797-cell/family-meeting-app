'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

interface MeetingWithDetails {
  id: string
  meeting_date: string
  location_img?: string
  details: Array<{
    item_type: string
    content: string
  }>
}

export default function MinutesListPage() {
  const [allMeetings, setAllMeetings] = useState<MeetingWithDetails[]>([])
  const [filteredMeetings, setFilteredMeetings] = useState<MeetingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    async function fetchMeetingsWithDetails() {
      setLoading(true)

      // 검색어가 있는 경우와 없는 경우를 구분하여 처리
      let query = supabase
        .from('meetings')
        .select('*', { count: 'exact' })
        .order('meeting_date', { ascending: false })

      if (searchQuery.trim()) {
        // 검색 시 모든 데이터를 가져와서 클라이언트 사이드에서 필터링
        const { data: allData, error, count } = await query

        if (error) {
          console.error('회의 데이터 로딩 오류:', error)
          setLoading(false)
          return
        }

        // 모든 회의의 상세 내용 가져오기
        const meetingsWithDetails: MeetingWithDetails[] = await Promise.all(
          (allData || []).map(async (meeting) => {
            const { data: detailsData } = await supabase
              .from('meeting_details')
              .select('item_type, content')
              .eq('meeting_id', meeting.id)

            return {
              ...meeting,
              details: detailsData || []
            }
          })
        )

        // 클라이언트 사이드에서 검색 필터링
        const queryLower = searchQuery.toLowerCase()
        const filtered = meetingsWithDetails.filter(meeting => {
          if (meeting.meeting_date.toLowerCase().includes(queryLower)) {
            return true
          }
          return meeting.details.some(detail =>
            detail.content.toLowerCase().includes(queryLower)
          )
        })

        setTotalCount(filtered.length)
        setAllMeetings(meetingsWithDetails)

        // 현재 페이지에 맞는 데이터 슬라이싱
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setFilteredMeetings(filtered.slice(startIndex, endIndex))
      } else {
        // 검색어가 없는 경우 서버 사이드 페이징
        const from = (currentPage - 1) * itemsPerPage
        const to = from + itemsPerPage - 1

        const { data: meetingsData, error, count } = await query
          .range(from, to)

        if (error) {
          console.error('회의 데이터 로딩 오류:', error)
          setLoading(false)
          return
        }

        setTotalCount(count || 0)

        // 현재 페이지의 회의 상세 내용만 가져오기
        const meetingsWithDetails: MeetingWithDetails[] = await Promise.all(
          (meetingsData || []).map(async (meeting) => {
            const { data: detailsData } = await supabase
              .from('meeting_details')
              .select('item_type, content')
              .eq('meeting_id', meeting.id)

            return {
              ...meeting,
              details: detailsData || []
            }
          })
        )

        setAllMeetings(meetingsWithDetails)
        setFilteredMeetings(meetingsWithDetails)
      }

      setLoading(false)
    }
    fetchMeetingsWithDetails()
  }, [currentPage, searchQuery])

  // 검색 기능
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMeetings(allMeetings)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allMeetings.filter(meeting => {
      // 회의 날짜 검색
      if (meeting.meeting_date.toLowerCase().includes(query)) {
        return true
      }

      // 상세 내용에서 검색 (안건, 이슈, 기타 등 모든 내용)
      return meeting.details.some(detail =>
        detail.content.toLowerCase().includes(query)
      )
    })

    setFilteredMeetings(filtered)
  }, [currentPage, searchQuery])

  // 검색어 변경 시 첫 페이지로 리셋
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  if (loading) return <div className="p-10 text-center text-slate-500">가족 회의록 불러오는 중...</div>

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">📋 회의록 목록</h2>
        <Link href="/minutes/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
          새로 쓰기
        </Link>
      </div>

      {/* 검색 입력 필드 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="회의록 검색... (날짜, 안건, 이슈 등)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-slate-500 mt-2">
            "{searchQuery}" 검색 결과: {totalCount}개 (페이지 {currentPage} / {totalPages})
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting) => (
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

                <div className="flex flex-col justify-center flex-1">
                  <span className="text-xs font-bold text-blue-500 mb-1">
                    {meeting.meeting_date}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">
                    {meeting.meeting_date} 가족 회의
                  </h3>

                  {/* 검색된 내용 미리보기 */}
                  {searchQuery && (
                    <div className="mt-2 space-y-1">
                      {meeting.details
                        .filter(detail => detail.content.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice(0, 2) // 최대 2개만 표시
                        .map((detail, idx) => (
                          <div key={idx} className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                            <span className="font-medium">
                              {detail.item_type === 'ISSUE' && '🚩'}
                              {detail.item_type === 'AGENDA' && '💡'}
                              {detail.item_type === 'ETC' && '💬'}
                              {detail.item_type === 'SHOPPING' && '🛒'}
                            </span>
                            <span className="ml-1 truncate block">
                              {detail.content.length > 30
                                ? `${detail.content.substring(0, 30)}...`
                                : detail.content
                              }
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {!searchQuery && (
                    <p className="text-sm text-slate-500 truncate">
                      {meeting.details.length > 0
                        ? `${meeting.details.length}개의 항목`
                        : '우리 가족의 소중한 기록을 확인하세요.'
                      }
                    </p>
                  )}
                </div>

                <div className="ml-auto flex items-center text-slate-300">
                  <span>❯</span>
                </div>
              </div>
            </Link>
          ))
        ) : searchQuery ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">🔍 검색 결과가 없어요.</p>
            <p className="text-slate-400 text-sm mt-1">다른 검색어로 시도해보세요.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-600"
            >
              검색어 지우기
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">아직 등록된 회의록이 없어요.</p>
            <p className="text-slate-400 text-sm mt-1">첫 번째 회의록을 작성해 보세요!</p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            {/* 이전 페이지 버튼 */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ‹ 이전
            </button>

            {/* 페이지 번호들 */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            {/* 다음 페이지 버튼 */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 ›
            </button>
          </div>
        </div>
      )}

      {/* 페이지 정보 */}
      {totalCount > 0 && (
        <div className="mt-4 text-center text-sm text-slate-500">
          총 {totalCount}개의 회의록 중 {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
        </div>
      )}
    </div>
  )
}