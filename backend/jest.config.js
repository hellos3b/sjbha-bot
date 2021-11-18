/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { pathsToModuleNameMapper } = require ('ts-jest/utils');
const { compilerOptions } = require ('./tsconfig');


/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset:           'ts-jest',
  testEnvironment:  'node',
  moduleNameMapper: pathsToModuleNameMapper (compilerOptions.paths, { prefix: '<rootDir>/src/' })
};