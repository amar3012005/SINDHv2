import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import Login from '../Login';
import { UserProvider } from '../../context/UserContext';
import { TranslationProvider } from '../../context/TranslationContext';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock fetch
global.fetch = jest.fn();

const MockedLogin = () => (
  <BrowserRouter>
    <TranslationProvider>
      <UserProvider>
        <Login />
      </UserProvider>
    </TranslationProvider>
  </BrowserRouter>
);

describe('Login Component with OTP', () => {
  beforeEach(() => {
    fetch.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
    toast.info.mockClear();
  });

  test('renders login form initially', () => {
    render(<MockedLogin />);
    
    expect(screen.getByText('Welcome to S I N D H')).toBeInTheDocument();
    expect(screen.getByText('Enter your phone number to continue')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    expect(screen.getByText('Send OTP')).toBeInTheDocument();
  });

  test('shows validation error for invalid phone number', async () => {
    render(<MockedLogin />);
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    const sendOtpButton = screen.getByText('Send OTP');
    
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(sendOtpButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid 10-digit phone number');
    });
  });

  test('shows OTP form after valid phone number submission', async () => {
    render(<MockedLogin />);
    
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    const sendOtpButton = screen.getByText('Send OTP');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(sendOtpButton);
    
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('OTP sent to 9876543210. Use 0000 for testing.');
      expect(screen.getByText('Enter the OTP sent to your phone')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter 4-digit OTP')).toBeInTheDocument();
      expect(screen.getByText('Verify OTP')).toBeInTheDocument();
    });
  });

  test('validates OTP input', async () => {
    render(<MockedLogin />);
    
    // First, get to OTP screen
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    const sendOtpButton = screen.getByText('Send OTP');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(sendOtpButton);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 4-digit OTP')).toBeInTheDocument();
    });
    
    // Test invalid OTP
    const otpInput = screen.getByPlaceholderText('Enter 4-digit OTP');
    const verifyButton = screen.getByText('Verify OTP');
    
    fireEvent.change(otpInput, { target: { value: '1234' } });
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP. Use 0000 for testing.')).toBeInTheDocument();
    });
  });

  test('allows going back to phone number input', async () => {
    render(<MockedLogin />);
    
    // Get to OTP screen
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    const sendOtpButton = screen.getByText('Send OTP');
    
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(sendOtpButton);
    
    await waitFor(() => {
      expect(screen.getByText('← Change phone number')).toBeInTheDocument();
    });
    
    // Click back button
    const backButton = screen.getByText('← Change phone number');
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText('Enter your phone number to continue')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });
  });

  test('user type selection works', () => {
    render(<MockedLogin />);
    
    const workerButton = screen.getByText('Worker');
    const employerButton = screen.getByText('Employer');
    
    // Initially worker should be selected
    expect(workerButton).toHaveClass('bg-blue-600');
    expect(employerButton).toHaveClass('bg-gray-100');
    
    // Click employer
    fireEvent.click(employerButton);
    
    expect(employerButton).toHaveClass('bg-blue-600');
    expect(workerButton).toHaveClass('bg-gray-100');
  });
});
