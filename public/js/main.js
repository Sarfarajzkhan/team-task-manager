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

/*
===========================================
DYNAMIC PROJECT MEMBERS
===========================================
*/

async function loadProjectMembers(projectId) {
  const assigneeSelect = document.getElementById('assigneeSelect');
  if (!assigneeSelect) return;

  if (!projectId) {
    assigneeSelect.innerHTML = '<option value="" disabled selected>-- Select project first --</option>';
    return;
  }

  assigneeSelect.innerHTML = '<option value="" disabled selected>Loading members...</option>';

  try {
    const response = await fetch('/api/web/project-members/' + projectId, {
      credentials: 'same-origin'
    });
    if (!response.ok) throw new Error('Failed to load members');
    
    let members = await response.json();
    
    // Handle wrapped response if necessary
    if (members && members.success && members.data) {
      members = members.data;
    }

    if (!Array.isArray(members) || members.length === 0) {
      assigneeSelect.innerHTML = '<option value="" disabled selected>No members in this project</option>';
      return;
    }

    assigneeSelect.innerHTML = '<option value="" disabled selected>-- Select a member --</option>';
    members.forEach(member => {
      const option = document.createElement('option');
      option.value = member.id;
      option.textContent = `${member.name} (${member.email})`;
      assigneeSelect.appendChild(option);
    });
    });
  } catch (err) {
    console.error('Error loading members:', err);
    assigneeSelect.innerHTML = '<option value="" disabled selected>Error loading members</option>';
  }
}

/*
===========================================
THEME TOGGLE
===========================================
*/

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const icon = themeToggle.querySelector('i');
  
  // Check for saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      icon.classList.remove('bi-moon');
      icon.classList.add('bi-sun');
    } else {
      icon.classList.remove('bi-sun');
      icon.classList.add('bi-moon');
    }
  }
});