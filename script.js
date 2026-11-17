const months = [
    { key: 'january', label: 'Jan', fullLabel: 'January' },
    { key: 'february', label: 'Feb', fullLabel: 'February' },
    { key: 'march', label: 'Mar', fullLabel: 'March' },
    { key: 'april', label: 'Apr', fullLabel: 'April' },
    { key: 'may', label: 'May', fullLabel: 'May' },
    { key: 'june', label: 'Jun', fullLabel: 'June' },
    { key: 'july', label: 'Jul', fullLabel: 'July' },
    { key: 'august', label: 'Aug', fullLabel: 'August' },
    { key: 'september', label: 'Sep', fullLabel: 'September' },
    { key: 'october', label: 'Oct', fullLabel: 'October' },
    { key: 'november', label: 'Nov', fullLabel: 'November' },
    { key: 'december', label: 'Dec', fullLabel: 'December' }
];

const storageKey = 'money2bar:monthly-data:v1';
const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
});
const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1
});

function createEmptyData() {
    return Object.fromEntries(months.map(({ key }) => [key, { income: 0, expenses: 0 }]));
}

function loadData() {
    const emptyData = createEmptyData();

    try {
        const savedData = JSON.parse(localStorage.getItem(storageKey));
        if (!savedData || typeof savedData !== 'object') return emptyData;

        for (const { key } of months) {
            for (const kind of ['income', 'expenses']) {
                const amount = Number(savedData[key]?.[kind]);
                if (Number.isFinite(amount) && amount >= 0) {
                    emptyData[key][kind] = amount;
                }
            }
        }
    } catch {
        return emptyData;
    }

    return emptyData;
}

const data = loadData();
const dataTab = document.querySelector('#data-tab');
const chartTab = document.querySelector('#chart-tab');
const dataPanel = document.querySelector('#data-panel');
const chartPanel = document.querySelector('#chart-panel');
const chartCanvas = document.querySelector('#monthly-chart');
const chartEmpty = document.querySelector('#chart-empty');
const chartUnavailable = document.querySelector('#chart-unavailable');
const downloadChartButton = document.querySelector('#download-chart');
const usernameForm = document.querySelector('#username-form');
const usernameInput = document.querySelector('#username');
const usernameStatus = document.querySelector('#username-status');
const inputs = [...document.querySelectorAll('.data-table input')];
let monthlyChart;
let submittedUsername = '';

function updateSummary() {
    const totals = months.reduce((sum, { key }) => ({
        income: sum.income + data[key].income,
        expenses: sum.expenses + data[key].expenses
    }), { income: 0, expenses: 0 });

    document.querySelector('#total-income').textContent = currencyFormatter.format(totals.income);
    document.querySelector('#total-expenses').textContent = currencyFormatter.format(totals.expenses);
    document.querySelector('#net-balance').textContent = currencyFormatter.format(totals.income - totals.expenses);
    document.querySelector('#net-balance').classList.toggle('is-negative', totals.income < totals.expenses);
}

function hasEntries() {
    return months.some(({ key }) => data[key].income > 0 || data[key].expenses > 0);
}

function syncChartDownloadButton() {
    downloadChartButton.disabled = !monthlyChart || !hasEntries() || !submittedUsername;
}

function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#182b24',
                padding: 12,
                titleFont: { family: 'DM Sans', weight: '600' },
                bodyFont: { family: 'DM Sans' },
                callbacks: {
                    title: (items) => months[items[0].dataIndex].fullLabel,
                    label: (item) => `${item.dataset.label}: ${currencyFormatter.format(item.raw)}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#68756e', font: { family: 'DM Sans', size: 12 } }
            },
            y: {
                beginAtZero: true,
                border: { display: false, dash: [4, 4] },
                grid: { color: '#e8ede8' },
                ticks: {
                    color: '#68756e',
                    font: { family: 'DM Sans', size: 11 },
                    callback: (value) => compactCurrencyFormatter.format(value)
                }
            }
        }
    };
}

function updateChart() {
    chartEmpty.hidden = hasEntries();
    chartCanvas.hidden = !hasEntries();
    syncChartDownloadButton();

    if (!monthlyChart || !hasEntries()) return;

    monthlyChart.data.datasets[0].data = months.map(({ key }) => data[key].income);
    monthlyChart.data.datasets[1].data = months.map(({ key }) => data[key].expenses);
    monthlyChart.update();
}

function createChart() {
    if (typeof Chart === 'undefined') {
        chartUnavailable.hidden = false;
        chartCanvas.hidden = true;
        chartEmpty.hidden = true;
        syncChartDownloadButton();
        return;
    }

    chartUnavailable.hidden = true;
    chartEmpty.hidden = hasEntries();
    chartCanvas.hidden = !hasEntries();

    if (!hasEntries() || monthlyChart) {
        syncChartDownloadButton();
        return;
    }

    monthlyChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: months.map(({ label }) => label),
            datasets: [
                {
                    label: 'Income',
                    data: months.map(({ key }) => data[key].income),
                    backgroundColor: '#13885f',
                    hoverBackgroundColor: '#0c704c',
                    borderRadius: 4,
                    maxBarThickness: 26
                },
                {
                    label: 'Expenses',
                    data: months.map(({ key }) => data[key].expenses),
                    backgroundColor: '#ef795f',
                    hoverBackgroundColor: '#d96149',
                    borderRadius: 4,
                    maxBarThickness: 26
                }
            ]
        },
        options: chartOptions()
    });
    syncChartDownloadButton();
}

function showTab(tab) {
    const showChart = tab === chartTab;

    dataTab.setAttribute('aria-selected', String(!showChart));
    dataTab.classList.toggle('is-active', !showChart);
    dataTab.tabIndex = showChart ? -1 : 0;
    chartTab.setAttribute('aria-selected', String(showChart));
    chartTab.classList.toggle('is-active', showChart);
    chartTab.tabIndex = showChart ? 0 : -1;
    dataPanel.hidden = showChart;
    chartPanel.hidden = !showChart;

    if (showChart) {
        createChart();
        requestAnimationFrame(() => monthlyChart?.resize());
    }
}

function saveData() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
        document.querySelector('.save-note').textContent = 'Could not save changes in this browser.';
    }
}

for (const input of inputs) {
    const { month, kind } = input.dataset;
    const savedValue = data[month][kind];
    if (savedValue > 0) input.value = String(savedValue);

    input.addEventListener('input', () => {
        const amount = input.value === '' ? 0 : Number(input.value);
        const isValid = input.value === '' || (input.validity.valid && Number.isFinite(amount) && amount >= 0);

        if (!isValid) {
            input.setAttribute('aria-invalid', 'true');
            return;
        }

        input.removeAttribute('aria-invalid');
        data[month][kind] = amount;
        saveData();
        updateSummary();
        updateChart();
    });
}

updateSummary();
updateChart();

dataTab.addEventListener('click', () => showTab(dataTab));
chartTab.addEventListener('click', () => showTab(chartTab));
usernameInput.addEventListener('input', () => {
    usernameInput.setCustomValidity(usernameInput.value.trim().length >= 4 ? '' : 'Username must be at least 4 characters.');
    submittedUsername = '';
    usernameStatus.textContent = '';
    syncChartDownloadButton();
});
usernameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submittedUsername = usernameInput.value.trim();
    usernameStatus.textContent = 'Success! Your username will appear on the downloaded chart.';
    syncChartDownloadButton();
});
downloadChartButton.addEventListener('click', async () => {
    if (!monthlyChart || !hasEntries() || !submittedUsername) return;

    await document.fonts.ready;
    const chartImage = new Image();
    chartImage.src = monthlyChart.toBase64Image('image/png');
    await chartImage.decode();

    const pixelRatio = chartImage.naturalWidth / chartCanvas.clientWidth || 1;
    const padding = Math.round(24 * pixelRatio);
    const headerHeight = Math.round(64 * pixelRatio);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartImage.naturalWidth;
    exportCanvas.height = chartImage.naturalHeight + headerHeight;
    const context = exportCanvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.fillStyle = '#182b24';
    context.font = `700 ${Math.round(24 * pixelRatio)}px "Manrope", "DM Sans", sans-serif`;
    context.textBaseline = 'middle';
    context.fillText(submittedUsername, padding, headerHeight / 2, exportCanvas.width - padding * 2);
    context.drawImage(chartImage, 0, headerHeight);

    const safeUsername = submittedUsername
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^\.+|\.+$/g, '') || 'username';
    const downloadLink = document.createElement('a');
    downloadLink.href = exportCanvas.toDataURL('image/png');
    downloadLink.download = `${safeUsername}.png`;
    downloadLink.click();
});

for (const tab of [dataTab, chartTab]) {
    tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        const nextTab = event.key === 'Home'
            ? dataTab
            : event.key === 'End'
                ? chartTab
                : tab === dataTab ? chartTab : dataTab;
        showTab(nextTab);
        nextTab.focus();
    });
}