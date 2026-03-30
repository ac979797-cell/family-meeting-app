'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function MeetingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<any>(null)
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraMode(true)
    } catch (err) {
      alert('카메라 접근에 실패했습니다.')
      console.error(err)
    }
  }

  // 카메라 정지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraMode(false)
  }

  // 사진 촬영
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
            setNewImageFile(file)
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  // 사진 저장
  const savePhoto = async () => {
    if (!newImageFile) return
    setIsSaving(true)
    try {
      let uploadFile: File | Blob = newImageFile
      let fileName = newImageFile.name

      // HEIC 변환 (필요시)
      if (newImageFile.name.toLowerCase().endsWith('.heic')) {
        const heic2any = (await import('heic2any')).default
        const convertedBlob = await heic2any({
          blob: newImageFile,
          toType: 'image/jpeg',
          quality: 0.8,
        })
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        fileName = newImageFile.name.replace(/\.[^/.]+$/, ".jpg")
        uploadFile = new File([blob], fileName, { type: 'image/jpeg' })
      }

      const upfileName = `location_${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('meeting_locations')
        .upload(upfileName, uploadFile)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('meeting_locations').getPublicUrl(upfileName)
      const publicUrl = data.publicUrl

      // 회의 데이터 업데이트
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ location_img: publicUrl })
        .eq('id', id)

      if (updateError) throw updateError

      // 상태 업데이트
      setMeeting({ ...meeting, location_img: publicUrl })
      setNewImageFile(null)
      setIsEditMode(false)
      alert('사진이 업데이트되었습니다!')
    } catch (err) {
      console.error(err)
      alert('사진 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

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
        <div className="flex gap-2">
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {meeting.meeting_date} 회의
          </span>
          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full"
            >
              ✏️ 사진 수정
            </button>
          )}
        </div>
      </div>

      {/* 장소 사진 */}
      <div className="mb-8">
        {isEditMode ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">📸 사진 수정</h3>
            
            {/* 현재 사진 미리보기 */}
            {meeting.location_img && (
              <div className="rounded-3xl overflow-hidden shadow-lg aspect-square">
                <img src={meeting.location_img} alt="현재 사진" className="w-full h-full object-cover" />
              </div>
            )}

            {/* 새 사진 미리보기 */}
            {newImageFile && (
              <div className="rounded-3xl overflow-hidden shadow-lg aspect-square">
                <img src={URL.createObjectURL(newImageFile)} alt="새 사진" className="w-full h-full object-cover" />
              </div>
            )}

            {/* 카메라 모드 */}
            {isCameraMode ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-3xl shadow-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold"
                  >
                    📸 촬영
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-slate-600 text-white py-3 rounded-xl font-bold"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 사진 업로드 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">사진 업로드</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* 카메라 촬영 버튼 */}
                <button
                  onClick={startCamera}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
                >
                  📷 카메라로 촬영
                </button>

                {/* 저장/취소 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={savePhoto}
                    disabled={!newImageFile || isSaving}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold disabled:bg-slate-400"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false)
                      setNewImageFile(null)
                      stopCamera()
                    }}
                    className="flex-1 bg-slate-600 text-white py-3 rounded-xl font-bold"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          meeting.location_img && (
            <div className="rounded-3xl overflow-hidden shadow-lg aspect-square">
              <img src={meeting.location_img} alt="회의 장소" className="w-full h-full object-cover" />
            </div>
          )
        )}
      </div>

      {/* 섹션별 출력 */}
      {renderSection("이 주의 이슈", "ISSUE", "🚩")}
      {renderSection("이 주의 안건", "AGENDA", "💡")}
      {renderSection("그 외 이슈", "ETC", "💬")}
      {renderSection("구매 리스트", "SHOPPING", "🛒")}

      {/* 삭제 버튼 (수정 모드가 아닐 때만) */}
      {!isEditMode && (
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
      )}
    </div>
  )
}