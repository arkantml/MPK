const APP_CONFIG = {
  SUPABASE_URL: 'https://qtqpgpgihmybihiznakv.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cXBncGdpaG15YmloaXpuYWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjM3MTUsImV4cCI6MjEwNTAzOTcxNX0.1ZgbXqUv-yZVvDuJfCymmjJ5wbwIfNaMbanlUvWgr5E',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  STATUS_COLORS: {
    'NEW': 'bg-blue-100 text-blue-800',
    'REVIEWING': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-orange-100 text-orange-800',
    'RESOLVED': 'bg-green-100 text-green-800',
    'ARCHIVED': 'bg-gray-100 text-gray-800'
  },
  STATUS_LABELS: {
    'NEW': 'Baru',
    'REVIEWING': 'Sedang Ditinjau',
    'IN_PROGRESS': 'Sedang Diproses',
    'RESOLVED': 'Selesai',
    'ARCHIVED': 'Diarsipkan'
  }
};

window.APP_CONFIG = APP_CONFIG;
