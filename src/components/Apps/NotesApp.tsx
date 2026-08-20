import React, { useState, useEffect } from 'react';
import styles from './NotesApp.module.css';

interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: number;
}

const STORAGE_KEY = 'argus-notes';

const defaultNote: Note = {
  id: 'default-1',
  title: 'Welcome to Notes',
  content: 'This is a sample note to get you started.\n\nYou can edit this note or create a new one using the + button in the sidebar.\n\nNotes are automatically saved.',
  lastEdited: Date.now(),
};

export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setNotes(parsed);
          setActiveNoteId(parsed[0].id);
        } else {
          setNotes([defaultNote]);
          setActiveNoteId(defaultNote.id);
        }
      } catch {
        setNotes([defaultNote]);
        setActiveNoteId(defaultNote.id);
      }
    } else {
      setNotes([defaultNote]);
      setActiveNoteId(defaultNote.id);
    }
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      lastEdited: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNoteId === id) {
      setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
    }
  };

  const updateActiveNote = (updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === activeNoteId
          ? { ...note, ...updates, lastEdited: Date.now() }
          : note
      )
    );
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Notes</h3>
          <button className={styles.newNoteBtn} onClick={handleCreateNote} title="New Note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <div className={styles.notesList}>
          {notes.map(note => (
            <div
              key={note.id}
              className={`${styles.noteItem} ${activeNoteId === note.id ? styles.active : ''}`}
              onClick={() => setActiveNoteId(note.id)}
            >
              <div className={styles.noteItemContent}>
                <div className={styles.noteTitle}>{note.title || 'Untitled Note'}</div>
                <div className={styles.notePreview}>{note.content || 'No additional text'}</div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDeleteNote(note.id, e)}
                title="Delete note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {activeNote ? (
        <div className={styles.editor}>
          <div className={styles.editorHeader}>
            <input
              className={styles.titleInput}
              value={activeNote.title}
              onChange={(e) => updateActiveNote({ title: e.target.value })}
              placeholder="Title"
            />
            <div className={styles.timestamp}>Last edited: {formatDate(activeNote.lastEdited)}</div>
          </div>
          <textarea
            className={styles.contentInput}
            value={activeNote.content}
            onChange={(e) => updateActiveNote({ content: e.target.value })}
            placeholder="Start typing..."
          />
        </div>
      ) : (
        <div className={styles.emptyState}>
          Select a note or create a new one.
        </div>
      )}
    </div>
  );
};
