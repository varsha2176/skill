import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export function EmptyState({ icon: Icon = InboxIcon, title = 'No data', description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
