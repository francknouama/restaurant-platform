import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@restaurant/shared-ui';

const MenuPreviewPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>();

  return (
    <div className="p-6">
      <Card>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👀</div>
          <h3 className="text-xl font-medium text-neutral-900 mb-2">Menu Preview</h3>
          <p className="text-neutral-600">Preview for menu: {menuId}</p>
        </div>
      </Card>
    </div>
  );
};

export default MenuPreviewPage;
EOF < /dev/null