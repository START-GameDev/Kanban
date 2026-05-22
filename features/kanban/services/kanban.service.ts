import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, 
  query, orderBy, onSnapshot, addDoc, writeBatch, where, getDocs, arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Column, Task } from '../schemas/kanban';

export const kanbanService = {
  subscribeToColumns(projectId: string, callback: (columns: Column[]) => void, onError?: (err: any) => void) {
    const q = query(
      collection(db, 'projects', projectId, 'columns'),
      orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Column);
      callback(cols);
    }, (error) => {
      console.error("Erro na escuta das colunas:", error);
      if (onError) onError(error);
    });
  },

  subscribeToTasks(projectId: string, callback: (tasks: Task[]) => void, onError?: (err: any) => void) {
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
    }, (error) => {
      console.error("Erro na escuta das tarefas:", error);
      if (onError) onError(error);
    });
  },

  async getProjectMembers(projectId: string) {
    const membersSnap = await getDocs(collection(db, 'projects', projectId, 'members'));
    const membersMap = new Map<string, { role: string; joinedAt: any }>();
    membersSnap.forEach(doc => {
      membersMap.set(doc.id, {
        role: doc.data().role || 'collaborator',
        joinedAt: doc.data().joinedAt
      });
    });

    const memberIds = Array.from(membersMap.keys());
    if (memberIds.length === 0) return [];

    const usersQ = query(collection(db, 'users'), where('uid', 'in', memberIds));
    const usersSnap = await getDocs(usersQ);
    
    return usersSnap.docs.map(d => {
      const userData = d.data();
      const memberInfo = membersMap.get(userData.uid) || { role: 'collaborator' };
      return {
        id: userData.uid,
        ...userData,
        role: memberInfo.role
      };
    });
  },

  async addMultipleUsersToProject(projectId: string, userIds: string[], role: 'admin' | 'collaborator' | 'reader') {
    const batch = writeBatch(db);
    
    userIds.forEach(userId => {
      const memberRef = doc(db, 'projects', projectId, 'members', userId);
      batch.set(memberRef, {
        role,
        joinedAt: new Date()
      });
    });

    const projRef = doc(db, 'projects', projectId);
    batch.update(projRef, {
      memberIds: arrayUnion(...userIds)
    });

    await batch.commit();
  },

  async changeMemberRole(projectId: string, userId: string, newRole: string) {
    const ref = doc(db, 'projects', projectId, 'members', userId);
    await updateDoc(ref, { role: newRole });
  },

  async removeUserFromProject(projectId: string, userId: string) {
    const memberRef = doc(db, 'projects', projectId, 'members', userId);
    await deleteDoc(memberRef);

    const projRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projRef);
    if (snap.exists()) {
      const currentIds = snap.data().memberIds || [];
      const updatedIds = currentIds.filter((id: string) => id !== userId);
      await updateDoc(projRef, { memberIds: updatedIds });
    }
  },

  async addColumn(projectId: string, name: string, order: number) {
    await addDoc(collection(db, 'projects', projectId, 'columns'), { name, order });
  },

  async updateColumn(projectId: string, columnId: string, name: string) {
    const ref = doc(db, 'projects', projectId, 'columns', columnId);
    await updateDoc(ref, { name });
  },

  async deleteColumn(projectId: string, columnId: string) {
    const ref = doc(db, 'projects', projectId, 'columns', columnId);
    await deleteDoc(ref);
  },

  async deleteTask(projectId: string, taskId: string) {
    const ref = doc(db, 'projects', projectId, 'tasks', taskId);
    await deleteDoc(ref);
  },

  async updateTask(projectId: string, taskId: string, fields: { title: string; description?: string | null; assigneeId?: string | null }) {
    const ref = doc(db, 'projects', projectId, 'tasks', taskId);
    await updateDoc(ref, {
      title: fields.title,
      description: fields.description || null,
      assigneeId: fields.assigneeId || null
    });
  },

  async addTask(projectId: string, columnId: string, title: string, order: number, description?: string, assigneeId?: string) {
    await addDoc(collection(db, 'projects', projectId, 'tasks'), {
      title,
      description: description || null,
      assigneeId: assigneeId || null,
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
  
  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addUserToProject(projectId: string, userId: string) {
    // 1. add to members subcollection
    await setDoc(doc(db, 'projects', projectId, 'members', userId), {
      role: 'member',
      joinedAt: new Date()
    });

    // 2. update projects memberIds array
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      memberIds: arrayUnion(userId)
    });
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
