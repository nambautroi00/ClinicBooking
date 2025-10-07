import React, { useEffect, useState } from 'react';
import { getDoctorSchedules } from '../../api/doctorScheduleApi';

function DoctorScheduleTable({ doctorId }) {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    getDoctorSchedules(doctorId)
      .then(res => setSchedules(res.data))
      .catch(err => alert('Lỗi tải lịch trình'));
  }, [doctorId]);

  return (
    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Giờ bắt đầu</th>
          <th>Giờ kết thúc</th>
          <th>Phòng</th>
        </tr>
      </thead>
      <tbody>
        {schedules.map(schedule => (
          <tr key={schedule.id}>
            <td>{schedule.date}</td>
            <td>{schedule.startTime}</td>
            <td>{schedule.endTime}</td>
            <td>{schedule.room}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DoctorScheduleTable;