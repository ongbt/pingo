import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SheetPreviewModal from './SheetPreviewModal';

const mockSheet = {
  id: '123',
  title: 'Test Sheet',
  items: ['Item 1', 'Item 2'],
  is_default: true,
  play_count: 5,
  created_at: new Date().toISOString(),
  creator_id: null,
};

describe('SheetPreviewModal', () => {
  it('does not render if open is false or sheet is null', () => {
    render(<SheetPreviewModal sheet={null} open={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();
    
    render(<SheetPreviewModal sheet={mockSheet} open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();
  });

  it('renders sheet details when open', () => {
    render(<SheetPreviewModal sheet={mockSheet} open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Test Sheet')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('calls onSelect and onDuplicate when provided', () => {
    const onSelect = vi.fn();
    const onDuplicate = vi.fn();
    render(
      <SheetPreviewModal 
        sheet={mockSheet} 
        open={true} 
        onClose={vi.fn()} 
        onSelect={onSelect}
        onDuplicate={onDuplicate}
      />
    );
    
    fireEvent.click(screen.getByText('Select Sheet'));
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Duplicate this sheet'));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });
});
