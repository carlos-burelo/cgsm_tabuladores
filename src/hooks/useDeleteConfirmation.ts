import { useState } from 'react';

export interface DeleteConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
}

export function useDeleteConfirmation() {
  const [state, setState] = useState<DeleteConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const openConfirmation = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setState({
      isOpen: true,
      title,
      description,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const confirm = async () => {
    await state.onConfirm();
    closeConfirmation();
  };

  return {
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    openConfirmation,
    closeConfirmation,
    confirm,
  };
}
