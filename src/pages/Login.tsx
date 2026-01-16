import React, { useState } from 'react';
import {
    Box, Paper, TextField, Button, Typography, Container,
    InputAdornment, IconButton, Alert
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 1. 토큰 결과 가져오기 (true: 강제 새로고침)
            const tokenResult = await user.getIdTokenResult(true);

            // 2. 콘솔에서 직접 확인하기
            console.log("--- 유저 정보 확인 ---");
            console.log("이메일:", user.email);

            if (tokenResult.claims.role === 'admin') {
                console.log("✅ 관리자 권한 확인됨");
                navigate('/');
            } else {
                console.log("❌ 일반 유저입니다 (admin claim 없음)");
                // 🔥 중요: 권한이 없으므로 생성된 세션을 즉시 파괴
            await signOut(auth);
            setError("관리자 권한이 없습니다.");
            }
        } catch (err: any) {
            console.error("로그인 에러:", err.message);
        }
    };

    return (
        <Box sx={{
            backgroundColor: '#f0f2f5',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center'
        }}>
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Box sx={{
                        backgroundColor: '#A2C8F2',
                        width: 56, height: 56,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                    }}>
                        <LockOutlined sx={{ color: 'white' }} />
                    </Box>

                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        관리자 로그인
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        성당 관리자 계정으로 로그인하세요.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="이메일 주소"
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <TextField
                            fullWidth
                            label="비밀번호"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, py: 1.5, backgroundColor: '#A2C8F2', '&:hover': { backgroundColor: '#89b4e3' } }}
                        >
                            로그인
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}