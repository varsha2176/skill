import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <ExclamationCircleIcon className="h-12 w-12 text-red-400" />
      <div className="text-center">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {message && <p className="text-sm text-gray-500 mt-1 max-w-md">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} size="sm">
          Try again
        </Button>
      )}
    </div>
  );
}
