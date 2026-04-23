import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { notificationApi } from '../services/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshCount = useCallback(async () => {
    if (!user?.userId) return
    try {
      const data = await notificationApi.getUnreadCount(user.userId)
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // silently ignore — no toast spam for background polling
    }
  }, [user?.userId])

  useEffect(() => {
    refreshCount()
    const id = setInterval(refreshCount, 30000)
    return () => clearInterval(id)
  }, [refreshCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
