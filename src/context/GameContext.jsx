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
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

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
      fetchInventory();
      fetchExpenses(); // Fetch expenses
    } else {
      setStorylines([]);
      setInventory([]);
      setExpenses([]);
      setXp(0);
      setLevel(1);
    }
  }, [user]);

  // ... (existing fetchData and fetchInventory) ...

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const addExpense = async (expenseData) => {
    if (!user) throw new Error('User not logged in');
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expenseData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setExpenses([data, ...expenses]);
      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id, updates) => {
    if (!user) throw new Error('User not logged in');
    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e));
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    if (!user) throw new Error('User not logged in');
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const uploadReceipt = async (file) => {
    if (!user) throw new Error('User not logged in');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  };

  const awardRandomItem = async () => {
    if (!user || items.length === 0) return;

    // Simple random drop logic
    const randomItem = items[Math.floor(Math.random() * items.length)];

    try {
      // Check if user already has item
      const existingEntry = inventory.find(i => i.item_id === randomItem.id);

      if (existingEntry) {
        // Update quantity
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: existingEntry.quantity + 1 })
          .eq('id', existingEntry.id);

        if (error) throw error;

        setInventory(inventory.map(i =>
          i.id === existingEntry.id ? { ...i, quantity: i.quantity + 1, item: existingEntry.item } : i
        ));
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from('inventory')
          .insert([{ user_id: user.id, item_id: randomItem.id }])
          .select('*, item:items(*)')
          .single();

        if (error) throw error;
        setInventory([...inventory, data]);
      }

      // Return item for notification
      return randomItem;

    } catch (error) {
      console.error('Error awarding item:', error);
    }
  };

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

  const fetchInventory = async () => {
    try {
      // Fetch all available items first (for reference)
      const { data: allItems, error: itemsError } = await supabase
        .from('items')
        .select('*');

      if (itemsError) throw itemsError;
      setItems(allItems);

      // Fetch user inventory
      const { data: userInventory, error: invError } = await supabase
        .from('inventory')
        .select('*, item:items(*)')
        .eq('user_id', user.id);

      if (invError) throw invError;
      setInventory(userInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
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
    let leveledUp = false;

    if (newXp >= xpForNextLevel) {
      newLevel += 1;
      newXp = newXp - xpForNextLevel;
      leveledUp = true;
    }

    setXp(newXp);
    setLevel(newLevel);

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({ user_id: user.id, xp: newXp, level: newLevel });

      if (error) throw error;

      if (leveledUp) {
        const reward = await awardRandomItem();
        if (reward) {
          // We could trigger a global toast/modal here, or return it to the caller
          // For now, let's just log it, the UI can react to inventory changes or we can add a notification context later
          console.log(`Level Up! You found a ${reward.name}!`);
          return { leveledUp: true, reward };
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
    return { leveledUp: false };
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
      inventory,
      items,
      expenses,
      addStoryline,
      deleteStoryline,
      addQuest,
      updateQuest,
      deleteQuest,
      reorderQuests,
      completeQuest,
      addXp,
      addExpense,
      updateExpense,
      addExpense,
      updateExpense,
      deleteExpense,
      uploadReceipt
    }}>
      {children}
    </GameContext.Provider>
  );
};

GameProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
