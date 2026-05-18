import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  query, orderBy, onSnapshot, addDoc, writeBatch, where, getDocs, arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Column, Task } from '../schemas/kanban';

export const kanbanService = {
  subscribeToColumns(projectId: string, callback: (columns: Column[]) => void) {
    const q = query(
      collection(db, 'projects', projectId, 'columns'),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Column);
      callback(cols);
    });
  },

  subscribeToTasks(projectId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, 'projects', projectId, 'tasks'),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Task[];
      callback(tasks);
    });
  },

  async addColumn(projectId: string, name: string, order: number) {
    await addDoc(collection(db, 'projects', projectId, 'columns'), { name, order });
  },

  async addTask(projectId: string, columnId: string, title: string, order: number) {
    await addDoc(collection(db, 'projects', projectId, 'tasks'), {
      title,
      columnId,
      order,
      createdAt: new Date()
    });
  },

  async updateTaskPosition(projectId: string, taskId: string, newColumnId: string, newOrder: number) {
    const ref = doc(db, 'projects', projectId, 'tasks', taskId);
    await updateDoc(ref, {
      columnId: newColumnId,
      order: newOrder
    });
  },

  async updateTaskBatch(projectId: string, updates: { id: string; columnId?: string; order?: number }[]) {
    const batch = writeBatch(db);
    updates.forEach(update => {
      const ref = doc(db, 'projects', projectId, 'tasks', update.id);
      const data: any = {};
      if (update.columnId !== undefined) data.columnId = update.columnId;
      if (update.order !== undefined) data.order = update.order;
      batch.update(ref, data);
    });
    await batch.commit();
  },
  
  async inviteUserByEmail(projectId: string, email: string) {
    // 1. Find user by email
    const usersQ = query(collection(db, 'users'), where('email', '==', email));
    
    const snap = await getDocs(usersQ);
    if (snap.empty) {
      throw new Error('Usuário não encontrado.');
    }
    const userDoc = snap.docs[0];
    const userId = userDoc.id;

    // 2. add to members subcollection
    await setDoc(doc(db, 'projects', projectId, 'members', userId), {
      role: 'member',
      joinedAt: new Date()
    });

    // 3. update projects memberIds array
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      memberIds: arrayUnion(userId)
    });
  }
};
