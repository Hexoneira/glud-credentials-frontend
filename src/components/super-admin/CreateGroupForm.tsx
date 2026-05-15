import GroupForm from '../super-admin/GroupForm';

interface CreateGroupFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupForm({ isOpen, onClose }: Readonly<CreateGroupFormProps>) {
  if (!isOpen) return null;

  return <GroupForm mode="create" onClose={onClose} />;
}
