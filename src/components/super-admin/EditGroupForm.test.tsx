import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import EditGroupForm from '../super-admin/EditGroupForm';
import GroupForm from '../super-admin/GroupForm';
import type { Tenant } from '../../services/api';

vi.mock('./GroupForm', () => {
  return {
    default: vi.fn(() => <div data-testid="group-form-mock" />)
  };
});

describe('EditGroupForm', () => {
  it('no renderiza nada si tenant es null', () => {
    const { container } = render(<EditGroupForm tenant={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza GroupForm con mode="edit" si tenant tiene valor', () => {
    const onCloseMock = vi.fn();
    const mockTenant: Tenant = {
      id: 't1',
      name: 'Tenant 1',
      tenantCode: 'T001',
      director: 'Directora Test',
      memberLimit: 50,
      currentMembers: 10,
      status: 'ACTIVE'
    };

    const { getByTestId } = render(<EditGroupForm tenant={mockTenant} onClose={onCloseMock} />);
    
    expect(getByTestId('group-form-mock')).toBeInTheDocument();
    expect(GroupForm).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'edit', tenant: mockTenant, onClose: onCloseMock }),
      undefined
    );
  });
});
