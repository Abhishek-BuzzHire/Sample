// Simple local storage based database for MVP
export const localStorageDB = {
  add: (collection: string, item: any) => {
    const items = JSON.parse(localStorage.getItem(collection) || '[]');
    const newItem = { ...item };
    
    if (!newItem.id) {
      newItem.id = crypto.randomUUID();
    }
    
    items.push(newItem);
    localStorage.setItem(collection, JSON.stringify(items));
    return newItem.id;
  },
  
  getAll: (collection: string) => {
    return JSON.parse(localStorage.getItem(collection) || '[]');
  },
  
  getById: (collection: string, id: string) => {
    const items = JSON.parse(localStorage.getItem(collection) || '[]');
    return items.find((item: any) => item.id === id);
  },
  
  update: (collection: string, id: string, updates: any) => {
    const items = JSON.parse(localStorage.getItem(collection) || '[]');
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, id };
      localStorage.setItem(collection, JSON.stringify(items));
      return true;
    }
    return false;
  },
  
  delete: (collection: string, id: string) => {
    const items = JSON.parse(localStorage.getItem(collection) || '[]');
    const filtered = items.filter((item: any) => item.id !== id);
    localStorage.setItem(collection, JSON.stringify(filtered));
    return items.length !== filtered.length;
  }
};