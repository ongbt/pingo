import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDialog from './ErrorDialog';

describe('ErrorDialog', () => {
  it('does not render when open is false', () => {
    render(<ErrorDialog open={false} title="Error" message="Test error" onClose={vi.fn()} />);
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('renders title and message when open is true', () => {
    render(<ErrorDialog open={true} title="Oops" message="Something broke" onClose={vi.fn()} />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders details list if provided', () => {
    const details = ['Detail 1', 'Detail 2'];
    render(<ErrorDialog open={true} title="Err" message="Msg" details={details} onClose={vi.fn()} />);
    
    expect(screen.getByText('Detail 1')).toBeInTheDocument();
    expect(screen.getByText('Detail 2')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorDialog open={true} title="Err" message="Msg" onClose={onClose} />);
    
    const gotItButton = screen.getByRole('button', { name: /got it/i });
    fireEvent.click(gotItButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
