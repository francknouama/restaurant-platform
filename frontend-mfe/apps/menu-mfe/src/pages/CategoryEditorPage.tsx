import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button } from '@restaurant/shared-ui';

const CategoryEditorPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Edit Category</h1>
          <p className="mt-2 text-neutral-600">Editing category: {categoryId}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Cancel</Button>
          <Button variant="primary">Save Changes</Button>
        </div>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✏️</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Category Editor</h3>
          <p className="text-neutral-600">Category editing form will be implemented here</p>
        </div>
      </Card>
    </div>
  );
};

export default CategoryEditorPage;
EOF < /dev/null