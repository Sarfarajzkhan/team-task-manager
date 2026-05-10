console.log('Frontend loaded successfully');

/*
===========================================
TOAST
===========================================
*/

function showToast(
  message,
  type = 'success',
) {
  let background =
    type === 'success'
      ? 'linear-gradient(to right, #10b981, #059669)'
      : 'linear-gradient(to right, #ef4444, #dc2626)';

  Toastify({
    text: message,

    duration: 3000,

    gravity: 'top',

    position: 'right',

    style: {
      background,
      borderRadius: '12px',
    },
  }).showToast();
}

/*
===========================================
DELETE CONFIRM
===========================================
*/

function confirmAction(message) {
  return confirm(
    message ||
      'Are you sure?',
  );
}

/*
===========================================
SIDEBAR TOGGLE
===========================================
*/

function toggleSidebar() {
  const sidebar =
    document.getElementById(
      'sidebar',
    );

  const overlay =
    document.getElementById(
      'sidebarOverlay',
    );

  sidebar.classList.toggle(
    'sidebar-open',
  );

  overlay.classList.toggle(
    'overlay-active',
  );
}