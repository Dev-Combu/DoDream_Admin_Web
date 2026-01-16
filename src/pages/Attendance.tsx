import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Paper, Typography, Box, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Checkbox, 
  FormControl, InputLabel, Select, MenuItem, Stack, TextField, CircularProgress 
} from '@mui/material';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState('student');
  const [filterGrade, setFilterGrade] = useState('all');
  const [currentMonth, setCurrentMonth] = useState("2025-12"); // 조회 기준 월
  
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, boolean>>>({});
  const [extraDates, setExtraDates] = useState<string[]>([]); // 데이터가 있는 평일 목록

  // 1. 해당 월의 기본 '주일(일요일)' 리스트 생성 (yyyy.MM.dd 형식)
  const sundays = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const dates = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 0) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        dates.push(`${y}.${m}.${d}`);
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }, [currentMonth]);

  // 2. 데이터 불러오기 로직
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userSnapshot = await getDocs(collection(db, "user_info"));
      const allUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filteredUsers = allUsers.filter((u: any) => {
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        const matchesGrade = filterGrade === 'all' || u.profile?.grade === filterGrade;
        return matchesRole && matchesGrade;
      });
      
      setUsers(filteredUsers);

      const newMap: Record<string, Record<string, boolean>> = {};
      const foundExtraDates = new Set<string>(); // 평일 데이터 감지용

      // 유저별로 서브 컬렉션 전체를 긁어와서 날짜 매칭
      await Promise.all(filteredUsers.map(async (user) => {
        newMap[user.id] = {};
        const historySnapshot = await getDocs(collection(db, "attendance_students_all", user.id, "attendance_history"));
        
        historySnapshot.forEach((doc) => {
          const dateStr = doc.id; // 예: "2025.12.03"
          // 현재 선택한 월(YYYY.MM)로 시작하는 데이터만 필터링
          if (dateStr.startsWith(currentMonth.replace('-', '.'))) {
            const data = doc.data();
            if (data.status === 'attended' || !!data.timestamp) {
              newMap[user.id][dateStr] = true;

              // 만약 이 날짜가 일요일 리스트에 없다면 '특별 날짜'로 등록
              if (!sundays.includes(dateStr)) {
                foundExtraDates.add(dateStr);
              }
            }
          }
        });
      }));

      setExtraDates(Array.from(foundExtraDates).sort());
      setAttendanceMap(newMap);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterGrade, currentMonth, sundays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. 표에 표시할 최종 날짜 리스트 (주일 + 데이터 있는 평일)
  const allDisplayDates = useMemo(() => {
    return Array.from(new Set([...sundays, ...extraDates])).sort();
  }, [sundays, extraDates]);

  // 4. 출석 토글 핸들러
  const handleToggle = async (dateStr: string, user: any) => {
    const isAttended = attendanceMap[user.id]?.[dateStr];
    const newStatus = !isAttended;

    setAttendanceMap(prev => ({
      ...prev,
      [user.id]: { ...prev[user.id], [dateStr]: newStatus }
    }));

    try {
      const historyDocRef = doc(db, "attendance_students_all", user.id, "attendance_history", dateStr);
      await setDoc(historyDocRef, {
        name: user.name,
        status: newStatus ? 'attended' : 'absent',
        timestamp: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.error("Save Error:", e);
    }
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>🗓️ 주일/특별 출석부</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="월 선택" type="month" size="small"
            value={currentMonth} onChange={(e) => setCurrentMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>역할</InputLabel>
            <Select value={filterRole} label="역할" onChange={(e) => setFilterRole(e.target.value)}>
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="student">학생</MenuItem>
              <MenuItem value="teacher">교사</MenuItem>
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
          <Typography variant="caption" color="textSecondary">
            * 주일이 아니더라도 데이터가 있는 날짜는 자동으로 표시됩니다.
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: '75vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fa', minWidth: 120 }}>이름 (세례명)</TableCell>
              {allDisplayDates.map(date => {
                const isSunday = new Date(date.replace(/\./g, '-')).getDay() === 0;
                return (
                  <TableCell 
                    key={date} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: isSunday ? '#fff5f5' : '#f0f4ff', // 일요일은 붉은계열, 평일데이터는 푸른계열
                      color: isSunday ? 'red' : 'blue',
                      minWidth: 80 
                    }}
                  >
                    {date.split('.')[2]}일
                    <Typography variant="caption" display="block">
                      {isSunday ? '(주)' : '(특)'}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={allDisplayDates.length + 1} align="center">데이터가 없습니다.</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{user.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{user.christianName}</Typography>
                  </TableCell>
                  {allDisplayDates.map(date => (
                    <TableCell key={date} align="center">
                      <Checkbox 
                        checked={attendanceMap[user.id]?.[date] || false}
                        onChange={() => handleToggle(date, user)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}