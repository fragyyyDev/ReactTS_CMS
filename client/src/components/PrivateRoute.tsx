import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import verifyToken from '../utils/verifyToken';

interface PrivateRouteProps {
    children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuth(false);
                setIsLoading(false);
                return;
            }

            const valid = await verifyToken(token);
            setIsAuth(valid);
            setIsLoading(false);
        })();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuth) {
        // Pokud token není platný, přesměrujeme na /login
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
