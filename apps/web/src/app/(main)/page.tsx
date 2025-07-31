'use client';

import { useMemo } from 'react';
import { NoteInput } from '@/components/notes/note-input';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useGetBlocks } from '@/hooks/use-blocks-api';
import { groupBlocksByDate, buildHierarchy } from '@9nau/core';
import { Block } from '@9nau/types';
import { useDashboardStore } from '@/lib/state/dashboard-store';

export default function HomePage() {
  const { data: blocks, isLoading, isError } = useGetBlocks({});
  const setAllBlocks = useDashboardStore(s => s.actions.setAllBlocks);

  useMemo(() => {
    if (blocks) {
      setAllBlocks(blocks);
    }
  }, [blocks, setAllBlocks]);

  const processedData = useMemo(() => {
    if (!blocks) {
      return {
        notesByDate: new Map<string, Block[]>(),
        actionsHierarchy: [],
        experiencesHierarchy: [],
      };
    }
    const notes = blocks.filter((b: Block) => b.type === 'note');
    const actions = blocks.filter((b: Block) => b.type === 'action');
    const experiences = blocks.filter((b: Block) => b.type === 'experience');

    const notesByDate = groupBlocksByDate(notes);
    const actionsHierarchy = buildHierarchy(actions);
    const experiencesHierarchy = buildHierarchy(experiences);

    return { notesByDate, actionsHierarchy, experiencesHierarchy };
  }, [blocks]);

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 mt-10">Loading data...</div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 mt-10">
        Failed to load data. Please try again later.
      </div>
    );
  }

  return (
    <>
      <NoteInput />
      <Dashboard
        notesByDate={processedData.notesByDate}
        actions={processedData.actionsHierarchy}
        experiences={processedData.experiencesHierarchy}
      />
    </>
  );
}
