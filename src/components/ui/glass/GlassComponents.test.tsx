import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { GlassInput } from './GlassInput';

describe('UI Glass Components Snapshots', () => {
  it('GlassCard matches snapshot', () => {
    const { asFragment } = render(
      <GlassCard>
        <h1>Test Content</h1>
      </GlassCard>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('GlassButton matches snapshot (primary)', () => {
    const { asFragment } = render(
      <GlassButton variant="primary" size="md">
        Click Me
      </GlassButton>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('GlassInput matches snapshot (with icon and label)', () => {
    const { asFragment } = render(
      <GlassInput
        id="test-input"
        label="Email Address"
        placeholder="user@example.com"
        icon={<span>@</span>}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
