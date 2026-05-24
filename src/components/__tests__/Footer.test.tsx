import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Footer } from '../Footer';

describe('Footer Component', () => {
    it('renders the branding text and copyrights successfully', () => {
        render(<Footer />);

        // Assert branding presence
        expect(screen.getByText(/MyCourse/)).toBeInTheDocument();
        expect(screen.getByText(/Reviews/)).toBeInTheDocument();

        // Assert copyright reference
        expect(screen.getByText(/Adelaide University Computer Science Club/)).toBeInTheDocument();
    });

    it('contains interactive modal toggle triggers for About, Disclaimer, and Privacy', () => {
        render(<Footer />);

        const aboutTrigger = screen.getByText('About');
        const disclaimerTrigger = screen.getByText('Disclaimer');
        const privacyTrigger = screen.getByText('Privacy');

        expect(aboutTrigger).toBeInTheDocument();
        expect(disclaimerTrigger).toBeInTheDocument();
        expect(privacyTrigger).toBeInTheDocument();
    });
});
