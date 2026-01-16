import { Typography, Paper } from '@mui/material';
import {Grid} from '@mui/material';

export default function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" color="primary">최근 공지사항 요약</Typography>
          <Typography sx={{ mt: 2 }}>대시보드 페이지입니다.</Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3, height: 190, mb: 2 }}>
            <Typography variant="h6">미사 인원</Typography>
            <Typography variant="h3">245</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}