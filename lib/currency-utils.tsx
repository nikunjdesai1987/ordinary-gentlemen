import React from 'react';

// Currency formatting utilities

export const formatCurrencyWithCoin = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatCurrencyWithCoinIcon = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

// For use in JSX where we want to display the currency separately
export const formatCurrencyAmount = (amount: number): string => {
  return amount.toFixed(2);
};
