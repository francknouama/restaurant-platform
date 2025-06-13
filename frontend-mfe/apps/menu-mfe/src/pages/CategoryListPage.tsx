import React from 'react';
import { Card, Button } from '@restaurant/shared-ui';

const CategoryListPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Categories</h1>
          <p className="mt-2 text-neutral-600">Manage menu categories</p>
        </div>
        <Button variant="primary">Add Category</Button>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Category Management</h3>
          <p className="text-neutral-600">Category list and hierarchy will be implemented here</p>
        </div>
      </Card>
    </div>
  );
};

export default CategoryListPage;
EOF < /dev/null