import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { jsx as _jsx } from 'react/jsx-runtime';

describe('Input', () => {
  it('renders correctly with default type "text"', () => {
    render(_jsx(Input, { placeholder: 'Enter text', type: 'text' }));
    const inputElement = screen.getByPlaceholderText('Enter text');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'text');
    expect(inputElement).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md');
  });

  it('renders with a custom type', () => {
    render(_jsx(Input, { type: 'email', placeholder: 'Enter email' }));
    const inputElement = screen.getByPlaceholderText('Enter email');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'email');
  });

  it('applies additional className', () => {
    render(_jsx(Input, { className: 'custom-input-class', 'data-testid': 'test-input' }));
    const inputElement = screen.getByTestId('test-input');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveClass('custom-input-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(_jsx(Input, { ref: ref, 'data-testid': 'ref-input' }));
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('handles disabled state', () => {
    render(_jsx(Input, { disabled: true, placeholder: 'Disabled input' }));
    const inputElement = screen.getByPlaceholderText('Disabled input');
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('displays placeholder text', () => {
    render(_jsx(Input, { placeholder: 'Search here...' }));
    const inputElement = screen.getByPlaceholderText('Search here...');
    expect(inputElement).toBeInTheDocument();
  });

  it('handles value attribute', () => {
    render(_jsx(Input, { value: 'Initial Value', onChange: () => { }, readOnly: true }));
    const inputElement = screen.getByDisplayValue('Initial Value');
    expect(inputElement).toBeInTheDocument();
  });
});
