import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import CreateGroupForm from '../super-admin/CreateGroupForm';
import GroupForm from '../super-admin/GroupForm';

vi.mock('./GroupForm', () => {
  return {
    default: vi.fn(() => <div data-testid="group-form-mock" />)
  };
});

describe('CreateGroupForm', () => {
  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(<CreateGroupForm isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza GroupForm con mode="create" si isOpen es true', () => {
    const onCloseMock = vi.fn();
    const { getByTestId } = render(<CreateGroupForm isOpen={true} onClose={onCloseMock} />);
    
    expect(getByTestId('group-form-mock')).toBeInTheDocument();
    expect(GroupForm).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'create', onClose: onCloseMock }),
      undefined
    );
  });
});
