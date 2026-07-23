import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }, []);

  return <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
