import { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
      ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
      destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };
    
    const spacing = {
      sm: icon && children ? (iconPosition === 'left' ? 'ml-1.5' : 'mr-1.5') : '',
      md: icon && children ? (iconPosition === 'left' ? 'ml-2' : 'mr-2') : '',
      lg: icon && children ? (iconPosition === 'left' ? 'ml-2.5' : 'mr-2.5') : ''
    };

    const classes = `
      ${baseClasses}
      ${variants[variant]}
      ${sizes[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <FontAwesomeIcon 
            icon={require('@fortawesome/free-solid-svg-icons').faSpinner}
            className={`${iconSizes[size]} animate-spin`}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <FontAwesomeIcon 
                icon={icon} 
                className={`${iconSizes[size]} ${children ? spacing[size] : ''}`} 
              />
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <FontAwesomeIcon 
                icon={icon} 
                className={`${iconSizes[size]} ${children ? spacing[size] : ''}`} 
              />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;