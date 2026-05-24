import type { Config } from 'jest';

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^ky$': '<rootDir>/jest/__mocks__/ky.js',
        '^next-auth$': '<rootDir>/jest/__mocks__/next-auth.js',
        '^next-auth/providers/keycloak$': '<rootDir>/jest/__mocks__/next-auth/providers/keycloak.js',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['<rootDir>/jest.setup.js'],
    preset: 'ts-jest/presets/default-esm',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.jest.json' }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!next-auth|@auth/core|@babel/runtime|ky).+\\.js$',
    ],
};

export default config;
