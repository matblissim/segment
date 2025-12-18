import { createContext, useContext, useState, useEffect } from 'react';

const SportFilterContext = createContext();

export function SportFilterProvider({ children }) {
  const [sportFilter, setSportFilter] = useState(() => {
    return localStorage.getItem('sportFilter') || 'running';
  });

  useEffect(() => {
    localStorage.setItem('sportFilter', sportFilter);
  }, [sportFilter]);

  return (
    <SportFilterContext.Provider value={{ sportFilter, setSportFilter }}>
      {children}
    </SportFilterContext.Provider>
  );
}

export function useSportFilter() {
  const context = useContext(SportFilterContext);
  if (!context) {
    throw new Error('useSportFilter must be used within SportFilterProvider');
  }
  return context;
}
