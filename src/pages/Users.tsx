import React, { useEffect, useCallback, useState } from 'react';
import { 
  Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Collapse, 
  IconButton, TextField, MenuItem, FormControl, InputLabel, Select, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Tooltip, Divider
} from '@mui/material';
import { 
  KeyboardArrowDown, KeyboardArrowUp, Search as SearchIcon, 
  Edit as EditIcon 
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// 1. Row 컴포넌트: 수정 버튼 및 상세 정보 포함
function Row({ user, onEdit }: { user: any, onEdit: (user: any) => void }) {
  const [open, setOpen] = useState(false);
  const hasProfile = user.profile && user.role !== 'guest';

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell width="50px">
          {hasProfile && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Typography fontWeight="bold">{user.name}</Typography>
          <Typography variant="caption" color="textSecondary">{user.christianName}</Typography>
        </TableCell>
        <TableCell>
          <Chip 
            label={user.role === 'admin' ? '관리자' : user.role === 'guest' ? '게스트' : user.role === 'teacher' ? '교사' : '학생'} 
            color={user.role === 'admin' ? 'primary' : 'default'} 
            size="small" 
          />
        </TableCell>
        <TableCell>{user.phoneNumber}</TableCell>
        <TableCell>{user.department || '-'}</TableCell>
        <TableCell>{user.profile?.grade || '-'}</TableCell>
        <TableCell align="right">
          <Tooltip title="정보 수정">
            <IconButton size="small" onClick={() => onEdit(user)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, bgcolor: '#f5f7fa', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">상세 프로필 ({user.profile?.type})</Typography>
                {user.profile?.type === 'student' && (
                  <Typography variant="body2">
                    🏫 학교: {user.profile.school} | 👨‍👩‍👧 보호자: {user.profile.guardian} ({user.profile.guardianPhoneNumber})
                  </Typography>
                )}
                {user.profile?.type === 'teacher' && (
                  <Typography variant="body2">
                    📚 경력: {user.profile.careerYears}년차
                  </Typography>
                )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  // 필터 상태들
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "user_info"));
    setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "user_info", selectedUser.id);
      const { id, ...updateData } = selectedUser;
      await updateDoc(userRef, updateData);
      alert("수정되었습니다.");
      setOpenEdit(false);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleChange = (field: string, value: any, isProfile = false) => {
    setSelectedUser((prev: any) => isProfile 
      ? { ...prev, profile: { ...prev.profile, [field]: value } }
      : { ...prev, [field]: value }
    );
  };

  // 🔥 필터링 로직 (모든 필터가 적용됨)
  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name + u.christianName).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesDept = filterDept === 'all' || u.department === filterDept;
    const matchesGrade = filterGrade === 'all' || u.profile?.grade === filterGrade;
    return matchesSearch && matchesRole && matchesDept && matchesGrade;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>👥 신자 정보 조회/수정</Typography>
      
      {/* 다시 추가된 검색 및 필터 바 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="이름/세례명 검색" size="small" fullWidth
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ endAdornment: <SearchIcon color="action" /> }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>역할</InputLabel>
            <Select value={filterRole} label="역할" onChange={(e) => setFilterRole(e.target.value)}>
              <MenuItem value="all">전체 역할</MenuItem>
              <MenuItem value="admin">관리자</MenuItem>
              <MenuItem value="teacher">교사</MenuItem>
              <MenuItem value="student">학생</MenuItem>
              <MenuItem value="guest">게스트</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>부서</InputLabel>
            <Select value={filterDept} label="부서" onChange={(e) => setFilterDept(e.target.value)}>
              <MenuItem value="all">전체 부서</MenuItem>
              <MenuItem value="성가">성가</MenuItem>
              <MenuItem value="전례">전례</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>학년</InputLabel>
            <Select value={filterGrade} label="학년" onChange={(e) => setFilterGrade(e.target.value)}>
              <MenuItem value="all">전체 학년</MenuItem>
              {['중학교 1학년', '중학교 2학년', '중학교 3학년', '고등학교 1학년', '고등학교 2학년', '고등학교 3학년'].map(g => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* 테이블 영역 */}
      <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>이름/세례명</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell>부서</TableCell>
              <TableCell>학년</TableCell>
              <TableCell align="right">수정</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <Row key={user.id} user={user} onEdit={(u) => { setSelectedUser({...u}); setOpenEdit(true); }} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 수정 다이얼로그 (생략 없이 유지) */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>신자 정보 수정</DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="이름" fullWidth value={selectedUser.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
              <TextField label="세례명" fullWidth value={selectedUser.christianName || ''} onChange={(e) => handleChange('christianName', e.target.value)} />
              <TextField label="연락처" fullWidth value={selectedUser.phoneNumber || ''} onChange={(e) => handleChange('phoneNumber', e.target.value)} />
              {selectedUser.profile?.type === 'student' && (
                <TextField label="학교" fullWidth value={selectedUser.profile.school || ''} onChange={(e) => handleChange('school', e.target.value, true)} />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>취소</Button>
          <Button variant="contained" onClick={handleUpdate}>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}