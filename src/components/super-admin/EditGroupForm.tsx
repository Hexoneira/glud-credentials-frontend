import type { Tenant } from '../services/api';
import GroupForm from './GroupForm';

interface EditGroupFormProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export default function EditGroupForm({ tenant, onClose }: Readonly<EditGroupFormProps>) {
  if (!tenant) return null;

  return <GroupForm mode="edit" tenant={tenant} onClose={onClose} />;
}
