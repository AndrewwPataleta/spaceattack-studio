// Studio editor i18n. Keys ARE the Russian source strings (ru = identity, no ru dict needed) so wrapping a literal
// is just t("..."). Translations for the other langs live in studio-strings.json (ru->translation per locale).
// Shares the `studio_lang` localStorage key with the landing, so the language choice is one and the same.
import { useSyncExternalStore } from "react";
import STRINGS from "./studio-strings.json";

export type Lang = "ru" | "en" | "es" | "pt" | "de" | "fr" | "it" | "tr" | "id" | "ja" | "ko" | "zh";
export const LANGS: Lang[] = ["ru", "en", "es", "pt", "de", "fr", "it", "tr", "id", "ja", "ko", "zh"];
export const LANG_NAMES: Record<Lang, string> = { ru: "Русский", en: "English", es: "Español", pt: "Português", de: "Deutsch", fr: "Français", it: "Italiano", tr: "Türkçe", id: "Bahasa", ja: "日本語", ko: "한국어", zh: "中文" };

function detect(): Lang {
  try {
    const s = localStorage.getItem("studio_lang"); if (s && (LANGS as string[]).includes(s)) return s as Lang;
    return "en";
  } catch { return "en"; }
}

let lang: Lang = detect();
const subs = new Set<() => void>();
export function getLang(): Lang { return lang; }
export function setLang(l: Lang) { lang = l; try { localStorage.setItem("studio_lang", l); } catch { /* ignore */ } subs.forEach((f) => f()); }
// t(ru) → the translation for the current language (ru is identity; unknown strings fall back to the Russian source)
export function t(ru: string): string { if (lang === "ru") return ru; return (STRINGS as Record<string, Record<string, string>>)[lang]?.[ru] ?? ru; }
// hook: components call useLang() so they re-render when the language switches
export function useLang(): Lang { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => lang, () => lang); }
