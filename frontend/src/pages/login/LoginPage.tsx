import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/reduxHooks';
import { login } from '../../features/auth/authSlice';
import { loginAPI } from '../../features/auth/services/authService';
import { useNavigate } from 'react-router-dom';
import { useAsyncState } from '../../hooks/useAsyncState';
import { LoadingButton, ErrorMessage } from '../../components/LoadingComponents';
import styles from './LoginPage.module.scss';
import logo from '../../assets/Logo Texto.jpg';

const LoginPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { isLoading, error, execute, clearMessages } = useAsyncState({
        errorContext: 'Login'
    });

    const handleLogin = async () => {
        if (!username || !password) {
            return;
        }

        const result = await execute(
            () => loginAPI({ username, password }),
            {
                successMessage: 'Iniciando sesión...',
                errorContext: 'Inicio de sesión'
            }
        );

        if (result) {
            // Guardar en Redux
            dispatch(
                login({
                    id: result.id,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    accessToken: result.accessToken,
                    role: result.role,
                })
            );

            // Redirigir al dashboard
            navigate('/dashboard');
        }
    };

    const handleInputChange = () => {
        if (error) {
            clearMessages();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && username && password && !isLoading) {
            handleLogin();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <img src={logo} alt="Logo Empresa" className={styles.logo} />
                <h1 className={styles.title}>Bienvenido</h1>
                
                {error && (
                    <ErrorMessage 
                        message={error} 
                        onDismiss={clearMessages}
                    />
                )}
                
                <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        handleInputChange();
                    }}
                    onKeyDown={handleKeyDown}
                    className={styles.input}
                    disabled={isLoading}
                />
                <div className={styles.passwordWrapper}>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            handleInputChange();
                        }}
                        onKeyDown={handleKeyDown}
                        className={styles.input}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                
                <LoadingButton 
                    onClick={handleLogin} 
                    className={styles.button}
                    isLoading={isLoading}
                    loadingText="Iniciando sesión..."
                    disabled={!username || !password}
                >
                    Iniciar sesión
                </LoadingButton>
            </div>
        </div>
    );
};
export default LoginPage;
