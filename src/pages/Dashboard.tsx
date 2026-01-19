import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { 
  Paper, Typography, Box, Card, CardContent, 
  List, ListItem, ListItemText, Divider, CircularProgress, Stack, Avatar, Badge
} from '@mui/material';
import { 
  CheckCircleOutline as CheckIcon, 
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  NotificationsActive as NoticeIcon
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, Timestamp, limit } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, presentCount: 0 });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [monthEvents, setMonthEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. 통계 (전체/참석)
        const userSnap = await getDocs(collection(db, "user_info"));
        const todayStr = now.toISOString().split('T')[0];
        //const attendSnap = await getDocs(query(collection(db, "attendance"), where("date", "==", todayStr)));

        //setStats({ totalUsers: userSnap.size, presentCount: attendSnap.size });

        // 2. 최근 알림 (5개)
        // 2. 최근 알림 가져오기 (수정본)
        const fetchNotices = async () => {
          try {
            const noticeRef = collection(db, "notifications_history");

            // 처음에는 복잡한 조건(where) 없이 단순하게 최신순으로만 5개를 가져와봅니다.
            const noticeQuery = query(
              noticeRef,
              orderBy("sentAt", "desc"),
              limit(5)
            );

            const noticeSnap = await getDocs(noticeQuery);

            if (noticeSnap.empty) {
              console.log("알림 내역이 비어있습니다.");
              setRecentNotices([]);
            } else {
              const data = noticeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              console.log("로드된 알림:", data); // 브라우저 콘솔(F12)에서 확인 가능
              setRecentNotices(data);
            }
          } catch (err) {
            console.error("알림 로드 중 에러 발생:", err);
          }
        };

        fetchNotices(); // fetchDashboardData 내부에서 실행
        // 3. 이번 달 전체 일정 (달력 데이터)
        const eventQuery = query(
          collection(db, "schedule"),
          where("startDate", ">=", Timestamp.fromDate(firstDay)),
          where("startDate", "<=", Timestamp.fromDate(lastDay)),
          orderBy("startDate", "asc")
        );
        const eventSnap = await getDocs(eventQuery);
        setMonthEvents(eventSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#F8F9FA', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 800, color: '#1A2027' }}>
        {currentMonth}월 성당 운영 대시보드
      </Typography>

      <Grid container spacing={3}>
        {/* 요약 카드 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SummaryCard title="등록 인원" value={`${stats.totalUsers}명`} icon={<PeopleIcon color="primary" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SummaryCard title="오늘 출석" value={`${stats.presentCount}명`} icon={<CheckIcon color="success" />} />
        </Grid>

        {/* 이번 달 달력 일정 섹션 (Schedule 페이지 느낌) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 4, minHeight: 500, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1, color: '#FF9800' }} /> 이번 달 주요일정
              </Typography>
              <Badge badgeContent={monthEvents.length} color="secondary">
                <Typography variant="body2" color="text.secondary">Total</Typography>
              </Badge>
            </Stack>
            
            <Divider sx={{ mb: 0 }} />
            
            <List disablePadding>
              {monthEvents.length > 0 ? monthEvents.map((event, index) => {
                const eventDate = event.startDate?.toDate();
                return (
                  <ListItem 
                    key={event.id} 
                    sx={{ 
                      py: 2, 
                      borderBottom: '1px solid #F0F2F5',
                      '&:hover': { bgcolor: '#FDFDFD' }
                    }}
                  >
                    {/* 달력 날짜 박스 */}
                    <Box sx={{ 
                      width: 60, height: 60, bgcolor: '#FFF5E6', borderRadius: 3, 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mr: 3
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                        {eventDate.toLocaleString('ko-KR', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                        {eventDate.getDate()}
                      </Typography>
                    </Box>

                    <ListItemText 
                      primary={event.title} 
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="body2">{event.location || "장소 미정"}</Typography>
                          <Typography variant="body2" color="text.disabled">|</Typography>
                          <Typography variant="body2">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Stack>
                      }
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '1.1rem' }}
                    />
                  </ListItem>
                );
              }) : (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Typography color="text.disabled">이번 달은 등록된 일정이 없습니다.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* 사이드: 최근 알림 히스토리 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <NoticeIcon sx={{ mr: 1, color: '#2196F3' }} /> 발송 기록
            </Typography>
            <Stack spacing={2}>
              {recentNotices.length > 0 ? recentNotices.map((notice) => (
                <Box key={notice.id} sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 2, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }} noWrap>
                    {notice.title || "제목 없음"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {/* toDate()가 가능한지 체크하고 출력 */}
                    {notice.sentAt?.toDate
                      ? notice.sentAt.toDate().toLocaleDateString()
                      : "날짜 정보 없음"}
                    {` · ${notice.targetTopic || '전체'}`}
                  </Typography>
                </Box>
              )) : (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
                  최근 발송된 알림이 없습니다.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function SummaryCard({ title, value, icon }: any) {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: '#F0F2F5', width: 50, height: 50 }}>{icon}</Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}