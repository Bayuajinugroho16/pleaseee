import React, { useState, useEffect } from 'react';
import './SchedulePicker.css';

const SchedulePicker = ({ movieId, onScheduleSelect }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Mock data jadwal
  const mockSchedules = [
    { id: 1, time: '10:00', theater: 'Theater 1', price: 45000 },
    { id: 2, time: '13:00', theater: 'Theater 2', price: 45000 },
    { id: 3, time: '16:00', theater: 'Theater 1', price: 50000 },
    { id: 4, time: '19:00', theater: 'Theater 3', price: 50000 },
    { id: 5, time: '21:30', theater: 'Theater 2', price: 45000 },
  ];

  useEffect(() => {
    // Simulasi fetch data dari API
    setSchedules(mockSchedules);
  }, [movieId]);

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    onScheduleSelect(schedule);
  };

  return (
    <div className="schedule-picker">
      <h3>Pilih Jadwal Tayang</h3>
      
      <div className="schedule-grid">
        {schedules.map(schedule => (
          <div
            key={schedule.id}
            className={`schedule-card ${selectedSchedule?.id === schedule.id ? 'selected' : ''}`}
            onClick={() => handleScheduleSelect(schedule)}
          >
            <div className="schedule-time">{schedule.time}</div>
            <div className="schedule-theater">{schedule.theater}</div>
            <div className="schedule-price">Rp {schedule.price.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {selectedSchedule && (
        <div className="selected-schedule-info">
          <h4>Jadwal Terpilih:</h4>
          <p>{selectedSchedule.time} - {selectedSchedule.theater}</p>
          <p>Harga: Rp {selectedSchedule.price.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default SchedulePicker;