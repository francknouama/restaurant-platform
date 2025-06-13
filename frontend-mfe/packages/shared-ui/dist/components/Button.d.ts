import { default as React } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}
declare const Button: React.FC<ButtonProps>;
export default Button;
//# sourceMappingURL=Button.d.ts.map