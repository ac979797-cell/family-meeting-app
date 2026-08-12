'use client'

import { useCallback, useEffect, useRef } from 'react'

const MESSAGE = '저장되지 않은 변경사항이 있습니다. 정말 뒤로 가시겠습니까?'

/** 저장 전 변경이 있는 화면에서 이탈 전 확인을 받습니다. */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const hasHistoryGuardRef = useRef(false)
  const skipNextPopStateRef = useRef(false)
  const allowNavigationRef = useRef(false)

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!hasUnsavedChanges || hasHistoryGuardRef.current) return

    // Android의 시스템 뒤로가기를 먼저 이 지점에서 멈춰 확인할 수 있게 합니다.
    window.history.pushState({ unsavedChangesGuard: true }, '', window.location.href)
    hasHistoryGuardRef.current = true
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePopState = () => {
      if (!hasHistoryGuardRef.current) return

      if (skipNextPopStateRef.current) {
        skipNextPopStateRef.current = false
        return
      }

      if (!hasUnsavedChangesRef.current) {
        skipNextPopStateRef.current = true
        window.history.back()
        return
      }

      if (window.confirm(MESSAGE)) {
        // 시스템 뒤로가기는 보호용 히스토리 지점만 이동시켰으므로,
        // 실제 이전 화면으로 한 번 더 이동합니다.
        skipNextPopStateRef.current = true
        window.history.back()
        return
      }

      // 취소하면 현재 화면을 다시 보호용 히스토리 지점으로 되돌립니다.
      window.history.pushState({ unsavedChangesGuard: true }, '', window.location.href)
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
    if (confirmed) {
      allowNavigationRef.current = true
      // 화면 안의 router.back() 호출은 한 번의 뒤로가기만 허용합니다.
      skipNextPopStateRef.current = true
    }
    return confirmed
  }, [])
}
