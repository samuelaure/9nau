import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'

describe('Card components', () => {
  it('Card renders correctly with children and className', () => {
    render(_jsx(Card, { className: 'test-card-class', children: _jsx('div', { children: 'Card Content' }) }))
    const card = screen.getByText('Card Content').closest('.test-card-class')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm')
  })

  it('CardHeader renders correctly with children and className', () => {
    render(_jsx(CardHeader, { className: 'test-header-class', children: 'Header Content' }))
    const header = screen.getByText('Header Content').closest('.test-header-class')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('CardTitle renders correctly with children and className', () => {
    render(_jsx(CardTitle, { className: 'test-title-class', children: 'Card Title' }))
    const title = screen.getByText('Card Title')
    expect(title).toBeInTheDocument()
    expect(title.tagName).toBe('H3')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  it('CardDescription renders correctly with children and className', () => {
    render(_jsx(CardDescription, { className: 'test-description-class', children: 'Card Description' }))
    const description = screen.getByText('Card Description')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('P')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('CardContent renders correctly with children and className', () => {
    render(_jsx(CardContent, { className: 'test-content-class', children: 'Content Area' }))
    const content = screen.getByText('Content Area').closest('.test-content-class')
    expect(content).toBeInTheDocument()
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('CardFooter renders correctly with children and className', () => {
    render(_jsx(CardFooter, { className: 'test-footer-class', children: 'Footer Text' }))
    const footer = screen.getByText('Footer Text').closest('.test-footer-class')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('All components can be used together', () => {
    render(
      _jsxs(Card, {
        children: [
          _jsxs(CardHeader, {
            children: [
              _jsx(CardTitle, { children: 'Full Card Title' }),
              _jsx(CardDescription, { children: 'Full Card Description' }),
            ],
          }),
          _jsx(CardContent, { children: 'Full Card Content' }),
          _jsx(CardFooter, { children: 'Full Card Footer' }),
        ],
      })
    )
    expect(screen.getByText('Full Card Title')).toBeInTheDocument()
    expect(screen.getByText('Full Card Description')).toBeInTheDocument()
    expect(screen.getByText('Full Card Content')).toBeInTheDocument()
    expect(screen.getByText('Full Card Footer')).toBeInTheDocument()
  })
})
