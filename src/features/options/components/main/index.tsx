import React from 'react';

import { Card } from '@/components';

/**
 * The main component for the options page.
 * @returns
 */
export const OptionsMain: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">General Settings</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Settings will be added here.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
