import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen, cleanup } from '@testing-library/react';
import GroupForm from '../super-admin/GroupForm';
import { createTenant, updateTenant } from '../../services/api';
import type { Tenant } from '../../services/api';

vi.mock('../../services/api', () => ({
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}));

describe('GroupForm', () => {
  const onCloseMock = vi.fn();
  let dispatchEventSpy: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
    onCloseMock.mockReset();
    dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renderiza correctamente en modo create', () => {
    render(<GroupForm mode="create" onClose={onCloseMock} />);
    expect(screen.getAllByText('Registro')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Registrar Grupo')[0]).toBeInTheDocument();
  });

  it('renderiza correctamente en modo edit con datos', () => {
    const tenant: Tenant = { id: '1', name: 'Test', tenantCode: 'TST', director: 'Directora Test', memberLimit: 20, currentMembers: 0, status: 'ACTIVE' };
    render(<GroupForm mode="edit" tenant={tenant} onClose={onCloseMock} />);
    expect(screen.getAllByText('Edición')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Guardar Cambios')[0]).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('Test')[0]).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('TST')[0]).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('Directora Test')[0]).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('20')[0]).toBeInTheDocument();
  });

  it('muestra errores de validación', async () => {
    render(<GroupForm mode="create" onClose={onCloseMock} />);
    
    // Dejar campos vacíos o inválidos
    const submitBtn = screen.getAllByText('Registrar Grupo')[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('El nombre es obligatorio')[0]).toBeInTheDocument();
      expect(screen.getAllByText('El director es obligatorio')[0]).toBeInTheDocument();
      expect(screen.getAllByText('El código de tenant es obligatorio')[0]).toBeInTheDocument();
    });

    // Probar nombres cortos y límites inválidos
    fireEvent.change(screen.getAllByLabelText(/Nombre del Grupo/i)[0], { target: { value: 'ab' } });
    fireEvent.change(screen.getAllByLabelText(/Director\/a del Grupo/i)[0], { target: { value: 'xy' } });
    fireEvent.change(screen.getAllByLabelText(/Código Tenant/i)[0], { target: { value: 'a' } });
    fireEvent.change(screen.getAllByLabelText(/Límite de Miembros/i)[0], { target: { value: '0' } });
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Mínimo 3 caracteres')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Usa 3-30 caracteres alfanuméricos, "_" o "-"')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Debe ser un número mayor a 0')[0]).toBeInTheDocument();
    });
    
    // Probar límite superior
    fireEvent.change(screen.getByLabelText(/Límite de Miembros/i), { target: { value: '1001' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getAllByText('Máximo 1000 miembros')[0]).toBeInTheDocument();
    });
  });

  it('envía datos correctamente en modo create', async () => {
    vi.mocked(createTenant).mockResolvedValue({ id: '1', name: 'Nuevo', tenantCode: 'NVO', director: 'Directora', memberLimit: 50, currentMembers: 0, status: 'ACTIVE' });
    
    render(<GroupForm mode="create" onClose={onCloseMock} />);
    
    fireEvent.change(screen.getAllByLabelText(/Nombre del Grupo/i)[0], { target: { value: 'Nuevo Grupo' } });
    fireEvent.change(screen.getAllByLabelText(/Director\/a del Grupo/i)[0], { target: { value: 'Directora' } });
    fireEvent.change(screen.getAllByLabelText(/Código Tenant/i)[0], { target: { value: 'NUEVO_TENANT' } });
    fireEvent.change(screen.getAllByLabelText(/Límite de Miembros/i)[0], { target: { value: '10' } });
    
    fireEvent.click(screen.getAllByText('Registrar Grupo')[0]);

    await waitFor(() => {
      expect(createTenant).toHaveBeenCalledWith({
        name: 'Nuevo Grupo',
        tenantCode: 'NUEVO_TENANT',
        director: 'Directora',
        memberLimit: 10,
        primaryColor: '#22fefb',
        logoUrl: undefined,
      });
      expect(screen.getAllByText('Grupo creado correctamente')[0]).toBeInTheDocument();
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
    
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('envía datos correctamente en modo edit', async () => {
    const tenant: Tenant = { id: 't1', name: 'Original', tenantCode: 'ORG', director: 'Directora Original', memberLimit: 20, currentMembers: 0, status: 'ACTIVE' };
    vi.mocked(updateTenant).mockResolvedValue({ ...tenant, name: 'Actualizado' });
    
    render(<GroupForm mode="edit" tenant={tenant} onClose={onCloseMock} />);
    
    fireEvent.change(screen.getAllByLabelText(/Nombre del Grupo/i)[0], { target: { value: 'Actualizado' } });
    fireEvent.change(screen.getAllByLabelText(/Director\/a del Grupo/i)[0], { target: { value: 'Directora Actualizada' } });
    
    fireEvent.click(screen.getAllByText('Guardar Cambios')[0]);

    await waitFor(() => {
      expect(updateTenant).toHaveBeenCalledWith('t1', {
        name: 'Actualizado',
        director: 'Directora Actualizada',
        memberLimit: 20,
        primaryColor: '#22fefb',
        logoUrl: undefined,
      });
      expect(screen.getAllByText('Grupo actualizado correctamente')[0]).toBeInTheDocument();
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
    
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('maneja errores del backend al enviar', async () => {
    vi.mocked(createTenant).mockRejectedValue(new Error('Error del servidor'));
    
    const { container } = render(<GroupForm mode="create" onClose={onCloseMock} />);
    
    const nameInput = container.querySelector('#group-name') as HTMLInputElement;
    const directorInput = container.querySelector('#group-director') as HTMLInputElement;
    const codeInput = container.querySelector('#tenant-code') as HTMLInputElement;
    const limitInput = container.querySelector('#member-limit') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    fireEvent.change(nameInput, { target: { value: 'Valido' } });
    fireEvent.change(directorInput, { target: { value: 'Directora' } });
    fireEvent.change(codeInput, { target: { value: 'VALIDO' } });
    fireEvent.change(limitInput, { target: { value: '10' } });
    
    fireEvent.submit(form);

    await waitFor(() => expect(createTenant).toHaveBeenCalled(), { timeout: 3000 });
    const errorMsgs = await screen.findAllByText('Error del servidor');
    expect(errorMsgs[0]).toBeInTheDocument();
  });

  it('cierra el modal al presionar Escape', () => {
    render(<GroupForm mode="create" onClose={onCloseMock} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalled();
  });
  
  it('cierra el modal al hacer click en el overlay', () => {
    render(<GroupForm mode="create" onClose={onCloseMock} />);
    fireEvent.click(screen.getAllByLabelText('Cerrar modal')[0]);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
