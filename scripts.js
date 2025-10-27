const cards = document.querySelectorAll('.info-card');
window.addEventListener('scroll', () => {
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      card.classList.add('show');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // --- Handle Add Pursuit Form (add-pursuit.html) ---
  const form = document.getElementById('pursuitForm');
  if (form) {
    // Create hidden iframe for form submission
    let iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    form.target = 'hidden_iframe';
    form.action = 'https://script.google.com/macros/s/AKfycbwx0fDXmZnwPpV3ecUbqqcOPoNfahgL394MeTZ99Dy2pbaDfsMekf3PnyBPw0QIvsrW/exec';
    form.method = 'POST';

    form.addEventListener('submit', (e) => {
      alert('Pursuit logged successfully!');
      setTimeout(() => form.reset(), 100);
    });
  }

  // --- Load Pursuits Table (pursuits.html) ---
  const tableBody = document.querySelector('#pursuitTable tbody');
  if (tableBody) {
    window.displayPursuits = function (data) {
      tableBody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.officer || ''}</td>
          <td>${row.suspect || ''}</td>
          <td>${row.vehicle || ''}</td>
          <td>${(row.date || '').split('T')[0]}</td>
          <td>${row.duration || ''}</td>
          <td>${row.outcome || ''}</td>
          <td>${row.notes || ''}</td>
        `;
        tableBody.appendChild(tr);
      });
    };

    // Fetch data from Google Apps Script (with cache-busting)
    const script = document.createElement('script');
    script.src =
      'https://script.google.com/macros/s/AKfycby_7H446qxxZE5r2Tohh1yG1fpEXHUogFltBUcoOaQR-Gnja8EVco-evooZ6NPJuFCu/exec?callback=displayPursuits&t=' +
      new Date().getTime();
    document.body.appendChild(script);
  }

    // --- Load Officers Table (read-only) ---
  const officerTableBody = document.querySelector('#officerTable tbody');
  if (officerTableBody) {
    window.displayOfficers = function (data) {
      officerTableBody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.name || ''}</td>
          <td>${row.rank || ''}</td>
          <td>${row.division || ''}</td>
          <td>${row.badge || ''}</td>
          <td>${row.status || ''}</td>
          <td>${row.notes || ''}</td>
        `;
        officerTableBody.appendChild(tr);
      });
    };

    const script = document.createElement('script');
    script.src =
      'https://script.google.com/macros/s/AKfycby_7H446qxxZE5r2Tohh1yG1fpEXHUogFltBUcoOaQR-Gnja8EVco-evooZ6NPJuFCu/exec?callback=displayOfficers&mode=officers&t=' +
      new Date().getTime();
    document.body.appendChild(script);
  }

});

const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', () => {
      const filter = searchInput.value.toLowerCase();
      const table = document.querySelector('#pursuitTable');
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }

  const officerSearch = document.getElementById('officerSearch');
  if (officerSearch) {
    officerSearch.addEventListener('keyup', () => {
      const filter = officerSearch.value.toLowerCase();
      const table = document.querySelector('#officerTable');
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }


document.addEventListener('DOMContentLoaded', () => {
  const selectWrappers = document.querySelectorAll('.custom-select-wrapper');

  selectWrappers.forEach(wrapper => {
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const options = wrapper.querySelectorAll('.custom-option');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');

    trigger.addEventListener('click', () => {
      wrapper.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        trigger.textContent = option.textContent;
        hiddenInput.value = option.dataset.value;
        wrapper.classList.remove('open');
      });
    });
  });

  // Close all selects if clicking outside
  document.addEventListener('click', e => {
    selectWrappers.forEach(wrapper => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }
    });
  });
});