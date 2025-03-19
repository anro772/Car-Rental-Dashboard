// src/components/auth/protected-route.tsx
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import authService from 'src/services/authService';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const isLoggedIn = authService.isLoggedIn();
            setAuthenticated(isLoggedIn);
            setChecking(false);

            // Setup interceptors if authenticated
            if (isLoggedIn) {
                authService.setupAxiosInterceptors();
            }
        };

        checkAuth();
    }, []);

    if (checking) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!authenticated) {
        return <Navigate to="/sign-in" replace />;
    }

    return <>{children}</>;
}