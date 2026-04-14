"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
    id: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("aevum_user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const login = async (email: string) => {
        const res = await fetch("http://localhost:8080/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        if (res.ok) {
            const data: User = await res.json();
            setUser(data);
            localStorage.setItem("aevum_user", JSON.stringify(data));
        } else {
             throw new Error("Erro no login provisório.");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("aevum_user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
