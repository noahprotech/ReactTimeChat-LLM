import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '@/services/api';
import { User, LoginCredentials, RegisterData, ApiError } from '@/types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => apiService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries(['profile']);
      toast.success('Login successful!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => apiService.register(data),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries(['profile']);
      toast.success('Registration successful!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: (error: ApiError) => {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      queryClient.clear();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => apiService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries(['profile']);
      toast.success('Profile updated successfully!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { old_password: string; new_password: string; new_password_confirm: string }) =>
      apiService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to change password');
    },
  });

  const login = (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  const register = (data: RegisterData) => {
    return registerMutation.mutateAsync(data);
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const updateProfile = (data: Partial<User>) => {
    return updateProfileMutation.mutateAsync(data);
  };

  const changePassword = (data: { old_password: string; new_password: string; new_password_confirm: string }) => {
    return changePasswordMutation.mutateAsync(data);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
