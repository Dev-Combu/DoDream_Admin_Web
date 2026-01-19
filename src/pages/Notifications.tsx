import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Box, TextField, Button, Stack,
    ToggleButton, ToggleButtonGroup, List, ListItem, ListItemText, Divider, Chip, CircularProgress
} from '@mui/material';
import { Send as SendIcon, Alarm as AlarmIcon, History as HistoryIcon } from '@mui/icons-material';
import { db, functions } from '../firebase'; // Update path to match your Firebase config file location
import { httpsCallable } from 'firebase/functions';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';


export default function Notification() {
    const [topic, setTopic] = useState('all');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // 1. 발송/예약 내역 가져오기 (Cloud Functions가 저장하는 컬렉션 기준)
    // history 가져오는 쿼리 부분
    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            // 컬렉션 이름을 'notifications_history'로 통일
            const q = query(
                collection(db, "notifications_history"),
                orderBy("sentAt", "desc"),
                limit(15)
            );
            const snap = await getDocs(q);
            setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error("내역 조회 에러:", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    // 2. 알림 발송 함수 (Cloud Functions 호출)
    const handleSend = async () => {
        if (!title || !content) return alert("제목과 내용을 입력해주세요.");

        setLoading(true);
        try {
            const sendScheduleNotification = httpsCallable(functions, 'sendScheduleNotification');

            // 1. 서버 전송용 데이터 (서버 코드 규격)
            const requestData = {
                title: title,
                body: content,
                topics: [topic],
                sendTime: scheduledDate ? new Date(scheduledDate).toISOString() : null,
                payload: {
                    notificationType: "scheduleUpdate",
                    topic: topic
                }
            };

            // 2. 서버 호출
            const result: any = await sendScheduleNotification(requestData);

            if (result.data.success) {
                // 3. [중요] 발송/예약 성공 시 웹에서 직접 '기록 전용 컬렉션'에 저장
                // 서버가 즉시 발송 시 저장을 안 하더라도 여기서 저장하여 앱/웹에서 볼 수 있게 함
                await addDoc(collection(db, "notifications_history"), {
                    title: title,
                    body: content,
                    targetTopic: topic,
                    status: scheduledDate ? "scheduled" : "sent",
                    sentAt: serverTimestamp(),
                    scheduledAt: scheduledDate ? new Date(scheduledDate) : null,
                    sender: "관리자"
                });

                alert(scheduledDate ? "알림 예약 및 저장이 완료되었습니다." : "알림 즉시 발송 및 저장이 완료되었습니다.");

                setTitle(''); setContent(''); setScheduledDate('');
                fetchHistory(); // 목록 새로고침
            }
        } catch (error: any) {
            console.error("발송 에러 상세:", error);
            alert(`발송 실패: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getTopicName = (topicCode: string) => {
        const names: any = { middle: '중학생', high: '고등학생', all: '전체', etc: '기타' };
        return names[topicCode] || topicCode;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>📢 그룹 알림 관리</Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                {/* 왼쪽: 작성 패널 */}
                <Paper sx={{ p: 3, flex: 1.5 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>1. 수신 그룹 선택</Typography>
                            <ToggleButtonGroup
                                value={topic}
                                exclusive
                                onChange={(_, v) => v && setTopic(v)}
                                fullWidth
                                color="primary"
                            >
                                <ToggleButton value="middle">중학생</ToggleButton>
                                <ToggleButton value="high">고등학생</ToggleButton>
                                <ToggleButton value="all">전체</ToggleButton>
                                <ToggleButton value="etc">기타</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>2. 발송 시간 설정 (예약)</Typography>
                            <TextField
                                type="datetime-local"
                                fullWidth
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                helperText="시간을 설정하지 않으면 즉시 발송됩니다."
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>3. 메시지 내용</Typography>
                            <Stack spacing={2}>
                                <TextField label="제목" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                                <TextField label="내용" fullWidth multiline rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
                            </Stack>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={scheduledDate ? <AlarmIcon /> : <SendIcon />}
                            onClick={handleSend}
                            disabled={loading}
                            color={scheduledDate ? "secondary" : "primary"}
                            sx={{ py: 1.5, fontWeight: 'bold' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (scheduledDate ? "알림 예약하기" : "지금 바로 보내기")}
                        </Button>
                    </Stack>
                </Paper>

                {/* 오른쪽: 내역 패널 */}
                <Paper sx={{ p: 3, flex: 1, bgcolor: '#f8f9fa' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <HistoryIcon sx={{ mr: 1 }} /> 최근 발송 내역
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {historyLoading ? <CircularProgress size={24} /> : (
                        <List sx={{ maxHeight: '65vh', overflow: 'auto' }}>
                            {history.map((item) => (
                                <ListItem key={item.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                                        <Chip
                                            label={item.status === 'scheduled' || item.status === 'pending' ? '예약' : '발송완료'}
                                            size="small"
                                            color={item.status === 'scheduled' || item.status === 'pending' ? 'secondary' : 'default'}
                                        />
                                        <Chip label={getTopicName(item.targetTopic || (item.message?.topic))} size="small" variant="outlined" />
                                    </Stack>
                                    <ListItemText
                                        primary={item.title || item.message?.notification?.title}
                                        secondary={
                                            item.scheduledAt || item.sendTime
                                                ? `예정: ${new Date(item.scheduledAt || item.sendTime).toLocaleString()}`
                                                : `발송일: ${item.sentAt?.toDate().toLocaleString()}`
                                        }
                                        primaryTypographyProps={{ fontWeight: 'bold', variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <Divider sx={{ width: '100%', my: 1 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Stack>
        </Box>
    );
}