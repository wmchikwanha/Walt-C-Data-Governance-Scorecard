
import React from 'react';
import { ChangeLogEntry } from '../../types';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';

interface ChangelogViewProps {
  changelog: ChangeLogEntry[];
}

const ChangelogView: React.FC<ChangelogViewProps> = ({ changelog }) => {
    if (changelog.length === 0) {
        return <div className="text-center p-10 text-gray-500">No changelog entries found.</div>;
    }
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {changelog.map((entry, entryIdx) => (
          <li key={entry.id}>
            <div className="relative pb-8">
              {entryIdx !== changelog.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {entry.changeDescription}{' '}
                      <span className="font-medium text-gray-900">{entry.user}</span>
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1"/>
                    <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleDateString()}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChangelogView;