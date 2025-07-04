import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../pages/firebase';

export const useFirebaseData = () => {
  const [data, setData] = useState({ 
    persons: [], 
    tasks: [], 
    completedTasks: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(ref(db, '/'));
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();

          setData({
            persons: snapshotData.persons || [],
            tasks: snapshotData.tasks || [],
            completedTasks: snapshotData.completedTasks || []
          });
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateData = async (newData) => {
    try {
      await set(ref(db, '/'), { ...data, ...newData });
      setData(prev => ({ ...prev, ...newData }));
    } catch (error) {
      console.error("Güncelleme hatası:", error);
    }
  };

  return { data, loading, updateData };
};
