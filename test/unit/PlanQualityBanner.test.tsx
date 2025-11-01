import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlanQualityBanner from '@/components/PlanQualityBanner';
import type { PlanQuality } from '@/types';

describe('PlanQualityBanner', () => {
  const mockQuality: PlanQuality = {
    score: 0.85,
    warnings: [
      {
        type: 'split-session',
        severity: 'info',
        sessionIds: ['2025-11-03-lit-1', '2025-11-03-lit-2'],
        message: '2025-11-03: Training split into 2 sessions (150 TSS total)',
      },
      {
        type: 'tss-reduced',
        severity: 'warning',
        sessionIds: ['2025-11-05-lit'],
        message: '2025-11-05: TSS reduced due to time constraints',
        details: {
          originalTss: 80,
          adjustedTss: 40,
        }
      }
    ],
    adjustments: {
      splitSessions: 1,
      tssReduced: 1,
      totalTssLost: 40,
    },
    factors: {
      timeSlotMatch: 0.90,
      trainingDistribution: 0.85,
      recoveryAdequacy: 0.80,
    }
  };

  describe('Rendering', () => {
    it('should not render when there are no warnings', () => {
      const emptyQuality: PlanQuality = {
        ...mockQuality,
        warnings: [],
      };

      const { container } = render(
        <PlanQualityBanner quality={emptyQuality} planId="2025-W45" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with warnings', () => {
      render(<PlanQualityBanner quality={mockQuality} planId="2025-W45" />);

      expect(screen.getByText(/Plan Quality Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/2025-W45/i)).toBeInTheDocument();
    });

    it('should display quality score as percentage', () => {
      render(<PlanQualityBanner quality={mockQuality} planId="2025-W45" />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should display adjustment statistics', () => {
      render(<PlanQualityBanner quality={mockQuality} planId="2025-W45" />);

      expect(screen.getByText(/1 training split into multiple sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/1 training with reduced TSS/i)).toBeInTheDocument();
      expect(screen.getByText(/40 TSS total/i)).toBeInTheDocument();
    });

    it('should show warning count', () => {
      render(<PlanQualityBanner quality={mockQuality} planId="2025-W45" />);

      expect(screen.getByText(/View Details \(2 items\)/i)).toBeInTheDocument();
    });
  });

  describe('Severity Styling', () => {
    it('should use info styling when only info warnings', () => {
      const infoQuality: PlanQuality = {
        ...mockQuality,
        warnings: [
          {
            type: 'split-session',
            severity: 'info',
            sessionIds: [],
            message: 'Info message',
          }
        ],
      };

      const { container } = render(
        <PlanQualityBanner quality={infoQuality} planId="2025-W45" />
      );

      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('blue');
    });

    it('should use warning styling when warnings present', () => {
      const warningQuality: PlanQuality = {
        ...mockQuality,
        warnings: [
          {
            type: 'tss-reduced',
            severity: 'warning',
            sessionIds: [],
            message: 'Warning message',
          }
        ],
      };

      const { container } = render(
        <PlanQualityBanner quality={warningQuality} planId="2025-W45" />
      );

      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('yellow');
    });

    it('should use error styling when errors present', () => {
      const errorQuality: PlanQuality = {
        ...mockQuality,
        warnings: [
          {
            type: 'insufficient-time',
            severity: 'error',
            sessionIds: [],
            message: 'Error message',
          }
        ],
      };

      const { container } = render(
        <PlanQualityBanner quality={errorQuality} planId="2025-W45" />
      );

      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain('red');
    });
  });

  describe('Quality Score Colors', () => {
    it('should show green for excellent quality (90%+)', () => {
      const excellentQuality: PlanQuality = {
        ...mockQuality,
        score: 0.95,
      };

      const { container } = render(
        <PlanQualityBanner quality={excellentQuality} planId="2025-W45" />
      );

      const scoreElement = screen.getByText('95%');
      expect(scoreElement.className).toContain('green');
    });

    it('should show yellow for good quality (75-89%)', () => {
      const goodQuality: PlanQuality = {
        ...mockQuality,
        score: 0.80,
      };

      const { container } = render(
        <PlanQualityBanner quality={goodQuality} planId="2025-W45" />
      );

      const scoreElement = screen.getByText('80%');
      expect(scoreElement.className).toContain('yellow');
    });

    it('should show red for poor quality (<75%)', () => {
      const poorQuality: PlanQuality = {
        ...mockQuality,
        score: 0.60,
      };

      const { container } = render(
        <PlanQualityBanner quality={poorQuality} planId="2025-W45" />
      );

      const scoreElement = screen.getByText('60%');
      expect(scoreElement.className).toContain('red');
    });
  });

  describe('Interactions', () => {
    it('should call onDismiss when close button clicked', () => {
      const onDismiss = vi.fn();
      
      render(
        <PlanQualityBanner 
          quality={mockQuality} 
          planId="2025-W45" 
          onDismiss={onDismiss}
          dismissible={true}
        />
      );

      const closeButton = screen.getByLabelText(/Hinweis schließen/i);
      fireEvent.click(closeButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should hide after dismiss', () => {
      const { container } = render(
        <PlanQualityBanner 
          quality={mockQuality} 
          planId="2025-W45"
          dismissible={true}
        />
      );

      const closeButton = screen.getByLabelText(/Hinweis schließen/i);
      fireEvent.click(closeButton);

      expect(container.firstChild).toBeNull();
    });

    it('should not show close button when not dismissible', () => {
      render(
        <PlanQualityBanner 
          quality={mockQuality} 
          planId="2025-W45"
          dismissible={false}
        />
      );

      const closeButton = screen.queryByLabelText(/Hinweis schließen/i);
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should expand details when clicked', () => {
      render(<PlanQualityBanner quality={mockQuality} planId="2025-W45" />);

      const detailsToggle = screen.getByText(/View Details/i);
      fireEvent.click(detailsToggle);

      // Check if warning messages are now visible
      expect(screen.getByText(/Training split into 2 sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/TSS reduced due to time constraints/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle many warnings gracefully', () => {
      const manyWarnings: PlanQuality = {
        ...mockQuality,
        warnings: Array.from({ length: 10 }, (_, i) => ({
          type: 'split-session' as const,
          severity: 'info' as const,
          sessionIds: [`session-${i}`],
          message: `Warning ${i}`,
        })),
      };

      render(<PlanQualityBanner quality={manyWarnings} planId="2025-W45" />);

      expect(screen.getByText(/View Details \(10 items\)/i)).toBeInTheDocument();
      
      // Should show "+ 5 more..." since we only display first 5
      const detailsToggle = screen.getByText(/View Details/i);
      fireEvent.click(detailsToggle);
      expect(screen.getByText(/\+ 5 more\.\.\./i)).toBeInTheDocument();
    });

    it('should handle zero adjustments', () => {
      const noAdjustments: PlanQuality = {
        score: 0.85,
        warnings: [
          {
            type: 'suboptimal-timing',
            severity: 'info',
            sessionIds: [],
            message: 'Some warning without adjustments',
          }
        ],
        adjustments: {
          splitSessions: 0,
          tssReduced: 0,
          totalTssLost: 0,
        },
        factors: {
          timeSlotMatch: 0.90,
          trainingDistribution: 0.85,
          recoveryAdequacy: 0.80,
        }
      };

      render(<PlanQualityBanner quality={noAdjustments} planId="2025-W45" />);

      // Should not show "Adjustments Made:" section
      expect(screen.queryByText(/Adjustments Made:/i)).not.toBeInTheDocument();
    });
  });
});
