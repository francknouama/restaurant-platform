import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button } from '@restaurant/shared-ui';

const ItemEditorPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Edit Item</h1>
          <p className="mt-2 text-neutral-600">Editing item: {itemId}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✏️</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Item Editor</h3>
          <p className="text-neutral-600">Item editing form will be implemented here</p>
        </div>
      </Card>
    </div>
  );
};

export default ItemEditorPage;
EOF < /dev/null