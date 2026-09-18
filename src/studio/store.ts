// Studio store — the single runtime state for the level editor: the LevelDoc, current selection & tool, plus
// undo/redo history and localStorage autosave. Plain module + useSyncExternalStore hook (no external dep).
import { useSyncExternalStore } from "react";
import { LevelDoc, LS_KEY, cloneDoc, deserialize, loadDoc, serialize, starterDoc } from "../game/levels/levelDoc";

export type Tool = "select" | "add-plat" | "add-ramp" | "add-ladder" | "add-decor";
// selection is a LIST (multi-select). The PRIMARY (last) id drives the single-object inspector.
export type State = { doc: LevelDoc; selection: string[]; tool: Tool; linkFrom: string | null };

let state: State = { doc: loadDoc(), selection: [], tool: "select", linkFrom: null };
let past: LevelDoc[] = [];
let future: LevelDoc[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const persist = () => { try { localStorage.setItem(LS_KEY, serialize(state.doc)); } catch { /* ignore */ } };

export const getState = () => state;
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function useStudio(): State { return useSyncExternalStore(subscribe, getState, getState); }

// mutate WITH an undo checkpoint (normal edits)
export function commit(mut: (d: LevelDoc) => void) {
  past.push(cloneDoc(state.doc)); if (past.length > 200) past.shift(); future = [];
  const d = cloneDoc(state.doc); mut(d); state = { ...state, doc: d }; persist(); emit();
}
// snapshot for a drag: call once at drag start, then mutate() freely with no extra history
export function beginHistory() { past.push(cloneDoc(state.doc)); if (past.length > 200) past.shift(); future = []; }
// mutate WITHOUT a checkpoint (used mid-drag after a single beginHistory)
export function mutate(mut: (d: LevelDoc) => void) {
  const d = cloneDoc(state.doc); mut(d); state = { ...state, doc: d }; persist(); emit();
}

export function setSelection(id: string | null) { const next = id ? [id] : []; if (state.selection.join() !== next.join()) { state = { ...state, selection: next }; emit(); } }
export function setSelectionMany(ids: string[]) { const next = ids.filter((v, i) => ids.indexOf(v) === i); if (state.selection.join() !== next.join()) { state = { ...state, selection: next }; emit(); } }
export function toggleSelection(id: string) { const has = state.selection.includes(id); state = { ...state, selection: has ? state.selection.filter((x) => x !== id) : [...state.selection, id] }; emit(); }
export function isSelected(id: string) { return state.selection.includes(id); }
export function setTool(t: Tool) { state = { ...state, tool: t, linkFrom: null }; emit(); }
export function setLinkFrom(id: string | null) { state = { ...state, linkFrom: id }; emit(); }

export function canUndo() { return past.length > 0; }
export function canRedo() { return future.length > 0; }
export function undo() { if (!past.length) return; future.push(cloneDoc(state.doc)); state = { ...state, doc: past.pop()! }; persist(); emit(); }
export function redo() { if (!future.length) return; past.push(cloneDoc(state.doc)); state = { ...state, doc: future.pop()! }; persist(); emit(); }

export function replaceDoc(d: LevelDoc) { past.push(cloneDoc(state.doc)); future = []; state = { ...state, doc: d, selection: [], linkFrom: null }; persist(); emit(); }
export function resetDoc() { replaceDoc(starterDoc()); } // «новый уровень» = empty ground, not the demo arena
export function importJSON(json: string) { replaceDoc(deserialize(json)); }
export function exportJSON(): string { return serialize(state.doc); }

// ── named levels library (multiple saved levels in localStorage), separate from the live autosave (studio_doc).
const LIB_KEY = "studio_levels";
type Lib = Record<string, string>; // name -> serialized doc
function readLib(): Lib { try { return JSON.parse(localStorage.getItem(LIB_KEY) || "{}"); } catch { return {}; } }
function writeLib(l: Lib) { try { localStorage.setItem(LIB_KEY, JSON.stringify(l)); } catch { /* ignore */ } }
export function listLevels(): string[] { return Object.keys(readLib()).sort(); }
export function saveLevel(name?: string) { const n = (name ?? state.doc.meta.name).trim() || "level"; const l = readLib(); l[n] = serialize(state.doc); writeLib(l); }
export function loadLevel(name: string) { const l = readLib(); if (l[name]) replaceDoc(deserialize(l[name])); }
export function deleteLevel(name: string) { const l = readLib(); delete l[name]; writeLib(l); }
