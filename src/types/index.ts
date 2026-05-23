export type Recurring = 'daily' | 'weekly' | 'cleaning';

export type Category =
  | 'chat'
  | 'plantes'
  | 'lessive'
  | 'menage'
  | 'cuisine'
  | 'salledebain'
  | 'poubelles';

export interface Task {
  id: string;
  category: Category;
  title: string;
  description?: string;
  tips?: string;
  icon: string;
  recurring: Recurring;
  order: number;
}

export interface TaskState {
  [taskId: string]: {
    done: boolean;
    doneAt?: string; // ISO date string
    doneBy?: string; // pseudo of who completed it (household mode)
  };
}

export interface Member {
  id: string;
  pseudo: string;
  joinedAt: string; // ISO
}

export interface GroceryItem {
  id: string;
  text: string;
  addedBy: string;
  addedAt: string; // ISO
  checkedBy: string | null;
  checkedAt: string | null; // ISO — null if unchecked
}
