import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const stored = localStorage.getItem("hotel-theme");
        if (stored === "light" || stored === "dark") {
            return stored;
        }
        // Fall back to system preference
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });
    useEffect(() => {
        // Update DOM and localStorage
        const html = document.documentElement;
        if (theme === "dark") {
            html.classList.add("dark");
        }
        else {
            html.classList.remove("dark");
        }
        localStorage.setItem("hotel-theme", theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };
    return (<ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
//# sourceMappingURL=theme-provider.jsx.map