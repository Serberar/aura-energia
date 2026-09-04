import React from 'react';
import type { ReactNode, CSSProperties } from 'react';
import styles from './Card.module.scss';

export interface CardProps {
  /** Contenido del card */
  children: ReactNode;
  /** Variante visual del card */
  variant?: 'default' | 'outlined' | 'elevated';
  /** Tamaño del padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Si el card es clickeable */
  clickable?: boolean;
  /** Función de click */
  onClick?: () => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Si el card tiene hover effect */
  hoverable?: boolean;
  /** Estilos inline */
  style?: CSSProperties;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  onClick,
  className,
  hoverable = false,
  style
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    clickable && styles.clickable,
    hoverable && styles.hoverable,
    className
  ].filter(Boolean).join(' ');

  const CardComponent = clickable ? 'button' : 'div';

  return (
    <CardComponent
      className={cardClasses}
      onClick={onClick}
      type={clickable ? 'button' : undefined}
      style={style}
    >
      {children}
    </CardComponent>
  );
};

export default Card;