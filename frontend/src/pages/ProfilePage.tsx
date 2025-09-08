import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  Email,
  CalendarToday,
  Security,
  Settings,
  Save,
  Edit,
  Cancel,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const profileSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

const passwordSchema = yup.object({
  old_password: yup.string().required('Current password is required'),
  new_password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  new_password_confirm: yup
    .string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Password confirmation is required'),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ProfilePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { user, updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useAuthContext();

  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordError(null);
      setPasswordSuccess(false);
      await changePassword(data);
      setPasswordSuccess(true);
      passwordForm.reset();
    } catch (error: any) {
      setPasswordError(error.message || 'Password change failed');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      profileForm.reset();
    }
    setIsEditing(!isEditing);
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>
      </motion.div>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Profile Information" />
            <Tab label="Security" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3,
              }}
            >
              {user.first_name[0]}{user.last_name[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                {user.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {format(new Date(user.created_at), 'MMMM yyyy')}
              </Typography>
            </Box>
          </Box>

          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="first_name"
                  control={profileForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      disabled={!isEditing}
                      error={!!profileForm.formState.errors.first_name}
                      helperText={profileForm.formState.errors.first_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="last_name"
                  control={profileForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Last Name"
                      disabled={!isEditing}
                      error={!!profileForm.formState.errors.last_name}
                      helperText={profileForm.formState.errors.last_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={profileForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      disabled={!isEditing}
                      error={!!profileForm.formState.errors.email}
                      helperText={profileForm.formState.errors.email?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              {isEditing ? (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleEditToggle}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={handleEditToggle}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </form>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your password to keep your account secure
          </Typography>

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password changed successfully!
            </Alert>
          )}

          {passwordError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name="old_password"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Current Password"
                      type="password"
                      error={!!passwordForm.formState.errors.old_password}
                      helperText={passwordForm.formState.errors.old_password?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="new_password"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="New Password"
                      type="password"
                      error={!!passwordForm.formState.errors.new_password}
                      helperText={passwordForm.formState.errors.new_password?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="new_password_confirm"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      error={!!passwordForm.formState.errors.new_password_confirm}
                      helperText={passwordForm.formState.errors.new_password_confirm?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              startIcon={<Security />}
              disabled={isChangingPassword}
              sx={{ mt: 3 }}
            >
              {isChangingPassword ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          </form>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Account Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Customize your account settings and preferences
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <Email />
              </ListItemIcon>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive email updates about your account"
              />
              <Switch defaultChecked />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary="Use dark theme for the interface"
              />
              <Switch />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText
                primary="Profile Visibility"
                secondary="Make your profile visible to other users"
              />
              <Switch defaultChecked />
            </ListItem>
          </List>
        </TabPanel>
      </Card>
    </Box>
  );
};
