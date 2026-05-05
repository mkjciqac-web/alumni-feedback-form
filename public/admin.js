/* ── Table search/filter ──────────────────────────────────────────────────── */
function filterTable() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const rows  = document.querySelectorAll('#table-body .data-row');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

/* ── Keyboard navigation for table rows ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.data-row').forEach(row => {
        row.setAttribute('tabindex', '0');
        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                const handler = this.getAttribute('onclick');
                if (handler) {
                    const match = handler.match(/href='([^']+)'/);
                    if (match) window.location.href = match[1];
                }
            }
        });
    });
});
