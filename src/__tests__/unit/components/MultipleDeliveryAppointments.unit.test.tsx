import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MultipleDeliveryAppointments } from '../../../components/DeliveryManager/MultipleDeliveryAppointments';

describe('MultipleDeliveryAppointments Component Unit Tests', () => {
  const mockProps = {
    vehicleId: 'test-vehicle-1',
    vehicleName: 'Test Truck',
    onAppointmentsChange: vi.fn(),
    className: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('displays add appointment prompt when no appointments', () => {
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    expect(screen.getByText('Add appointment')).toBeInTheDocument();
  });

  test('opens form when clicking add appointment', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    expect(screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM')).toBeInTheDocument();
    expect(screen.getByText('Add Appointment')).toBeInTheDocument();
  });

  test('parses single time appointment correctly', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Walmart Distribution Center');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, '06/16/2025 9:00 AM');
    
    await user.click(screen.getByText('Add Appointment'));
    
    expect(mockProps.onAppointmentsChange).toHaveBeenCalledWith(
      'test-vehicle-1',
      expect.arrayContaining([
        expect.objectContaining({
          location: 'Walmart Distribution Center'
        })
      ])
    );
  });

  test('parses time range appointment correctly', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Target Store');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, '06/14/2025 9AM - 2PM');
    
    await user.click(screen.getByText('Add Appointment'));
    
    expect(mockProps.onAppointmentsChange).toHaveBeenCalledWith(
      'test-vehicle-1',
      expect.arrayContaining([
        expect.objectContaining({
          location: 'Target Store',
          notes: expect.stringContaining('Time range until')
        })
      ])
    );
  });

  test('handles relative date parsing (Tomorrow)', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Tomorrow Location');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, 'Tomorrow 10AM');
    
    await user.click(screen.getByText('Add Appointment'));
    
    expect(mockProps.onAppointmentsChange).toHaveBeenCalledWith(
      'test-vehicle-1',
      expect.arrayContaining([
        expect.objectContaining({
          location: 'Tomorrow Location'
        })
      ])
    );
  });

  test('handles day name parsing (Monday)', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Monday Location');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, 'Monday 2PM');
    
    await user.click(screen.getByText('Add Appointment'));
    
    expect(mockProps.onAppointmentsChange).toHaveBeenCalledWith(
      'test-vehicle-1',
      expect.arrayContaining([
        expect.objectContaining({
          location: 'Monday Location'
        })
      ])
    );
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    // Try to submit without filling fields
    await user.click(screen.getByText('Add Appointment'));
    
    expect(alertSpy).toHaveBeenCalledWith('Please enter both location and appointment time');
    expect(mockProps.onAppointmentsChange).not.toHaveBeenCalled();
    
    alertSpy.mockRestore();
  });

  test('handles invalid date format with error message', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const locationInput = screen.getByPlaceholderText('e.g., Walmart DC, 123 Main St');
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM');
    
    await user.type(locationInput, 'Test Location');
    await user.clear(dateTimeInput);
    await user.type(dateTimeInput, 'invalid date format');
    
    await user.click(screen.getByText('Add Appointment'));
    
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Please use format like'));
    expect(mockProps.onAppointmentsChange).not.toHaveBeenCalled();
    
    alertSpy.mockRestore();
  });

  test('closes form when clicking close button', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    expect(screen.getByText('Add Appointment')).toBeInTheDocument();
    
    await user.click(screen.getByText('✕'));
    
    expect(screen.queryByText('Add Appointment')).not.toBeInTheDocument();
    expect(screen.getByText('Add appointment')).toBeInTheDocument();
  });

  test('displays format examples in form', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    expect(screen.getByText('Examples:')).toBeInTheDocument();
    expect(screen.getByText('• 06/16/2025 7:00 AM')).toBeInTheDocument();
    expect(screen.getByText('• 06/14/2025 9AM - 2PM')).toBeInTheDocument();
    expect(screen.getByText('• Tomorrow 10AM')).toBeInTheDocument();
    expect(screen.getByText('• Monday 2PM')).toBeInTheDocument();
  });

  test('generates default datetime correctly', async () => {
    const user = userEvent.setup();
    
    render(<MultipleDeliveryAppointments {...mockProps} />);
    
    await user.click(screen.getByText('Add appointment'));
    
    const dateTimeInput = screen.getByPlaceholderText('e.g., 06/16/2025 9AM or 06/14/2025 9AM-2PM') as HTMLInputElement;
    
    // Should have a default value that looks like a date/time
    expect(dateTimeInput.value).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}(AM|PM)/);
  });
});