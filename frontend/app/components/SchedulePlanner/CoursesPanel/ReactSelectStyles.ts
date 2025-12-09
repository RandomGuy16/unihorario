import { StylesConfig } from "react-select";

// Simple function to detect if we're in dark mode
const isDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getReactSelectStyles = (): StylesConfig => {
  const dark = isDarkMode();
  
  return {
    control: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: dark ? "#404040" : "#ffffff",
      border: `1px solid ${dark ? "transparent" : "#d1d5db"}`,
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      color: dark ? "white" : "#1f2937",
      "&:hover": {
        borderColor: dark ? "rgb(90, 90, 90)" : "#9ca3af",
      },
    }),
    
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: dark ? "#303030" : "#ffffff",
      boxShadow: dark 
        ? "0 4px 8px rgba(0, 0, 0, 0.3)" 
        : "0 4px 8px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    
    option: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: state.isFocused 
        ? (dark ? "#4b5563" : "#f3f4f6") 
        : "transparent",
      color: dark ? "white" : "#1f2937",
      cursor: "pointer",
    }),
    
    singleValue: (baseStyles) => ({
      ...baseStyles,
      color: dark ? "white" : "#1f2937",
    }),
    
    input: (baseStyles) => ({
      ...baseStyles,
      color: dark ? "white" : "#1f2937",
    }),
    
    // Keep these minimal useful ones
    indicatorSeparator: () => ({ display: "none" }),
    
    dropdownIndicator: (baseStyles) => ({
      ...baseStyles,
      color: "#3b82f6",
    }),
  };
};

export default getReactSelectStyles;