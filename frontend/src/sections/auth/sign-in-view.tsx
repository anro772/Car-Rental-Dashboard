import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import authService from 'src/services/authService';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state - initialize empty
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Validate inputs
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      // Call the login service
      await authService.login(email, password);

      // Setup axios interceptors for subsequent requests
      authService.setupAxiosInterceptors();

      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  const renderForm = (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        name="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@example.com"
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
      />

      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>

      <TextField
        fullWidth
        name="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        InputLabelProps={{ shrink: true }}
        type={showPassword ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        loading={loading}
        onClick={handleSignIn}
      >
        Sign in
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <Box gap={1.5} display="flex" flexDirection="column" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h5">Sign in to Car Rental Admin</Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your credentials to access the dashboard
        </Typography>
      </Box>

      {renderForm}

    </>
  );
}