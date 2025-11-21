import React, { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Load initial state from localStorage
  const loadState = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [storylines, setStorylines] = useState(() => loadState('storylines', []));
  const [activeStorylineId, setActiveStorylineId] = useState(() => loadState('activeStorylineId', null));
  const [xp, setXp] = useState(() => loadState('xp', 0));
  const [level, setLevel] = useState(() => loadState('level', 1));

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('storylines', JSON.stringify(storylines));
    localStorage.setItem('activeStorylineId', JSON.stringify(activeStorylineId));
    localStorage.setItem('xp', JSON.stringify(xp));
    localStorage.setItem('level', JSON.stringify(level));
  }, [storylines, activeStorylineId, xp, level]);

  const addStoryline = (title) => {
    const newStoryline = {
      id: Date.now().toString(),
      title,
      quests: [],
      createdAt: new Date().toISOString(),
    };
    setStorylines([...storylines, newStoryline]);
  };

  const deleteStoryline = (id) => {
    setStorylines(storylines.filter(s => s.id !== id));
    if (activeStorylineId === id) setActiveStorylineId(null);
  };

  const addQuest = (storylineId, title, parentQuestId = null) => {
    setStorylines(storylines.map(storyline => {
      if (storyline.id !== storylineId) return storyline;

      const newQuest = {
        id: Date.now().toString(),
        title,
        completed: false,
        subquests: [],
        parentId: parentQuestId
      };

      if (parentQuestId) {
        // Add as subquest
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
        // Add as top-level quest
        return { ...storyline, quests: [...storyline.quests, newQuest] };
      }
    }));
  };

  const completeQuest = (storylineId, questId, isCompleted) => {
    let xpGained = 0;

    const updateQuestRecursive = (quests) => {
      return quests.map(q => {
        if (q.id === questId) {
          if (isCompleted && !q.completed) xpGained = 50; // Base XP for quest
          if (!isCompleted && q.completed) xpGained = -50;
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
  };

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      const xpForNextLevel = level * 1000;
      if (newXp >= xpForNextLevel) {
        setLevel(l => l + 1);
        return newXp - xpForNextLevel;
      }
      return newXp;
    });
  };

  return (
    <GameContext.Provider value={{
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
