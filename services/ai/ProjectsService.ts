/**
 * Projects Service
 * Manages project/product tracking in Firestore
 * Tracks status updates, sentiment, and related decisions
 */

import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/services/firebase/config';
import type { Project } from './types';

interface ProjectWithUserId extends Project {
  userId: string;
}

export class ProjectsService {
  /**
   * Save or update projects from analysis
   */
  async saveProjects(
    userId: string,
    projects: Project[]
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      
      for (const project of projects) {
        const projectRef = doc(firestore, 'projects', project.id);
        
        // Check if project exists
        const existingProject = await projectRef.get();
        
        if (existingProject.exists()) {
          // Update existing project
          const existing = existingProject.data() as ProjectWithUserId;
          
          await updateDoc(projectRef, {
            lastUpdated: serverTimestamp(),
            mentions: arrayUnion(...project.mentions),
            'status.current': project.status.current,
            'status.timeline': arrayUnion(...project.status.timeline),
            'sentiment.confusion': project.sentiment.confusion,
            'sentiment.blockerCount': project.sentiment.blockerCount,
            'sentiment.confidence': project.sentiment.confidence,
            'sentiment.areas': arrayUnion(...project.sentiment.areas),
            relatedDecisions: arrayUnion(...project.relatedDecisions),
            updatedAt: serverTimestamp(),
          });
          
          console.log('✅ Updated project:', project.name);
        } else {
          // Create new project
          await setDoc(projectRef, {
            ...project,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          console.log('✅ Created new project:', project.name);
        }
      }
    } catch (error) {
      console.error('Error saving projects:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<ProjectWithUserId[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'projects'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const projects: ProjectWithUserId[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          type: data.type,
          firstMentioned: data.firstMentioned,
          lastUpdated: data.lastUpdated,
          mentions: data.mentions || [],
          status: data.status || { current: 'unknown', timeline: [] },
          sentiment: data.sentiment || {
            confusion: 0,
            blockerCount: 0,
            confidence: 1,
            areas: [],
          },
          relatedDecisions: data.relatedDecisions || [],
          participants: data.participants || [],
        });
      });

      // Sort by last updated (most recent first)
      projects.sort((a, b) => b.lastUpdated - a.lastUpdated);

      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  /**
   * Get projects by status
   */
  async getProjectsByStatus(
    userId: string,
    status: 'planning' | 'in-progress' | 'blocked' | 'completed' | 'cancelled'
  ): Promise<ProjectWithUserId[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'projects'),
        where('userId', '==', userId),
        where('status.current', '==', status)
      );

      const snapshot = await getDocs(q);
      const projects: ProjectWithUserId[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as ProjectWithUserId;
        projects.push(data);
      });

      return projects;
    } catch (error) {
      console.error('Error getting projects by status:', error);
      return [];
    }
  }

  /**
   * Get projects with high confusion
   */
  async getConfusedProjects(userId: string, threshold: number = 0.5): Promise<ProjectWithUserId[]> {
    try {
      const allProjects = await this.getUserProjects(userId);
      return allProjects.filter(project => project.sentiment.confusion >= threshold);
    } catch (error) {
      console.error('Error getting confused projects:', error);
      return [];
    }
  }

  /**
   * Get blocked projects
   */
  async getBlockedProjects(userId: string): Promise<ProjectWithUserId[]> {
    try {
      const firestore = await getFirebaseFirestore();
      const q = query(
        collection(firestore, 'projects'),
        where('userId', '==', userId),
        where('status.current', '==', 'blocked')
      );

      const snapshot = await getDocs(q);
      const projects: ProjectWithUserId[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as ProjectWithUserId;
        projects.push(data);
      });

      return projects;
    } catch (error) {
      console.error('Error getting blocked projects:', error);
      return [];
    }
  }

  /**
   * Update project status manually
   */
  async updateProjectStatus(
    projectId: string,
    newStatus: string,
    messageId?: string
  ): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      const projectRef = doc(firestore, 'projects', projectId);

      await updateDoc(projectRef, {
        'status.current': newStatus,
        'status.timeline': arrayUnion({
          status: newStatus,
          timestamp: Date.now(),
          messageId: messageId || '',
        }),
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Updated project status:', projectId, '→', newStatus);
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const firestore = await getFirebaseFirestore();
      await deleteDoc(doc(firestore, 'projects', projectId));
      console.log('✅ Deleted project:', projectId);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Search projects by name
   */
  async searchProjects(userId: string, keyword: string): Promise<ProjectWithUserId[]> {
    try {
      const allProjects = await this.getUserProjects(userId);
      const lowerKeyword = keyword.toLowerCase();
      
      return allProjects.filter(project =>
        project.name.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }
}

export const projectsService = new ProjectsService();

