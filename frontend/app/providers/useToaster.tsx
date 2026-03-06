"use client";
import { Toaster } from 'sonner';
import { useTheme } from "@/app/providers/useTheme";

export function ToasterProvider() {
  const theme = useTheme().theme
  return (
    <Toaster theme={!theme ? 'system' : theme}/>
  )
}
