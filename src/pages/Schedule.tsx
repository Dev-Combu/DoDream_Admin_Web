import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Paper, Typography, Box, Dialog, DialogTitle, 
  DialogContent, TextField, DialogActions, Button 
} from '@mui/material';
import { db } from '../firebase'; // 설정하신 firebase 파일 경로
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// 1. 일정 데이터의 타입을 정의합니다.
interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    target: string;
    description: string;
}

export default function Schedule() {
  // 2. useState에 <CalendarEvent[]> 타입을 명시합니다.
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [open, setOpen] = useState(false);

  // 폼 상태 관리 (작성하신 인터페이스 기준)
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');

  // 1. 데이터 불러오기 (Read) - 작성하신 코드 기반
  const fetchEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "schedule"));
    const eventData: CalendarEvent[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const sDate = data.startDate?.toDate ? data.startDate.toDate().toISOString().split('T')[0] : data.startDate || "";
      const eDate = data.endDate?.toDate ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate || "";

      return {
        id: doc.id,
        title: data.name || data.title || "제목 없음",
        start: sDate,
        end: eDate,
        target: data.target || "",
        description: data.description || ""
      };
    });
    setEvents(eventData);
  };

  useEffect(() => { fetchEvents(); }, []);

  // 2. 저장 로직 (Create & Update)
  const handleSave = async () => {
    const eventObj = {
      title,
      startDate,
      endDate,
      target,
      description,
      updatedAt: new Date()
    };

    try {
      if (selectedId) {
        // Update: 기존 문서 수정
        await updateDoc(doc(db, "schedule", selectedId), eventObj);
      } else {
        // Create: 새 문서 추가
        await addDoc(collection(db, "schedule"), eventObj);
      }
      handleClose();
      fetchEvents();
    } catch (e) { console.error("저장 실패:", e); }
  };

  // 3. 삭제 로직 (Delete)
  const handleDelete = async () => {
    if (window.confirm("이 일정을 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "schedule", selectedId));
      handleClose();
      fetchEvents();
    }
  };

  // 4. 모달 제어
  const handleDateClick = (info: any) => {
    handleClose(); // 초기화
    setStartDate(info.dateStr);
    setEndDate(info.dateStr);
    setOpen(true);
  };

  const handleEventClick = (info: any) => {
    const ev = events.find(e => e.id === info.event.id);
    if (ev) {
      setSelectedId(ev.id);
      setTitle(ev.title);
      setStartDate(ev.start);
      setEndDate(ev.end);
      setTarget(ev.target);
      setDescription(ev.description);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedId('');
    setTitle('');
    setStartDate('');
    setEndDate('');
    setTarget('');
    setDescription('');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>📅 성당 일정 관리</Typography>
      <Paper sx={{ p: 3 }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ko"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="70vh"
        />
      </Paper>

      {/* 일정 입력/수정 다이얼로그 */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{selectedId ? "일정 수정" : "새 일정 등록"}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="일정 명칭" margin="dense" value={title} onChange={e => setTitle(e.target.value)} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth type="date" label="시작일" margin="dense" InputLabelProps={{ shrink: true }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            <TextField fullWidth type="date" label="종료일" margin="dense" InputLabelProps={{ shrink: true }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Box>
          <TextField fullWidth label="대상 (예: 전신자, 청년부)" margin="dense" value={target} onChange={e => setTarget(e.target.value)} />
          <TextField fullWidth label="상세 설명" margin="dense" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedId && <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>삭제</Button>}
          <Button onClick={handleClose} color="inherit">취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}