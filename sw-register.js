// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/nhung-thanh-pho-mo-mang/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              showUpdateNotification();
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Show update notification
function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #2196F3;
      color: white;
      padding: 12px 16px;
      text-align: center;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    ">
      <span>Có phiên bản mới! </span>
      <button onclick="updateApp()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        margin-left: 8px;
        cursor: pointer;
      ">Cập nhật</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        padding: 4px 8px;
        margin-left: 8px;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    </div>
  `;
  document.body.appendChild(updateBanner);
}

// Update app
function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
      window.location.reload();
    });
  }
}

// Handle online/offline status
window.addEventListener('online', () => {
  showConnectionStatus('Đã kết nối internet', '#4CAF50');
});

window.addEventListener('offline', () => {
  showConnectionStatus('Mất kết nối internet - Đang chạy offline', '#FF5722');
});

function showConnectionStatus(message, color) {
  const statusBar = document.createElement('div');
  statusBar.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 9999;
      animation: slideUp 0.3s ease;
    ">${message}</div>
  `;
  
  document.body.appendChild(statusBar);
  
  setTimeout(() => {
    statusBar.remove();
  }, 3000);
}
