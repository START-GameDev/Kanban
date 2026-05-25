import { collection, doc, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Project, ProjectInput } from '../schemas/project';

export const projectsService = {
  async createProject(userId: string, data: ProjectInput) {
    try {
      const batch = writeBatch(db);
      const projectRef = doc(collection(db, 'projects'));
      
      batch.set(projectRef, {
        name: data.name,
        ownerId: userId,
        memberIds: [userId],
        createdAt: new Date()
      });

      const memberRef = doc(db, 'projects', projectRef.id, 'members', userId);
      batch.set(memberRef, {
        role: 'owner',
        joinedAt: new Date()
      });

      // Adicionar as 4 colunas padrão do Kanban (Backlog, A Fazer, Em Progresso, Concluído)
      const defaultColumns = ['Backlog', 'A Fazer', 'Em Progresso', 'Concluído'];
      defaultColumns.forEach((colName, index) => {
        const colRef = doc(collection(db, 'projects', projectRef.id, 'columns'));
        batch.set(colRef, {
          name: colName,
          order: (index + 1) * 1000
        });
      });

      await batch.commit();
      return projectRef.id;
    } catch (error) {
      console.error("Erro no createProject:", error);
      throw error;
    }
  },

  subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void, onError?: (err: any) => void) {
    // Listen to projects where user is owner OR user is in members subcollection.
    // Given no-sql, simple where clauses on main 'projects' are easiest for owners,
    // but a combined list is tricky if we use subcollections for members.
    // Alternative: put memberIds in an array in 'projects'. But wait, arrays scale poorly for thousands.
    // For Kanban small teams, an array `members: [userId]` is fine! Let's modify creation to use an array for querying comfort.
    
    // Instead of above, let's use a simpler array approach for querying if size is bounded:
    const q = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Project[];
      callback(projects);
    }, (error) => {
      console.error("Erro na escuta dos projetos:", error);
      if (onError) onError(error);
    });
  }
};
