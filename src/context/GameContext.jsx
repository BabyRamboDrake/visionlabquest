import React, { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabase';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [storylines, setStorylines] = useState([]);
  const [activeStorylineId, setActiveStorylineId] = useState(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data when User changes
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setStorylines([]);
      setXp(0);
      setLevel(1);
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Storylines
      const { data: stories, error: storiesError } = await supabase
        .from('storylines')
        .select('*, quests(*, subquests:quests(*))')
        .order('created_at', { ascending: true });

      if (storiesError) throw storiesError;

      // Organize quests (Supabase returns flat or nested depending on query, 
      // but recursive self-referencing is tricky. 
      // Let's fetch all quests and reconstruct tree in JS for simplicity)
      // Try to fetch with position ordering
      let { data: allQuests, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      // Fallback: If 'position' column doesn't exist, fetch without it
      if (questsError && (questsError.code === '42703' || questsError.message?.includes('position'))) {
        console.warn('Database missing "position" column. Drag and drop persistence will be disabled until schema is updated.');
        const retry = await supabase
          .from('quests')
          .select('*')
          .order('created_at', { ascending: true });
        allQuests = retry.data;
        questsError = retry.error;
      }

      if (questsError) throw questsError;

      // Reconstruct Storylines with Quests
      const structuredStorylines = stories.map(story => {
        const storyQuests = allQuests.filter(q => q.storyline_id === story.id && !q.parent_id);

        const attachSubquests = (quests) => {
          return quests.map(q => {
            const subquests = allQuests.filter(sq => sq.parent_id === q.id);
            return { ...q, subquests: attachSubquests(subquests) };
          });
        };

        return { ...story, quests: attachSubquests(storyQuests) };
      });

      setStorylines(structuredStorylines);

      // Fetch Progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') throw progressError; // Ignore not found

      if (progress) {
        setXp(progress.xp);
        setLevel(progress.level);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStoryline = async (title) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('storylines')
        .insert([{ user_id: user.id, title }])
        .select()
        .single();

      if (error) throw error;
      setStorylines([...storylines, { ...data, quests: [] }]);
    } catch (error) {
      console.error('Error adding storyline:', error);
    }
  };

  const deleteStoryline = async (id) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('storylines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStorylines(storylines.filter(s => s.id !== id));
      if (activeStorylineId === id) setActiveStorylineId(null);
    } catch (error) {
      console.error('Error deleting storyline:', error);
    }
  };

  const addQuest = async (storylineId, title, parentQuestId = null) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quests')
        .insert([{
          storyline_id: storylineId,
          title,
          parent_id: parentQuestId
        }])
        .select()
        .single();

      if (error) throw error;

      // Optimistic Update (or re-fetch, but optimistic is better for UX)
      // Re-using the recursive logic from before but adapting for new structure
      const newQuest = { ...data, subquests: [] };

      setStorylines(storylines.map(storyline => {
        if (storyline.id !== storylineId) return storyline;

        if (parentQuestId) {
          const addSubquestRecursive = (quests) => {
            return quests.map(q => {
              if (q.id === parentQuestId) {
                return { ...q, subquests: [...q.subquests, newQuest] };
              }
              if (q.subquests.length > 0) {
                return { ...q, subquests: addSubquestRecursive(q.subquests) };
              }
              return q;
            });
          };
          return { ...storyline, quests: addSubquestRecursive(storyline.quests) };
        } else {
          return { ...storyline, quests: [...storyline.quests, newQuest] };
        }
      }));

    } catch (error) {
      console.error('Error adding quest:', error);
    }
  };

  const completeQuest = async (storylineId, questId, isCompleted) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('quests')
        .update({ completed: isCompleted })
        .eq('id', questId);

      if (error) throw error;

      // Calculate XP
      let xpGained = 0;
      if (isCompleted) xpGained = 50;
      else xpGained = -50;

      // Update Local State
      const updateQuestRecursive = (quests) => {
        return quests.map(q => {
          if (q.id === questId) {
            return { ...q, completed: isCompleted };
          }
          if (q.subquests.length > 0) {
            return { ...q, subquests: updateQuestRecursive(q.subquests) };
          }
          return q;
        });
      };

      setStorylines(storylines.map(s => {
        if (s.id !== storylineId) return s;
        return { ...s, quests: updateQuestRecursive(s.quests) };
      }));

      if (xpGained !== 0) {
        addXp(xpGained);
      }

    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const addXp = async (amount) => {
    if (!user) return;

    let newXp = xp + amount;
    let newLevel = level;
    const xpForNextLevel = level * 1000;

    if (newXp >= xpForNextLevel) {
      newLevel += 1;
      newXp = newXp - xpForNextLevel;
    }

    setXp(newXp);
    setLevel(newLevel);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({ user_id: user.id, xp: newXp, level: newLevel });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Undo Stack
  const [deletedQuests, setDeletedQuests] = useState([]);

  // Keyboard Listener for Undo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undoDeleteQuest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletedQuests]); // Depend on deletedQuests to access latest state

  const updateQuest = async (storylineId, questId, newTitle) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('quests')
        .update({ title: newTitle })
        .eq('id', questId);

      if (error) throw error;

      // Update Local State
      const updateQuestRecursive = (quests) => {
        return quests.map(q => {
          if (q.id === questId) {
            return { ...q, title: newTitle };
          }
          if (q.subquests.length > 0) {
            return { ...q, subquests: updateQuestRecursive(q.subquests) };
          }
          return q;
        });
      };

      setStorylines(storylines.map(s => {
        if (s.id !== storylineId) return s;
        return { ...s, quests: updateQuestRecursive(s.quests) };
      }));
    } catch (error) {
      console.error('Error updating quest:', error);
    }
  };

  const deleteQuest = async (storylineId, questId) => {
    if (!user) return;

    // Find quest to save for undo
    let questToDelete = null;
    let parentId = null;

    const findQuest = (quests, pId = null) => {
      for (const q of quests) {
        if (q.id === questId) {
          questToDelete = q;
          parentId = pId;
          return;
        }
        if (q.subquests.length > 0) {
          findQuest(q.subquests, q.id);
          if (questToDelete) return;
        }
      }
    };

    const story = storylines.find(s => s.id === storylineId);
    if (story) findQuest(story.quests);

    if (questToDelete) {
      // Add to undo stack
      setDeletedQuests(prev => [...prev, { ...questToDelete, storylineId, parentId }]);
    }

    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;

      // Update Local State
      const deleteQuestRecursive = (quests) => {
        return quests.filter(q => q.id !== questId).map(q => ({
          ...q,
          subquests: deleteQuestRecursive(q.subquests)
        }));
      };

      setStorylines(storylines.map(s => {
        if (s.id !== storylineId) return s;
        return { ...s, quests: deleteQuestRecursive(s.quests) };
      }));
    } catch (error) {
      console.error('Error deleting quest:', error);
    }
  };

  const undoDeleteQuest = async () => {
    if (deletedQuests.length === 0 || !user) return;

    const questToRestore = deletedQuests[deletedQuests.length - 1];
    const { storylineId, parentId, title, completed } = questToRestore;

    try {
      // Restore to DB
      const { data, error } = await supabase
        .from('quests')
        .insert([{
          storyline_id: storylineId,
          title,
          parent_id: parentId,
          completed
        }])
        .select()
        .single();

      if (error) throw error;

      // Remove from undo stack
      setDeletedQuests(prev => prev.slice(0, -1));

      // Update Local State
      const newQuest = { ...data, subquests: [] }; // Subquests are lost on delete unless we recursively restore them. For now, simple restore.

      setStorylines(storylines.map(storyline => {
        if (storyline.id !== storylineId) return storyline;

        if (parentId) {
          const addSubquestRecursive = (quests) => {
            return quests.map(q => {
              if (q.id === parentId) {
                return { ...q, subquests: [...q.subquests, newQuest] };
              }
              if (q.subquests.length > 0) {
                return { ...q, subquests: addSubquestRecursive(q.subquests) };
              }
              return q;
            });
          };
          return { ...storyline, quests: addSubquestRecursive(storyline.quests) };
        } else {
          return { ...storyline, quests: [...storyline.quests, newQuest] };
        }
      }));

    } catch (error) {
      console.error('Error restoring quest:', error);
    }
  };

  const reorderQuests = async (storylineId, reorderedQuests) => {
    // Optimistically update local state
    setStorylines(storylines.map(s => {
      if (s.id !== storylineId) return s;
      return { ...s, quests: reorderedQuests };
    }));

    if (!user) return;

    try {
      // Prepare updates for Supabase
      // We need to update the 'position' field for each quest
      const updates = reorderedQuests.map((q, index) => ({
        id: q.id,
        position: index,
        title: q.title, // Required for upsert if we don't specify columns, but let's try explicit update
        storyline_id: storylineId
      }));

      // Supabase doesn't have a bulk update for different values in one go easily without upsert
      // Let's use upsert with the ID
      const { error } = await supabase
        .from('quests')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        // Ignore missing column error to prevent crashing
        if (error.code === '42703' || error.message?.includes('position')) {
          console.warn('Cannot save order: "position" column missing.');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error reordering quests:', error);
    }
  };

  return (
    <GameContext.Provider value={{
      user,
      loading,
      storylines,
      activeStorylineId,
      setActiveStorylineId,
      xp,
      level,
      addStoryline,
      deleteStoryline,
      addQuest,
      updateQuest,
      deleteQuest,
      reorderQuests,
      completeQuest,
      addXp
    }}>
      {children}
    </GameContext.Provider>
  );
};

GameProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
