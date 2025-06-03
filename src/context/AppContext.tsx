import React, { createContext, useContext, useState, useEffect } from 'react';
import { Candidate, RecipientSelections, FieldVisibility } from '../types';
import { localStorageDB } from '../utils/storage';

interface AppContextType {
  candidates: Candidate[];
  addCandidate: (candidate: Candidate) => string;
  getCandidate: (id: string) => Candidate | undefined;
  updateCandidate: (id: string, candidate: Candidate) => void;
  recipientSelections: Record<string, RecipientSelections>;
  updateRecipientSelections: (candidateId: string, selections: RecipientSelections) => void;
  getSelections: (candidateId: string) => RecipientSelections | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recipientSelections, setRecipientSelections] = useState<Record<string, RecipientSelections>>({});

  // Load data from local storage on initialization
  useEffect(() => {
    const storedCandidates = localStorageDB.getAll('candidates');
    if (storedCandidates.length > 0) {
      setCandidates(storedCandidates);
    }

    const storedSelections = localStorageDB.getAll('recipientSelections');
    if (storedSelections.length > 0) {
      const selectionsMap: Record<string, RecipientSelections> = {};
      storedSelections.forEach(selection => {
        selectionsMap[selection.candidateId] = selection;
      });
      setRecipientSelections(selectionsMap);
    }
  }, []);

  const addCandidate = (candidate: Candidate): string => {
    const id = crypto.randomUUID();
    const newCandidate = { ...candidate, id, createdAt: new Date().toISOString() };
    
    setCandidates(prev => [...prev, newCandidate]);
    localStorageDB.add('candidates', newCandidate);
    
    // Initialize default recipient selections for all fields
    const defaultFieldVisibility: FieldVisibility = {};
    Object.keys(candidate).forEach(field => {
      if (field !== 'id' && field !== 'createdAt') {
        defaultFieldVisibility[field] = {
          client: true,
          internal: true,
          superiors: true
        };
      }
    });
    
    const defaultSelections: RecipientSelections = {
      candidateId: id,
      fieldVisibility: defaultFieldVisibility
    };
    
    setRecipientSelections(prev => ({
      ...prev,
      [id]: defaultSelections
    }));
    
    localStorageDB.add('recipientSelections', defaultSelections);
    
    return id;
  };

  const getCandidate = (id: string) => {
    return candidates.find(c => c.id === id);
  };

  const updateCandidate = (id: string, candidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...candidate, id } : c));
    localStorageDB.update('candidates', id, { ...candidate, id });
  };

  const updateRecipientSelections = (candidateId: string, selections: RecipientSelections) => {
    setRecipientSelections(prev => ({
      ...prev,
      [candidateId]: { ...selections, candidateId }
    }));
    
    localStorageDB.update('recipientSelections', candidateId, { ...selections, candidateId });
  };

  const getSelections = (candidateId: string) => {
    return recipientSelections[candidateId];
  };

  return (
    <AppContext.Provider
      value={{
        candidates,
        addCandidate,
        getCandidate,
        updateCandidate,
        recipientSelections,
        updateRecipientSelections,
        getSelections
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};