import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', padding = 'md', className = '', ...props }, ref) => {
    const baseClasses = 'bg-white rounded-lg';
    
    const variants = {
      default: 'border border-gray-200',
      elevated: 'shadow-md',
      outlined: 'border-2 border-gray-300'
    };
    
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const classes = `
      ${baseClasses}
      ${variants[variant]}
      ${paddings[padding]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`border-b border-gray-200 pb-3 mb-4 ${className}`} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, level = 3, className = '', ...props }, ref) => {
    const sizes = {
      1: 'text-2xl font-bold',
      2: 'text-xl font-bold',
      3: 'text-lg font-semibold',
      4: 'text-base font-semibold',
      5: 'text-sm font-semibold',
      6: 'text-xs font-semibold'
    };

    const classes = `text-gray-900 ${sizes[level]} ${className}`;

    switch (level) {
      case 1:
        return <h1 ref={ref} className={classes} {...props}>{children}</h1>;
      case 2:
        return <h2 ref={ref} className={classes} {...props}>{children}</h2>;
      case 3:
        return <h3 ref={ref} className={classes} {...props}>{children}</h3>;
      case 4:
        return <h4 ref={ref} className={classes} {...props}>{children}</h4>;
      case 5:
        return <h5 ref={ref} className={classes} {...props}>{children}</h5>;
      case 6:
        return <h6 ref={ref} className={classes} {...props}>{children}</h6>;
      default:
        return <h3 ref={ref} className={classes} {...props}>{children}</h3>;
    }
  }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`text-gray-600 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };