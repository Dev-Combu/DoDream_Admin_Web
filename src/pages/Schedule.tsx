import { useEffect, useState } from 'react';
import { Timestamp, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'; 
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Paper, Typography, Box, Dialog, DialogTitle, 
  DialogContent, TextField, DialogActions, Button 
} from '@mui/material';
import { db } from '../firebase';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    target: string;
    description: string;
}

export default function Schedule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [open, setOpen] = useState(false);

  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "schedule"));
      const eventData: CalendarEvent[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Timestamp -> Date 변환 (데이터가 없을 경우 예외처리)
        const sDateObj = data.startDate?.toDate ? data.startDate.toDate() : new Date();
        const eDateObj = data.endDate?.toDate ? data.endDate.toDate() : new Date();

        return {
          id: doc.id,
          title: data.title || "제목 없음",
          start: sDateObj.toISOString(),
          end: eDateObj.toISOString(),
          target: data.target || "",
          description: data.description || ""
        };
      });
      setEvents(eventData);
    } catch (e) { console.error("데이터 로드 실패:", e); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSave = async () => {
    if (!startDate || !endDate) { alert("날짜를 선택해주세요."); return; }

    // 날짜와 시간을 합쳐서 Date 객체 생성
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    const eventObj = {
      title,
      startDate: Timestamp.fromDate(startDateTime), // Timestamp 저장
      endDate: Timestamp.fromDate(endDateTime),     // Timestamp 저장
      target,
      description,
      updatedAt: Timestamp.now()
    };

    try {
      if (selectedId) {
        await updateDoc(doc(db, "schedule", selectedId), eventObj);
      } else {
        await addDoc(collection(db, "schedule"), eventObj);
      }
      handleClose();
      fetchEvents();
    } catch (e) { console.error("저장 실패:", e); }
  };

  const handleDelete = async () => {
    if (window.confirm("이 일정을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "schedule", selectedId));
        handleClose();
        fetchEvents();
      } catch (e) { console.error("삭제 실패:", e); }
    }
  };

  const handleDateClick = (info: any) => {
    handleClose();
    setStartDate(info.dateStr);
    setEndDate(info.dateStr);
    setOpen(true);
  };

  // 기존 중복된 handleEventClick을 하나로 통합 및 시간 파싱 로직 추가
  const handleEventClick = (info: any) => {
    const ev = events.find(e => e.id === info.event.id);
    if (ev) {
      const sObj = new Date(ev.start);
      const eObj = new Date(ev.end);

      setSelectedId(ev.id);
      setTitle(ev.title);
      // 날짜(YYYY-MM-DD) 추출
      setStartDate(sObj.toLocaleDateString('en-CA')); // YYYY-MM-DD 포맷
      setEndDate(eObj.toLocaleDateString('en-CA'));
      // 시간(HH:mm) 추출
      setStartTime(sObj.toTimeString().substring(0, 5));
      setEndTime(eObj.toTimeString().substring(0, 5));
      
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
    setStartTime('09:00');
    setEndDate('');
    setEndTime('10:00');
    setTarget('');
    setDescription('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>📅 성당 일정 관리</Typography>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
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

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedId ? "일정 수정" : "새 일정 등록"}
        </DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="일정 명칭" margin="dense" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>시작 일시</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField fullWidth type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <TextField fullWidth type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>종료 일시</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField fullWidth type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <TextField fullWidth type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </Box>

          <TextField fullWidth label="대상 (예: 전신자, 청년부)" margin="dense" value={target} onChange={e => setTarget(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="상세 설명" margin="dense" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {selectedId && <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>삭제</Button>}
          <Button onClick={handleClose} color="inherit">취소</Button>
          <Button onClick={handleSave} variant="contained" disableElevation>저장</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}