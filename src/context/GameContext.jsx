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
      const { data: allQuests, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .order('created_at', { ascending: true });

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
