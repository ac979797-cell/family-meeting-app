'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const getLocalDateKey = (value: string | Date) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function MeetingDetailPageContent() {
  const { id } = useParams()
  const { familyId, loading: authLoading } = useAuth()
  const router = useRouter()
  const [meeting, setMeeting] = useState<any>(null)
  const [details, setDetails] = useState<any[]>([])
  const [editableDetails, setEditableDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isContentEditMode, setIsContentEditMode] = useState(false)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isContentSaving, setIsContentSaving] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 이미지 압축 함수
  const compressImage = (file: File | Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file as Blob) // fallback
          return
        }
        // 최대 크기 설정 (800px)
        const maxWidth = 800
        const maxHeight = 800
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            resolve(file as Blob) // fallback
          }
        }, 'image/jpeg', 0.8)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  useEffect(() => {
    async function fetchFullMeetingData() {
      if (authLoading) return

      const meetingId = Array.isArray(id) ? id[0] : id

      if (!meetingId || !familyId) {
        setMeeting(null)
        setDetails([])
        setLoading(false)
        return
      }

      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('family_id', familyId)
        .maybeSingle()

      if (meetingError) {
        console.error('회의 상세 조회 오류:', meetingError)
        setLoading(false)
        return
      }

      if (!meetingData) {
        setMeeting(null)
        setDetails([])
        setLoading(false)
        return
      }

      const { data: detailsData, error: detailsError } = await supabase
        .from('meeting_details')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('sort_order', { ascending: true })

      if (detailsError) {
        console.error('회의 상세 항목 조회 오류:', detailsError)
      }

      setMeeting(meetingData)
      setDetails(detailsData || [])
      setEditableDetails((detailsData || []).map((item) => ({ ...item })))
      setLoading(false)
    }

    void fetchFullMeetingData()
  }, [id, familyId, authLoading])

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

      // 이미지 압축
      const compressedBlob = await compressImage(uploadFile instanceof File ? uploadFile : new File([uploadFile], fileName, { type: 'image/jpeg' }))
      uploadFile = compressedBlob
      fileName = `compressed_${Date.now()}.jpg`

      const upfileName = `location_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('meeting_locations')
        .upload(upfileName, uploadFile)

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('meeting_locations').getPublicUrl(upfileName)
      const publicUrl = data.publicUrl

      const meetingId = Array.isArray(id) ? id[0] : id
      if (!meetingId || !familyId) {
        throw new Error('가족 정보가 없어 사진을 수정할 수 없습니다.')
      }

      // 회의 데이터 업데이트
      const { error: updateError } = await supabase
        .from('meetings')
        .update({ location_img: publicUrl })
        .eq('id', meetingId)
        .eq('family_id', familyId)

      console.log('사진업데이트결과', {updateError, publicUrl, meetingId, familyId
      })
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

  if (authLoading || loading) return <div className="p-10 text-center">기록 읽어오는 중...</div>
  if (!meeting) return <div className="p-10 text-center">가족 회의록을 찾을 수 없습니다.</div>

  const canEditMeetingContent = getLocalDateKey(meeting.meeting_date) === getLocalDateKey(new Date())

  const handleContentChange = (detailId: string, nextValue: string) => {
    setEditableDetails((prev) =>
      prev.map((detail) => (detail.id === detailId ? { ...detail, content: nextValue } : detail))
    )
  }

  const handleSaveContent = async () => {
    if (!canEditMeetingContent) {
      alert('회의록 내용은 회의 당일에만 수정할 수 있습니다.')
      return
    }

    const changedItems = editableDetails.filter((item) => {
      const original = details.find((detail) => detail.id === item.id)
      return original?.content !== item.content
    })

    if (changedItems.length === 0) {
      setIsContentEditMode(false)
      return
    }

    setIsContentSaving(true)

    try {
      for (const item of changedItems) {
        const { error } = await supabase
          .from('meeting_details')
          .update({ content: item.content })
          .eq('id', item.id)
          .eq('meeting_id', meeting.id)

        if (error) throw error
      }

      setDetails(editableDetails.map((item) => ({ ...item })))
      setIsContentEditMode(false)
      alert('회의록 내용이 수정되었습니다!')
    } catch (error: any) {
      console.error(error)
      alert('회의록 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setIsContentSaving(false)
    }
  }

  // 타입별로 데이터 분류하기
  const renderSection = (title: string, type: string, emoji: string) => {
    const source = isContentEditMode ? editableDetails : details
    const items = source.filter(d => d.item_type === type)
    if (items.length === 0) return null

    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
        <ul className="space-y-2">
          {items.map((item: any, idx: number) => (
            <li key={item.id ?? idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-slate-700">
              {isContentEditMode ? (
                <textarea
                  value={item.content || ''}
                  onChange={(e) => handleContentChange(item.id, e.target.value)}
                  rows={3}
                  disabled={isContentSaving}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                item.content
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      {/* 헤더 섹션 */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <button onClick={() => router.back()} className="text-slate-400">← 뒤로가기</button>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {meeting.meeting_date} 회의
          </span>
          {!isEditMode && !isContentEditMode && canEditMeetingContent && (
            <button
              onClick={() => {
                setEditableDetails(details.map((item) => ({ ...item })))
                setIsContentEditMode(true)
              }}
              className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full"
            >
              📝 내용 수정
            </button>
          )}
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

      {!canEditMeetingContent && !isContentEditMode && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          회의록 내용 수정과 삭제는 회의 당일에만 가능합니다. 사진 수정은 지금처럼 언제든 할 수 있어요.
        </div>
      )}

      {isContentEditMode && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700 mb-3">회의록 내용을 수정한 뒤 저장해주세요.</p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveContent}
              disabled={isContentSaving}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:bg-slate-400"
            >
              {isContentSaving ? '저장 중...' : '내용 저장'}
            </button>
            <button
              onClick={() => {
                setEditableDetails(details.map((item) => ({ ...item })))
                setIsContentEditMode(false)
              }}
              disabled={isContentSaving}
              className="flex-1 rounded-xl bg-slate-200 py-3 text-sm font-bold text-slate-700"
            >
              취소
            </button>
          </div>
        </div>
      )}

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

      {/* 삭제 버튼 (수정 모드가 아니고 당일 기록일 때만) */}
      {!isEditMode && !isContentEditMode && canEditMeetingContent && (
        <button 
          onClick={async () => {
            if (!canEditMeetingContent) {
              alert('지난 회의는 삭제할 수 없습니다.')
              return
            }

            if(confirm('정말 삭제하시겠습니까?')) {
              const meetingId = Array.isArray(id) ? id[0] : id

              if (!meetingId || !familyId) {
                alert('삭제 권한을 확인할 수 없습니다.')
                return
              }

              const { error } = await supabase
                .from('meetings')
                .delete()
                .eq('id', meetingId)
                .eq('family_id', familyId)

              if (error) {
                alert('삭제에 실패했습니다: ' + error.message)
                return
              }

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

export default function MeetingDetailPage() {
  return (
    <ProtectedRoute>
      <MeetingDetailPageContent />
    </ProtectedRoute>
  )
}