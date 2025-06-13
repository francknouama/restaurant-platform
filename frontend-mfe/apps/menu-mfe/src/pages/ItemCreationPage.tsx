import React from 'react';
import { Card, Button } from '@restaurant/shared-ui';

const ItemCreationPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Create New Item</h1>
          <p className="mt-2 text-neutral-600">Add a new item to your menu</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Create Item</Button>
        </div>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">➕</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Item Creation Form</h3>
          <p className="text-neutral-600">Item creation wizard will be implemented here</p>
        </div>
      </Card>
    </div>
  );
};

export default ItemCreationPage;
EOF < /dev/null