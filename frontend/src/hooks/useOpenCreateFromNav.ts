import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useOpenCreateFromNav(onOpen: () => void) {
  const location = useLocation()

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      onOpen()
      window.history.replaceState({}, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])
}
