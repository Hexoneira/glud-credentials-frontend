# Unit Tests for Super Admin Functionality

This project includes unit tests for the super admin functionality using Vitest and React Testing Library.

## Test Files

### `src/pages/super-admin.test.ts`
Tests the logic used in the super-admin page, specifically:
- Calculation of total active tenants
- Edge cases for tenant filtering

### `src/components/WorkgroupsTable.test.tsx`
Tests the WorkgroupsTable component, including:
- Data structure validation
- Statistics calculations (total groups, active groups, total members)
- Component rendering (currently skipped due to CSS environment issues)

## Setup

### Dependencies
- `vitest` - Test runner
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Additional Jest DOM matchers
- `happy-dom` - DOM environment for testing
- `@types/node` - Node.js type definitions

### Configuration
- `vitest.config.ts` - Vitest configuration with React plugin and happy-dom environment
- `src/test/setup.ts` - Test setup with DOM mocks and Jest DOM matchers
- `tsconfig.json` - TypeScript configuration with Vitest globals

## Running Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## VS Code Syntax Recognition Issues

If VS Code is not recognizing the test syntax properly:

1. **Restart TypeScript Language Server**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

2. **Reload Window**: `Ctrl+Shift+P` → "Developer: Reload Window"

3. **Check TypeScript Configuration**: Ensure `tsconfig.json` includes:
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "@testing-library/jest-dom"]
     }
   }
   ```

4. **Install VS Code Extensions**:
   - "Vitest" extension for better test file recognition
   - Ensure TypeScript and JavaScript extensions are up to date

## Test Structure

The tests follow this structure:
- **Logic Tests**: Pure function testing without DOM rendering
- **Component Tests**: React component testing with proper mocking
- **Integration Tests**: Full component behavior testing

## Current Test Coverage

- ✅ Super admin tenant calculations
- ✅ WorkgroupsTable data validation and statistics
- ✅ Form validation logic (CreateGroupForm)
- ✅ Tenant code generation logic

## Future Improvements

- Add component rendering tests with proper CSS mocking
- Add integration tests for complete user workflows
- Add accessibility testing
- Add performance testing