import React, { useState, useRef, useEffect } from 'react';
import { notesService } from '../../services/notesService';

interface EditableNotesProps {
  vehicleId: string;
  initialNote: string;
  onNoteChange: (vehicleId: string, note: string) => void;
}

const EditableNotes: React.FC<EditableNotesProps> = ({ vehicleId, initialNote, onNoteChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setNote(initialNote || '');
  }, [initialNote]);

  const handleSave = () => {
    const trimmedNote = note.trim();
    
    if (trimmedNote) {
      notesService.saveNote(vehicleId, trimmedNote);
    } else {
      notesService.removeNote(vehicleId);
    }

    onNoteChange(vehicleId, trimmedNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNote(initialNote || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const truncateNote = (text: string, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (isEditing) {
    return (
      <div className="notes-editor">
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add notes about this vehicle..."
          className="notes-textarea w-full p-2 border border-gray-300 rounded text-sm resize-vertical min-h-[60px]"
          rows={3}
          maxLength={500}
        />
        <div className="notes-editor-actions flex gap-2 items-center mt-1">
          <button 
            onClick={handleSave} 
            className="save-note-btn bg-green-600 text-white border-none rounded px-2 py-1 text-xs cursor-pointer"
          >
            Save
          </button>
          <button 
            onClick={handleCancel} 
            className="cancel-note-btn bg-gray-600 text-white border-none rounded px-2 py-1 text-xs cursor-pointer"
          >
            Cancel
          </button>
          <span className="char-count text-xs text-gray-500 ml-auto">{note.length}/500</span>
        </div>
      </div>
    );
  }

  const metadata = notesService.getNoteMetadata(vehicleId);

  return (
    <div className="notes-display min-w-[150px] max-w-[200px]">
      {note ? (
        <div 
          className="notes-content cursor-pointer p-2 rounded bg-gray-50 border border-transparent hover:border-blue-500 hover:bg-blue-50"
          onClick={() => setIsEditing(true)}
          title="Click to edit note"
        >
          <div className="note-text text-xs leading-tight break-words">
            {isExpanded ? note : truncateNote(note)}
          </div>
          {note.length > 50 && (
            <button 
              className="expand-note-btn bg-none border-none text-blue-500 text-[10px] cursor-pointer p-0.5 mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          )}
          {metadata && (
            <div className="note-metadata text-[9px] text-gray-500 mt-1">
              Last updated: {new Date(metadata.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <div 
          className="notes-placeholder p-2 text-gray-500 text-xs cursor-pointer border border-dashed border-gray-300 rounded text-center hover:border-blue-500 hover:text-blue-500 hover:bg-gray-50"
          onClick={() => setIsEditing(true)}
          title="Click to add note"
        >
          📝 Add note
        </div>
      )}
    </div>
  );
};

export default EditableNotes;