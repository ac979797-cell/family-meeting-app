'use client'

import { useCallback, useEffect, useRef } from 'react'

const MESSAGE = '저장되지 않은 변경사항이 있습니다. 정말 뒤로 가시겠습니까?'

/** 저장 전 변경이 있는 화면에서 이탈 전 확인을 받습니다. */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const isRestoringHistoryRef = useRef(false)
  const allowNavigationRef = useRef(false)

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePopState = () => {
      if (!hasUnsavedChangesRef.current) return

      if (allowNavigationRef.current) {
        allowNavigationRef.current = false
        return
      }

      if (isRestoringHistoryRef.current) {
        isRestoringHistoryRef.current = false
        return
      }

      if (window.confirm(MESSAGE)) {
        allowNavigationRef.current = true
        return
      }

      // 뒤로가기로 이동한 히스토리를 현재 페이지로 되돌립니다.
      isRestoringHistoryRef.current = true
      window.history.go(1)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    const handleLinkClick = (event: MouseEvent) => {
      if (!hasUnsavedChangesRef.current || event.defaultPrevented) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = (event.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)
      const current = new URL(window.location.href)
      const isSameScreen =
        destination.origin === current.origin &&
        destination.pathname === current.pathname &&
        destination.search === current.search

      if (isSameScreen) return

      event.preventDefault()
      event.stopPropagation()

      if (window.confirm(MESSAGE)) {
        // Link의 기본 이동은 막았으므로, 확인 후 명시적으로 화면을 전환합니다.
        allowNavigationRef.current = true
        window.location.assign(destination.href)
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [])

  return useCallback(() => {
    if (!hasUnsavedChangesRef.current) return true

    const confirmed = window.confirm(MESSAGE)
    if (confirmed) allowNavigationRef.current = true
    return confirmed
  }, [])
}
