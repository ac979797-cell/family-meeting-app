'use client'

import { useCallback, useEffect, useRef } from 'react'

const MESSAGE = '저장되지 않은 변경사항이 있습니다. 정말 뒤로 가시겠습니까?'

/** 저장 전 변경이 있는 화면에서 이탈 전 확인을 받습니다. */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const isRestoringHistoryRef = useRef(false)

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePopState = () => {
      if (!hasUnsavedChangesRef.current) return

      if (isRestoringHistoryRef.current) {
        isRestoringHistoryRef.current = false
        return
      }

      if (window.confirm(MESSAGE)) return

      // 뒤로가기로 이동한 히스토리를 현재 페이지로 되돌립니다.
      isRestoringHistoryRef.current = true
      window.history.go(1)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return useCallback(() => {
    return !hasUnsavedChangesRef.current || window.confirm(MESSAGE)
  }, [])
}
