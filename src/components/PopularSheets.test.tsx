import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PopularSheets, { SeeAllLink } from './PopularSheets';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Convex
const mockUseQuery = vi.fn();
vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// Mock API route (since we import it directly)
vi.mock('../../convex/_generated/api', () => ({
  api: {
    sheets: {
      getPopular: 'mock-getPopular',
    },
  },
}));

describe('PopularSheets Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReset();
  });

  it('renders loading skeletons when data is undefined', () => {
    mockUseQuery.mockReturnValue(undefined);
    const { container } = render(<PopularSheets />);

    // There should be 3 skeleton divs with animate-pulse
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('renders nothing when there are no sheets', () => {
    mockUseQuery.mockReturnValue([]);
    const { container } = render(<PopularSheets />);
    expect(container.firstChild).toBeNull();
  });

  it('renders popular sheets correctly when data is available', () => {
    mockUseQuery.mockReturnValue([
      {
        _id: 'sheet-123',
        title: 'Super Fun Bingo',
        items: ['A', 'B', 'C'],
        playCount: 1500,
        isDefault: true,
        creatorId: null,
        _creationTime: 1672531200000,
      },
      {
        _id: 'sheet-456',
        title: 'Mildly Fun Bingo',
        items: ['X', 'Y'],
        playCount: 5,
        isDefault: false,
        creatorId: 'user-789',
        _creationTime: 1672531200000,
      },
    ]);

    render(<PopularSheets />);

    // Check titles
    expect(screen.getByText('Super Fun Bingo')).toBeInTheDocument();
    expect(screen.getByText('Mildly Fun Bingo')).toBeInTheDocument();

    // Check formatting (1500 -> 1.5k)
    expect(screen.getByText(/1.5k plays/i)).toBeInTheDocument();
    // 5 -> 5
    expect(screen.getByText(/5 plays/i)).toBeInTheDocument();
  });

  it('navigates to create page on sheet click', () => {
    mockUseQuery.mockReturnValue([
      {
        _id: 'sheet-123',
        title: 'Super Fun Bingo',
        items: [],
        playCount: 1,
        isDefault: true,
        creatorId: null,
        _creationTime: 0,
      },
    ]);

    render(<PopularSheets />);

    const sheetButton = screen.getByRole('button');
    fireEvent.click(sheetButton);
    expect(mockNavigate).toHaveBeenCalledWith('/create?sheetId=sheet-123');
  });
});

describe('SeeAllLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to /sheets on click', () => {
    render(<SeeAllLink />);
    const button = screen.getByRole('button', { name: /see all/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/sheets');
  });
});
