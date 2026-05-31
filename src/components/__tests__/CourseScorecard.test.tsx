import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CourseScorecard } from '../CourseScorecard';

describe('CourseScorecard Component', () => {
    it('renders N/A when totalReviews is 0', () => {
        const stats = {
            avgOverall: 0,
            avgDifficulty: 0,
            avgUsefulness: 0,
            avgEnjoyment: 0,
            totalReviews: 0,
        };

        render(<CourseScorecard stats={stats} />);

        // Verify N/A output for overall score and metrics
        assert.strictEqual(screen.getAllByText('N/A').length, 4);
        assert.ok(screen.getByText('Based on 0 reviews'));
    });

    it('renders correct singular review text', () => {
        const stats = {
            avgOverall: 4,
            avgDifficulty: 3,
            avgUsefulness: 4,
            avgEnjoyment: 5,
            totalReviews: 1,
        };

        render(<CourseScorecard stats={stats} />);
        assert.ok(screen.getByText('Based on 1 review'));
    });

    it('renders high difficulty (red state) metrics correctly', () => {
        const stats = {
            avgOverall: 4.5,
            avgDifficulty: 4.5, // > 3.5 should render red segments
            avgUsefulness: 4.0,
            avgEnjoyment: 4.2,
            totalReviews: 5,
        };

        const { container } = render(<CourseScorecard stats={stats} />);

        assert.ok(screen.getByText('4.5'));
        assert.ok(screen.getByText('4.5 / 5'));
        assert.ok(screen.getByText('Based on 5 reviews'));

        // Check for red segments (bg-red)
        const redSegments = container.getElementsByClassName('bg-red');
        assert.ok(redSegments.length > 0);
    });

    it('renders medium difficulty (orange state) metrics correctly', () => {
        const stats = {
            avgOverall: 3.5,
            avgDifficulty: 3.0, // > 2.5 and <= 3.5 should render orange segments
            avgUsefulness: 3.0,
            avgEnjoyment: 3.0,
            totalReviews: 5,
        };

        const { container } = render(<CourseScorecard stats={stats} />);

        // Check for orange segments (bg-orange)
        const orangeSegments = container.getElementsByClassName('bg-orange');
        assert.ok(orangeSegments.length > 0);
    });

    it('renders low difficulty (yellow state) metrics correctly', () => {
        const stats = {
            avgOverall: 2.5,
            avgDifficulty: 2.0, // <= 2.5 should render yellow segments
            avgUsefulness: 2.0,
            avgEnjoyment: 2.0,
            totalReviews: 5,
        };

        const { container } = render(<CourseScorecard stats={stats} />);

        // Check for yellow segments (bg-yellow) in difficulty section
        const yellowSegments = container.getElementsByClassName('bg-yellow');
        assert.ok(yellowSegments.length > 0);
    });
});
