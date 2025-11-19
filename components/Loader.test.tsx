import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Loader', () => {
  it('should render without crashing', () => {
    const { container } = render(<Loader text="Loading..." />);
    expect(container).toBeInTheDocument();
  });

  it('should render spinner elements', () => {
    const { container } = render(<Loader text="Loading..." />);
    
    // Check for spinner elements
    const spinners = container.querySelectorAll('.animate-pulse, .animate-ping');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should render with different text props', () => {
    const { container: container1 } = render(<Loader text="Analyzing..." />);
    expect(container1).toBeInTheDocument();
    
    const { container: container2 } = render(<Loader text="Generating..." />);
    expect(container2).toBeInTheDocument();
  });
});
