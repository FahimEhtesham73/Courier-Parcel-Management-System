
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import LogoutButton from '../LogoutButton';
import { logout } from '../../features/auth/authSlice'; // Assuming logout action is exported from here

// Mock the useDispatch hook
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

// Mock the logout action
jest.mock('../../features/auth/authSlice', () => ({
  logout: jest.fn(),
}));

describe('LogoutButton', () => {
  test('dispatches logout action on click', () => {
    const dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);

    render(<LogoutButton />);

    // Find the button by its text content
    const logoutButton = screen.getByRole('button', { name: /Logout/i });

    // Simulate a click event
    fireEvent.click(logoutButton);

    // Check if the logout action was dispatched
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(logout());
  });
});