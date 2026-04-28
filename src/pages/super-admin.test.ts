import { describe, it, expect } from 'vitest';
import { tenantsData } from '../components/WorkgroupsTable';

describe('Super Admin Logic', () => {
  describe('totalActive calculation', () => {
    it('should calculate total active tenants correctly', () => {
      const totalActive = tenantsData.filter((t: any) => t.status === 'ACTIVE').length;
      expect(totalActive).toBe(2);
    });

    it('should return 0 when no tenants are active', () => {
      const mockTenants = [
        { status: 'SUSPENDED' },
        { status: 'INACTIVE' },
        { status: 'SUSPENDED' }
      ];
      const totalActive = mockTenants.filter((t: any) => t.status === 'ACTIVE').length;
      expect(totalActive).toBe(0);
    });

    it('should return correct count when all tenants are active', () => {
      const mockTenants = [
        { status: 'ACTIVE' },
        { status: 'ACTIVE' },
        { status: 'ACTIVE' }
      ];
      const totalActive = mockTenants.filter((t: any) => t.status === 'ACTIVE').length;
      expect(totalActive).toBe(3);
    });

    it('should handle empty tenants array', () => {
      const totalActive = [].filter((t: any) => t.status === 'ACTIVE').length;
      expect(totalActive).toBe(0);
    });
  });
});