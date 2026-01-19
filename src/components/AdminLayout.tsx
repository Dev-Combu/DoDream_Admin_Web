import React from 'react';
import { Logout as LogoutIcon } from '@mui/icons-material'; // 아이콘 추가
import { signOut } from 'firebase/auth';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Dashboard as DashboardIcon, Announcement as AnnouncementIcon, People as PeopleIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const drawerWidth = 240;

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
      } catch (error) {
        console.error("로그아웃 오류:", error);
      }
    }
  };

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/' },
    { text: '공지사항 관리', icon: <AnnouncementIcon />, path: '/notices' },
    { text: '일정 관리', icon: <AnnouncementIcon />, path: '/schedule' },
    { text: '유저 관리', icon: <PeopleIcon />, path: '/users' },
    { text: '출석 관리', icon: <PeopleIcon />, path: '/attendance' },
    { text: '알림 관리', icon: <PeopleIcon />, path: '/notifications' },
  ];

  return (
    <Box sx={{ display: 'flex', width: '100vw' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap>⛪ 성당 관리자 시스템</Typography>
        </Toolbar>

      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* 하단 고정 로그아웃 버튼 */}
        <Box sx={{ mt: 'auto', pb: 2 }}> {/* mt: 'auto'가 아래로 밀어줍니다 */}
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="로그아웃" 
                  primaryTypographyProps={{ color: 'error', fontWeight: 'bold' }} 
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, width: `calc(100% - ${drawerWidth}px)`, backgroundColor: '#f5f5f5', minHeight: '100vh', p: 3 }}>
        <Toolbar />
        {/* 여기가 실제 페이지 내용이 들어가는 자리입니다 */}
        <Outlet />
      </Box>
    </Box>
  );
}