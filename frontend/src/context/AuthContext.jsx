// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'sc_jwt'

function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        }
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const token = localStorage.getItem(TOKEN_KEY)
            if (!token) return null
            return decodeToken(token)
        } catch {
            return null
        }
    })

    const login = (token) => {
        localStorage.setItem(TOKEN_KEY, token)
        const user = decodeToken(token)
        setCurrentUser(user)
        return user
    }

    // Alias used by Member 4's OAuth2RedirectPage
    const loginWithToken = (token) => {
        return Promise.resolve(login(token))
    }

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY)
        setCurrentUser(null)
    }

    const getToken = () => localStorage.getItem(TOKEN_KEY)

    return (
        <AuthContext.Provider value={{
            currentUser,
            user: currentUser,      // ← alias for ProtectedRoute
            loading: false,         // ← ProtectedRoute checks this
            login,
            loginWithToken,
            logout,
            getToken,
            isAdmin: currentUser?.role === 'ADMIN',
            isUser: currentUser?.role === 'USER',
            isTechnician: currentUser?.role === 'TECHNICIAN',
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}