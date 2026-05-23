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
      const tasks = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          createdAt: d.createdAt?.toDate() || new Date(),
          dueDate: d.dueDate?.toDate() || null
        } as Task;
      });
      callback(tasks);
    }, (error) => {
      console.error("Erro na escuta das tarefas:", error);
      if (onError) onError(error);
    });
  },

  subscribeToTags(projectId: string, callback: (tags: string[]) => void, onError?: (err: any) => void) {
    const q = query(collection(db, 'projects', projectId, 'tags'));
    return onSnapshot(q, (snapshot) => {
      const tags = snapshot.docs.map(doc => doc.id).sort();
      callback(tags);
    }, (error) => {
      console.error("Erro na escuta das tags:", error);
      if (onError) onError(error);
    });
  },

  async registerTag(projectId: string, tag: string) {
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    const ref = doc(db, 'projects', projectId, 'tags', cleanTag);
    await setDoc(ref, { createdAt: new Date() });
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

  async updateTask(
    projectId: string, 
    taskId: string, 
    fields: { 
      title: string; 
      description?: string | null; 
      assigneeId?: string | null; 
      assigneeIds?: string[];
      tags?: string[];
      dueDate?: Date | null;
      targetColumnId?: string | null;
      priority?: string | null;
      subtasks?: any[];
    }
  ) {
    const ref = doc(db, 'projects', projectId, 'tasks', taskId);
    const data: any = {
      title: fields.title,
      description: fields.description || null,
      assigneeId: fields.assigneeId || null,
    };
    if (fields.assigneeIds !== undefined) data.assigneeIds = fields.assigneeIds;
    if (fields.subtasks !== undefined) data.subtasks = fields.subtasks;
    if (fields.tags !== undefined) {
      data.tags = fields.tags;
      // Registrar tags no banco em background
      for (const t of fields.tags) {
        this.registerTag(projectId, t).catch(console.error);
      }
    }
    if (fields.dueDate !== undefined) data.dueDate = fields.dueDate || null;
    if (fields.targetColumnId !== undefined) data.targetColumnId = fields.targetColumnId || null;
    if (fields.priority !== undefined) {
      data.priority = fields.priority || null;
    }
    await updateDoc(ref, data);
  },

  async addTask(
    projectId: string, 
    columnId: string, 
    title: string, 
    order: number, 
    description?: string, 
    assigneeId?: string, 
    priority?: string,
    assigneeIds?: string[],
    tags?: string[],
    dueDate?: Date | null,
    targetColumnId?: string | null,
    subtasks?: any[]
  ) {
    const data: any = {
      title,
      description: description || null,
      assigneeId: assigneeId || null,
      assigneeIds: assigneeIds || [],
      tags: tags || [],
      dueDate: dueDate || null,
      targetColumnId: targetColumnId || null,
      columnId,
      order,
      priority: priority || null,
      subtasks: subtasks || [],
      createdAt: new Date()
    };
    await addDoc(collection(db, 'projects', projectId, 'tasks'), data);

    if (tags && tags.length > 0) {
      for (const t of tags) {
        this.registerTag(projectId, t).catch(console.error);
      }
    }
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
