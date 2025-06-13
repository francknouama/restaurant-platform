import { default as React } from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'elevated' | 'outlined';
}
declare const Card: React.FC<CardProps>;
export default Card;
//# sourceMappingURL=Card.d.ts.map