import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click Me</Button>)
    const button = screen.getByText('Click Me')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
    expect(button).toHaveClass('h-10')
  })

  it('renders with a custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByText('Secondary Button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-secondary')
  })

  it('renders with a custom size', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByText('Small Button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('h-9')
  })

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <div data-testid="child-div">Child Content</div>
      </Button>
    )
    const childDiv = screen.getByTestId('child-div')
    expect(childDiv).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies additional className', () => {
    render(<Button className="custom-class">Styled Button</Button>)
    const button = screen.getByText('Styled Button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    expect(ref.current).toBeInTheDocument()
    expect(ref.current?.tagName).toBe('BUTTON')
  })

  it('handles disabled state', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByText('Disabled Button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })
})
