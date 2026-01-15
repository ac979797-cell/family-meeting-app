'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth
    , isSameDay, addMonths, subMonths } from 'date-fns'
import ScheduleModal from '../../components/ScheduleModal'
import { supabase } from '../../lib/supabase'
// 수정 후

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // 1. 일정 데이터를 담을 상태
  const [schedules, setSchedules] = useState<any[]>([])
  //const supabase = createClient()

  // 2. Supabase에서 데이터 가져오는 함수
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
    
    if (error) {
      console.error('Error fetching schedules:', error)
    } else {
      setSchedules(data || [])
    }
  }

  // 3. 페이지 로드 시 & 월 이동 시 데이터 새로고침
  useEffect(() => {
    fetchSchedules()
  }, [currentMonth])

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
    setIsModalOpen(true)
  }

  const renderHeader = () => (
    <div className="flex justify-between items-center px-4 py-4 bg-white border-b">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-slate-400">◀</button>
      <h2 className="text-lg font-extrabold text-slate-800">{format(currentMonth, 'yyyy년 M월')}</h2>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-slate-400">▶</button>
    </div>
  )

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return (
      <div className="grid grid-cols-7 mb-2 border-b bg-slate-50">
        {days.map((day, i) => (
          <div key={i} className={`text-center py-2 text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd')
        const cloneDay = day

        // 4. 현재 날짜(day)에 해당하는 일정이 있는지 필터링
        const daySchedules = schedules.filter(s => isSameDay(new Date(s.start_at), cloneDay))

        days.push(
          <div 
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={`h-28 border-t border-r border-slate-100 p-1 transition-colors relative cursor-pointer hover:bg-slate-50
              ${!isSameMonth(day, monthStart) ? 'bg-slate-50/30 text-slate-300' : 'text-slate-700'}
              ${isSameDay(day, selectedDate) ? 'bg-blue-50' : 'bg-white'}
            `}
          >
            <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
              isSameDay(day, new Date()) ? 'bg-blue-500 text-white' : ''
            }`}>
              {formattedDate}
            </span>

            {/* 5. 일정 목록 표시 (최대 2~3개) */}
            <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
              {daySchedules.slice(0, 3).map((sched, idx) => (
                <div 
                  key={idx} 
                  className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-medium truncate"
                >
                  {sched.title}
                </div>
              ))}
              {daySchedules.length > 3 && (
                <div className="text-[8px] text-slate-400 pl-1">+{daySchedules.length - 3} 더보기</div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>)
      days = []
    }
    return <div className="border-l border-b border-slate-100">{rows}</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {isModalOpen && (
        <ScheduleModal 
          selectedDate={selectedDate} 
          onClose={() => setIsModalOpen(false)}
          onSave={fetchSchedules} // 6. 저장 완료 후 데이터 다시 불러오기
        />
      )}
    </div>
  )
}