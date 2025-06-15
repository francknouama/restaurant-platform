// Mock shared utilities for Reservations MFE testing

// Mock date and time utilities
const formatDate = jest.fn((date, format = 'short') => {
  const mockDate = new Date(date);
  switch (format) {
    case 'short': return mockDate.toLocaleDateString();
    case 'long': return mockDate.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    case 'time': return mockDate.toLocaleTimeString();
    case 'datetime': return `${mockDate.toLocaleDateString()} ${mockDate.toLocaleTimeString()}`;
    default: return mockDate.toLocaleDateString();
  }
});

const formatTime = jest.fn((time, format = '12h') => {
  if (format === '24h') return time;
  const [hours, minutes] = time.split(':');
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes} ${ampm}`;
});

const addMinutes = jest.fn((time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
});

// Mock validation utilities
const validateEmail = jest.fn((email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
});

const validatePhone = jest.fn((phone) => {
  const phoneRegex = /^\(?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
});

const validateRequired = jest.fn((value) => {
  return value !== null && value !== undefined && value !== '';
});

const validatePartySize = jest.fn((size) => {
  return size >= 1 && size <= 20;
});

const validateReservationTime = jest.fn((date, time) => {
  const reservationDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  return reservationDateTime > now;
});

// Mock reservation-specific utilities
const generateConfirmationCode = jest.fn(() => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
});

const calculateReservationEndTime = jest.fn((startTime, duration) => {
  return addMinutes(startTime, duration);
});

const isTimeSlotAvailable = jest.fn((date, time, duration, existingReservations) => {
  const startTime = new Date(`${date}T${time}`);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  return !existingReservations.some(reservation => {
    const resStart = new Date(`${reservation.date}T${reservation.time}`);
    const resEnd = new Date(resStart.getTime() + reservation.duration * 60000);
    
    return (startTime < resEnd && endTime > resStart);
  });
});

const findOptimalTable = jest.fn((partySize, tables, preferences = {}) => {
  const availableTables = tables.filter(table => 
    table.status === 'available' && 
    table.capacity >= partySize &&
    table.isActive
  );
  
  // Sort by capacity (smallest suitable table first)
  availableTables.sort((a, b) => a.capacity - b.capacity);
  
  // Apply preferences
  if (preferences.seating) {
    const preferred = availableTables.find(table => table.type === preferences.seating);
    if (preferred) return preferred;
  }
  
  if (preferences.location) {
    const preferred = availableTables.find(table => table.location === preferences.location);
    if (preferred) return preferred;
  }
  
  return availableTables[0] || null;
});

// Mock calendar utilities
const getCalendarDays = jest.fn((year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === new Date().toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    });
  }
  
  return days;
});

const getAvailableTimeSlots = jest.fn((date, existingReservations, operatingHours = { start: '17:00', end: '22:00' }) => {
  const slots = [];
  const [startHour, startMin] = operatingHours.start.split(':').map(Number);
  const [endHour, endMin] = operatingHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeSlot = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    
    if (isTimeSlotAvailable(date, timeSlot, 120, existingReservations)) {
      slots.push(timeSlot);
    }
  }
  
  return slots;
});

// Mock status utilities
const getReservationStatusColor = jest.fn((status) => {
  const statusColors = {
    'pending': 'text-amber-600 bg-amber-100',
    'confirmed': 'text-green-600 bg-green-100',
    'cancelled': 'text-red-600 bg-red-100',
    'completed': 'text-gray-600 bg-gray-100',
    'noshow': 'text-red-700 bg-red-200',
    'waitlist': 'text-purple-600 bg-purple-100'
  };
  return statusColors[status] || 'text-neutral-600 bg-neutral-100';
});

const getTableStatusColor = jest.fn((status) => {
  const statusColors = {
    'available': 'text-green-600 bg-green-100',
    'occupied': 'text-red-600 bg-red-100',
    'reserved': 'text-blue-600 bg-blue-100',
    'cleaning': 'text-yellow-600 bg-yellow-100',
    'maintenance': 'text-gray-600 bg-gray-100'
  };
  return statusColors[status] || 'text-neutral-600 bg-neutral-100';
});

// Mock notification utilities
const sendConfirmationEmail = jest.fn((reservation) => {
  console.log('[Mock] Sending confirmation email to:', reservation.customerEmail);
  return Promise.resolve({ success: true, messageId: 'email_123' });
});

const sendReminderSMS = jest.fn((reservation) => {
  console.log('[Mock] Sending reminder SMS to:', reservation.customerPhone);
  return Promise.resolve({ success: true, messageId: 'sms_456' });
});

const sendCancellationNotification = jest.fn((reservation) => {
  console.log('[Mock] Sending cancellation notification to:', reservation.customerEmail);
  return Promise.resolve({ success: true });
});

// Mock analytics utilities
const calculateOccupancyRate = jest.fn((reservations, totalCapacity, date) => {
  const dailyReservations = reservations.filter(res => res.date === date);
  const totalGuests = dailyReservations.reduce((sum, res) => sum + res.partySize, 0);
  return Math.round((totalGuests / totalCapacity) * 100);
});

const calculateNoShowRate = jest.fn((reservations, period = 'month') => {
  const totalReservations = reservations.length;
  const noShows = reservations.filter(res => res.status === 'noshow').length;
  return totalReservations > 0 ? Math.round((noShows / totalReservations) * 100) : 0;
});

const findPeakHours = jest.fn((reservations) => {
  const hourCounts = {};
  
  reservations.forEach(res => {
    const hour = res.time.split(':')[0];
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
});

// Mock export utilities
const exportReservationsToCSV = jest.fn((reservations, filename) => {
  console.log(`[Mock] Exporting ${reservations.length} reservations to CSV: ${filename}`);
  return Promise.resolve({ success: true, filename });
});

const generateReservationReport = jest.fn((reservations, period) => {
  console.log(`[Mock] Generating reservation report for period: ${period}`);
  return Promise.resolve({
    totalReservations: reservations.length,
    confirmationRate: 85,
    noShowRate: 8,
    averagePartySize: 3.2,
    generatedAt: new Date().toISOString()
  });
});

// Mock local storage utilities
const saveReservationDraft = jest.fn((draft) => {
  localStorage.setItem('reservation_draft', JSON.stringify(draft));
});

const loadReservationDraft = jest.fn(() => {
  const stored = localStorage.getItem('reservation_draft');
  return stored ? JSON.parse(stored) : null;
});

const clearReservationDraft = jest.fn(() => {
  localStorage.removeItem('reservation_draft');
});

module.exports = {
  // Date and time utilities
  formatDate,
  formatTime,
  addMinutes,
  
  // Validation utilities
  validateEmail,
  validatePhone,
  validateRequired,
  validatePartySize,
  validateReservationTime,
  
  // Reservation utilities
  generateConfirmationCode,
  calculateReservationEndTime,
  isTimeSlotAvailable,
  findOptimalTable,
  
  // Calendar utilities
  getCalendarDays,
  getAvailableTimeSlots,
  
  // Status utilities
  getReservationStatusColor,
  getTableStatusColor,
  
  // Notification utilities
  sendConfirmationEmail,
  sendReminderSMS,
  sendCancellationNotification,
  
  // Analytics utilities
  calculateOccupancyRate,
  calculateNoShowRate,
  findPeakHours,
  
  // Export utilities
  exportReservationsToCSV,
  generateReservationReport,
  
  // Local storage utilities
  saveReservationDraft,
  loadReservationDraft,
  clearReservationDraft
};