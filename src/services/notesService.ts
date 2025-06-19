import { Vehicle } from '../types';

export interface NoteData {
  note: string;
  updatedAt: string;
  updatedBy: string;
}

export interface NoteMetadata {
  updatedAt: string;
  updatedBy: string;
  hasNote: boolean;
}

export interface NotesMap {
  [vehicleId: string]: NoteData;
}

class NotesStorageService {
  private storageKey = 'truck_notes';

  // Save note for a vehicle
  saveNote(vehicleId: string, note: string): void {
    const notes = this.getAllNotes();
    notes[vehicleId] = {
      note: note.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'User' // Could be enhanced with user management
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(notes));
  }

  // Get note for a vehicle
  getNote(vehicleId: string): string {
    const notes = this.getAllNotes();
    return notes[vehicleId]?.note || '';
  }

  // Get all notes
  getAllNotes(): NotesMap {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading notes:', error);
      return {};
    }
  }

  // Remove note for a vehicle
  removeNote(vehicleId: string): void {
    const notes = this.getAllNotes();
    delete notes[vehicleId];
    localStorage.setItem(this.storageKey, JSON.stringify(notes));
  }

  // Get note metadata (when updated, by whom)
  getNoteMetadata(vehicleId: string): NoteMetadata | null {
    const notes = this.getAllNotes();
    const noteData = notes[vehicleId];
    
    if (!noteData) return null;
    
    return {
      updatedAt: noteData.updatedAt,
      updatedBy: noteData.updatedBy,
      hasNote: Boolean(noteData.note?.trim())
    };
  }

  // Search notes
  searchNotes(searchTerm: string): Array<{vehicleId: string, note: string, updatedAt: string}> {
    const notes = this.getAllNotes();
    const results = [];
    
    Object.keys(notes).forEach(vehicleId => {
      if (notes[vehicleId].note.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          vehicleId,
          note: notes[vehicleId].note,
          updatedAt: notes[vehicleId].updatedAt
        });
      }
    });
    
    return results;
  }
}

export const notesService = new NotesStorageService();