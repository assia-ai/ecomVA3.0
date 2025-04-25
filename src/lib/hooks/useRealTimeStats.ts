import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserIntegrations } from '../services/integrations';

export interface DashboardStats {
  emailsProcessed: number;
  draftsGenerated: number;
  averageResponseTime: string;
  activeIntegrations: number;
}

export function useRealTimeStats(userId: string | null | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    emailsProcessed: 0,
    draftsGenerated: 0,
    averageResponseTime: '0 min',
    activeIntegrations: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    try {
      // 1. Real-time listener for all emails
      console.log('Setting up real-time listener for all emails');
      const emailsQuery = query(
        collection(db, 'emails'),
        where('userId', '==', userId)
      );
      
      const emailsUnsubscribe = onSnapshot(emailsQuery, (snapshot) => {
        console.log(`Real-time update: ${snapshot.docs.length} total emails`);
        
        // Count all emails
        const totalEmails = snapshot.docs.length;
        
        // Count drafts
        const drafts = snapshot.docs.filter(doc => 
          doc.data().status === 'draft_created'
        ).length;
        
        // Calculate average response time
        let avgResponseTime = '~5 min';
        const draftsWithTimestamps = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.status === 'draft_created' && data.timestamp && data.draftCreatedAt;
        });
        
        if (draftsWithTimestamps.length > 0) {
          let totalResponseTime = 0;
          let emailsWithValidTime = 0;
          
          draftsWithTimestamps.forEach(doc => {
            const data = doc.data();
            const receivedTime = data.timestamp.toDate();
            const draftTime = data.draftCreatedAt.toDate();
            const diffMinutes = (draftTime - receivedTime) / (1000 * 60);
            
            // Only include realistic times
            if (diffMinutes > 0 && diffMinutes < 60) {
              totalResponseTime += diffMinutes;
              emailsWithValidTime++;
            }
          });
          
          if (emailsWithValidTime > 0) {
            const avg = Math.round(totalResponseTime / emailsWithValidTime * 10) / 10;
            avgResponseTime = `${avg} min`;
          }
        }
        
        // Update stats state with new values
        setStats(currentStats => ({
          ...currentStats,
          emailsProcessed: totalEmails,
          draftsGenerated: drafts,
          averageResponseTime: avgResponseTime
        }));
        
        setLoading(false);
      }, (error) => {
        console.error('Error in emails listener:', error);
        setLoading(false);
      });
      
      unsubscribers.push(emailsUnsubscribe);

      // 2. Fetch integrations (doesn't need real-time)
      const fetchIntegrations = async () => {
        try {
          const integrations = await getUserIntegrations(userId);
          setStats(currentStats => ({
            ...currentStats,
            activeIntegrations: integrations.length
          }));
        } catch (error) {
          console.error('Error fetching integrations:', error);
        }
      };
      
      fetchIntegrations();
    } catch (error) {
      console.error('Error setting up dashboard stats:', error);
      setLoading(false);
    }

    // Clean up all listeners on unmount
    return () => {
      console.log('Cleaning up real-time stats listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [userId]);

  return { stats, loading };
}