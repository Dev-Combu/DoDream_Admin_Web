import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Paper, Typography, Box, CircularProgress, Stack, Avatar } from '@mui/material';
import { People as PeopleIcon, CheckCircleOutline as CheckIcon, NotificationsActive as NoticeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// FullCalendar 관련 임포트
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import koLocale from '@fullcalendar/core/locales/ko';

import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ totalUsers: 0, presentCount: 0 });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]); // 달력에 표시될 이벤트
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. 통계 데이터
        const userSnap = await getDocs(collection(db, "user_info"));
        // 이번 달 출석 데이터 (간소화를 위해 전체 로드 후 필터링하거나 쿼리 사용)
        const attendSnap = await getDocs(collection(db, "attendance_students_all"));
        
        setStats({ 
          totalUsers: userSnap.size, 
          presentCount: attendSnap.size 
        });

        // 2. 최근 알림 (우측 사이드바용)
        const noticeSnap = await getDocs(query(collection(db, "notifications_history"), orderBy("sentAt", "desc"), limit(5)));
        setRecentNotices(noticeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 3. 캘린더 일정 (schedule 컬렉션 전체 로드)
        const eventSnap = await getDocs(collection(db, "schedule"));
        const formattedEvents = eventSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.startDate?.toDate(), // Firestore Timestamp를 JS Date로 변환
            end: data.endDate?.toDate(),
            backgroundColor: data.color || '#3788d8', // 일정별 색상 지정 가능
            borderColor: 'transparent'
          };
        });
        setEvents(formattedEvents);

      } catch (e) {
        console.error("데이터 로드 에러:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#F4F6F8', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>성당 통합 관리 대시보드</Typography>

      <Grid container spacing={3}>
        {/* 상단 통계 카드 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box onClick={() => navigate('/users')} sx={{ cursor: 'pointer' }}>
            <SummaryCard title="등록 인원" value={`${stats.totalUsers}명`} icon={<PeopleIcon color="primary" />} />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box onClick={() => navigate('/attendance')} sx={{ cursor: 'pointer' }}>
            <SummaryCard title="이달의 총 출석" value={`${stats.presentCount}건`} icon={<CheckIcon color="success" />} />
          </Box>
        </Grid>

        { }
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, borderRadius: 4, height: '700px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Box sx={{ height: '100%', '& .fc': { '--fc-border-color': '#eee', '--fc-button-bg-color': '#607d8b' } }}>
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                locale={koLocale}
                events={events}
                height="100%"
                headerToolbar={{
                  left: 'title',
                  right: 'prev,next today'
                }}
                dayMaxEvents={true} // 이벤트가 많으면 '더보기'로 표시
              />
            </Box>
          </Paper>
        </Grid>

        {/* 🔔 우측 알림 히스토리 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper onClick={() => navigate('/notifications')} sx={{ p: 3, borderRadius: 4, height: '700px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <NoticeIcon sx={{ mr: 1, color: '#2196F3' }} /> 최근 발송 알림
            </Typography>
            <Stack spacing={2}>
              {recentNotices.length > 0 ? recentNotices.map((notice) => (
                <Box key={notice.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{notice.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notice.sentAt?.toDate().toLocaleDateString()} · {notice.targetTopic || '전체'}
                  </Typography>
                </Box>
              )) : <Typography color="text.disabled">기록이 없습니다.</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// 공통 카드 컴포넌트
function SummaryCard({ title, value, icon }: any) {
  return (
    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
      </Box>
      <Avatar sx={{ bgcolor: '#F0F2F5', width: 56, height: 56 }}>{icon}</Avatar>
    </Paper>
  );
}