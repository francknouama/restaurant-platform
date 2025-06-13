import React from 'react';
import { Card } from '@restaurant/shared-ui';

const MenuAnalyticsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Menu Analytics</h1>
        <p className="mt-2 text-neutral-600">Track menu performance and popularity</p>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Analytics Dashboard</h3>
          <p className="text-neutral-600">Menu performance metrics will be implemented here</p>
        </div>
      </Card>
    </div>
  );
};

export default MenuAnalyticsPage;
EOF < /dev/null