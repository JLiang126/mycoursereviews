import 'global-jsdom/register';
import { mock, afterEach } from 'node:test';
import React from 'react';
import { cleanup } from '@testing-library/react';

// Global cleanup after every test to prevent JSDOM body accumulation
afterEach(() => {
    cleanup();
});

// Global mocks for Next.js features using modern Node 26 exports.default API
mock.module('next/image', {
    exports: {
        default: ({ src, alt, width, height, priority, unoptimized, ...props }: any) => {
            return React.createElement('img', { src, alt, width, height, ...props });
        },
    },
});

mock.module('next/link', {
    exports: {
        default: ({ children, href, ...props }: any) => {
            return React.createElement('a', { href, ...props }, children);
        },
    },
});
