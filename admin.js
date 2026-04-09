// ========================================
// ADMIN DASHBOARD MODULE
// ========================================

let currentPage = 'dashboard';

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

/**
 * Initialize Admin Dashboard
 */
function initializeAdminDashboard() {
    // Check authentication
    const session = getCurrentSession();
    if (!session || session.role !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // Update user info
    updateUserInfo(session);

    // Load dashboard data
    loadDashboardStats();
    loadBranchPerformance();
    initializeSalesTrendChart();
    
    // Set active page
    switchPage('dashboard', null);
}

/**
 * Update User Info Display
 */
function updateUserInfo(session) {
    document.getElementById('userName').textContent = session.name || 'Admin User';
    document.getElementById('userRole').textContent = 'Administrator';
    
    const initials = (session.name || 'AU').split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
}

/**
 * Toggle Sidebar for Mobile
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
}

/**
 * Load Dashboard Stats
 */
function loadDashboardStats() {
    const branches = getBranches();
    const sales = getSalesData();
    const today = new Date().toISOString().split('T')[0];
    const todaySales = getSalesData({ date: today });

    // Update stat cards
    document.getElementById('totalBranches').textContent = branches.length;
    document.getElementById('todaySales').textContent = formatCurrency(
        todaySales.reduce((sum, s) => sum + s.total, 0)
    );

    // Calculate total inventory
    const inventory = getAllInventory();
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('totalInventory').textContent = totalItems.toLocaleString();

    // Count low stock items
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level).length;
    document.getElementById('lowStockCount').textContent = lowStockItems;
}

/**
 * Load Branch Performance
 */
function loadBranchPerformance() {
    const branches = getBranches();
    const sales = getSalesData();
    const today = new Date().toISOString().split('T')[0];

    const table = document.getElementById('branchTable');
    table.innerHTML = '';

    branches.forEach(branch => {
        const branchSales = sales.filter(s => s.branch_id === branch.id && s.date === today);
        const totalSales = branchSales.reduce((sum, s) => sum + s.total, 0);
        const transactions = branchSales.length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${branch.name}</td>
            <td>${branch.manager}</td>
            <td>${transactions}</td>
            <td>${formatCurrency(totalSales)}</td>
            <td><span class="badge badge-success"><i class="fas fa-check-circle"></i> Active</span></td>
            <td>
                <button class="btn btn-small" onclick="viewBranchDetails('${branch.id}')"><i class="fas fa-eye"></i></button>
            </td>
        `;
        table.appendChild(row);
    });
}

/**
 * Switch Between Pages
 */
function switchPage(pageName, event) {
    if (event) {
        event.preventDefault();
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Update sidebar
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event && event.target.closest('.sidebar-nav-link')?.classList.add('active');

    // Update page title
    const titleMap = {
        'dashboard': 'Dashboard Overview',
        'monitoring': 'Centralized Monitoring',
        'sales': 'Sales Report',
        'reservations': 'Reservation Management',
        'users': 'User Management',
        'payments': 'Payment Management',
        'history': 'Transaction History',
        'pickup': 'Pickup Management',
        'profile': 'Admin Profile'
    };

    document.getElementById('pageTitle').textContent = titleMap[pageName] || 'Dashboard';
    currentPage = pageName;

    // Load page specific data
    loadPageData(pageName);
}

/**
 * Load Page-Specific Data
 */
function loadPageData(pageName) {
    switch(pageName) {
        case 'monitoring':
            updateMonitoring();
            break;
        case 'sales':
            filterSales();
            break;
        case 'reservations':
            filterReservations();
            break;
        case 'users':
            loadUsers();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'history':
            loadAdminTransactionHistory();
            break;
        case 'pickup':
            loadPickupData();
            break;
    }
}

/**
 * MONITORING MODULE
 */
function updateMonitoring() {
    const branchId = document.getElementById('monitoringBranch')?.value || 'all';
    let inventory = getAllInventory();

    if (branchId !== 'all') {
        inventory = inventory.filter(item => item.branch_id === branchId);
    }

    const table = document.getElementById('inventoryTable');
    table.innerHTML = '';

    inventory.forEach(item => {
        const product = getProductById(item.product_id);
        if (!product) return;

        const status = item.quantity > item.reorder_level ? 'Active' : 'Low Stock';
        const statusClass = item.quantity > item.reorder_level ? 'badge-success' : 'badge-danger';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${item.quantity}</td>
            <td>${item.reorder_level}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>${formatDate(item.last_updated)}</td>
        `;
        table.appendChild(row);
    });
}

function refreshMonitoring() {
    updateMonitoring();
    
}

function loadAdminTransactionHistory() {
    const table = document.getElementById('adminHistoryTable');
    table.innerHTML = '';

    const payments = getPayments();
    const sales = getSalesData();

    payments.slice().reverse().forEach(payment => {
        const sale = sales.find(s => s.id === payment.transaction_id) || {};
        const branch = getBranchById(sale.branch_id) || { name: 'Unknown' };
        const items = sale.items || 'N/A';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.date}</td>
            <td>${payment.transaction_id}</td>
            <td>${branch.name}</td>
            <td>${sale.cashier || 'N/A'}</td>
            <td>${items}</td>
            <td>₱${payment.amount.toFixed(2)}</td>
            <td>${payment.method.toUpperCase()}</td>
            <td><span class="badge badge-success">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span></td>
        `;
        table.appendChild(row);
    });
}

/**
 * SALES MODULE
 */
function filterSales() {
    const date = document.getElementById('salesDate')?.value || new Date().toISOString().split('T')[0];
    const branch = document.getElementById('salesBranch')?.value || '';

    let sales = getSalesData({ date: date });
    if (branch) {
        sales = sales.filter(s => s.branch_id === branch);
    }

    // Update summary
    const totalAmount = sales.reduce((sum, s) => sum + s.total, 0);
    const totalItems = sales.length;
    const avgTransaction = totalItems > 0 ? totalAmount / totalItems : 0;

    document.getElementById('totalSalesAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('totalTransactions').textContent = totalItems;
    document.getElementById('avgTransaction').textContent = formatCurrency(avgTransaction);

    // Update table
    const table = document.getElementById('salesTable');
    table.innerHTML = '';

    sales.forEach(sale => {
        const branch = getBranchById(sale.branch_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${branch?.name || 'Unknown'}</td>
            <td>${formatDate(sale.date)}, ${formatTime(sale.time)}</td>
            <td>${sale.items}</td>
            <td>${formatCurrency(sale.total)}</td>
            <td>${sale.cashier}</td>
            <td><span class="badge badge-success">Completed</span></td>
        `;
        table.appendChild(row);
    });
}

function exportSalesReport() {
}

/**
 * RESERVATIONS MODULE
 */
function filterReservations() {
    const status = document.getElementById('reservationStatus')?.value || '';
    const branchId = document.getElementById('reservationBranch')?.value || '';

    let reservations = getReservations();

    if (status) {
        reservations = reservations.filter(r => r.status === status);
    }
    if (branchId) {
        reservations = reservations.filter(r => r.branch_id === branchId);
    }

    const table = document.getElementById('reservationsTable');
    table.innerHTML = '';

    reservations.forEach(res => {
        const branch = getBranchById(res.branch_id);
        const statusClass = res.status === 'pending' ? 'badge-warning' : 
                          res.status === 'confirmed' ? 'badge-success' : 'badge-primary';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${res.id}</td>
            <td>${res.customer}</td>
            <td>${branch?.name || 'Unknown'}</td>
            <td>${res.items.length} items</td>
            <td>${formatDate(res.pickup_date)}</td>
            <td><span class="badge ${statusClass}">${res.status.charAt(0).toUpperCase() + res.status.slice(1)}</span></td>
            <td>
                <button class="btn btn-small btn-success" onclick="confirmReservation('${res.id}')">Confirm</button>
                <button class="btn btn-small btn-danger" onclick="cancelReservation('${res.id}')">Cancel</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function refreshReservations() {
    filterReservations();
}

function confirmReservation(id) {
}

function cancelReservation(id) {
}

/**
 * PAYMENTS MODULE
 */
function loadPaymentsData() {
    const payments = getPayments();
    const table = document.getElementById('paymentsTable');
    table.innerHTML = '';

    payments.forEach(payment => {
        const methodBadge = payment.method === 'cash' ? 'badge-primary' : 'badge-warning';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${payment.transaction_id}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td><span class="badge ${methodBadge}">${payment.method.toUpperCase()}</span></td>
            <td>${formatDate(payment.date)}, ${formatTime(payment.time)}</td>
            <td>${getBranchById(payment.branch)?.name || 'Unknown'}</td>
            <td><span class="badge badge-success">Verified</span></td>
            <td>
                <button class="btn btn-small" onclick="viewPaymentDetails('${payment.id}')"><i class="fas fa-eye"></i></button>
            </td>
        `;
        table.appendChild(row);
    });
}

function viewPaymentDetails(paymentId) {
}

/**
 * PICKUP MODULE
 */
function loadPickupData() {
    const reservations = getReservations({ status: 'confirmed' });
    const table = document.getElementById('pickupTable');
    table.innerHTML = '';

    reservations.forEach(res => {
        const branch = getBranchById(res.branch_id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${res.id}</td>
            <td>${res.customer}</td>
            <td>${branch?.name || 'Unknown'}</td>
            <td>${res.items.length}</td>
            <td>${formatDate(res.pickup_date)}</td>
            <td><span class="badge badge-warning">Pending</span></td>
            <td>
                <button class="btn btn-small btn-success" onclick="confirmPickup('${res.id}')">Confirm</button>
                <button class="btn btn-small" onclick="viewPickupDetails('${res.id}')">View</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function confirmPickup(orderId) {
}

function viewPickupDetails(orderId) {
}

function viewBranchDetails(branchId) {
    switchPage('monitoring', null);
    document.getElementById('monitoringBranch').value = branchId;
    updateMonitoring();
}

/**
 * MODAL FUNCTIONS
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function applyFilters() {
    filterSales();
    closeModal('filterModal');
}

/**
 * USER MANAGEMENT MODULE
 */
let currentEditingUserId = null;

function loadUsers() {
    const users = getUsers();
    const table = document.getElementById('usersTable');
    table.innerHTML = '';

    users.forEach(user => {
        const statusClass = user.status === 'active' ? 'badge-success' : 'badge-danger';
        const roleClass = user.role === 'admin' ? 'badge-primary' : 
                         user.role === 'cashier' ? 'badge-warning' : 
                         user.role === 'staff' ? 'badge-info' : 'badge-secondary';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${roleClass}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
            <td>${user.branch === 'all' ? 'All Branches' : user.branch}</td>
            <td><span class="badge ${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td>${user.joinDate}</td>
            <td>
                <button class="btn btn-small" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        table.appendChild(row);
    });
}

function editUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        currentEditingUserId = userId;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserBranch').value = user.branch;
        document.getElementById('editUserStatus').value = user.status;
        openModal('editUserModal');
    }
}

function saveEditUser() {
    if (!currentEditingUserId) return;
    
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const role = document.getElementById('editUserRole').value;
    const branch = document.getElementById('editUserBranch').value;
    const status = document.getElementById('editUserStatus').value;

    if (!name || !email) {
        return;
    }

    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentEditingUserId);
    
    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].email = email;
        users[userIndex].role = role;
        users[userIndex].branch = branch;
        users[userIndex].status = status;
        
        localStorage.setItem('bentahub_users', JSON.stringify(users));
        loadUsers();
        closeModal('editUserModal');
        currentEditingUserId = null;
    }
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    let users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user.id === 'U001') {
        return;
    }
    
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('bentahub_users', JSON.stringify(users));
    loadUsers();
}

function saveNewUser() {
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    const role = document.getElementById('newUserRole').value;
    const branch = document.getElementById('newUserBranch').value;

    if (!name || !email || !password) {
        return;
    }

    let users = getUsers();
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        return;
    }

    // Generate new user ID
    const newId = 'U' + String(Math.max(...users.map(u => parseInt(u.id.substring(1)))) + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];

    const newUser = {
        id: newId,
        name: name,
        email: email,
        role: role,
        branch: branch,
        status: 'active',
        joinDate: today,
        password: password
    };

    users.push(newUser);
    localStorage.setItem('bentahub_users', JSON.stringify(users));
    
    // Reset form
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'cashier';
    document.getElementById('newUserBranch').value = 'all';
    
    loadUsers();
    closeModal('addUserModal');
}

/**
 * HELPER FUNCTIONS FOR USER DATA
 */
function getUsers() {
    const usersData = localStorage.getItem('bentahub_users');
    return usersData ? JSON.parse(usersData) : USERS;
}

/**
 * LOGOUT
 */
function logout(event) {
    if (event) {
        event.preventDefault();
    }
    localStorage.removeItem('bentahub_session');
    localStorage.removeItem('bentahub_user');
    window.location.href = '/index.html';
}

/**
 * NOTIFICATION BELL TOGGLE
 */
function toggleNotifications() {
    // Placeholder for notification panel toggle
    // Can be expanded to show notification center later
    console.log('Notifications clicked');
}

/**
 * Initialize Sales Trend Chart
 */
let salesTrendChart = null;

function initializeSalesTrendChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    const chartData = getSalesTrendData('week');
    
    if (salesTrendChart) {
        salesTrendChart.destroy();
    }

    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                filler: true
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        },
                        color: '#6b7280'
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    ticks: {
                        color: '#6b7280'
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                }
            }
        }
    });
}

/**
 * Get Sales Trend Data
 */
function getSalesTrendData(period) {
    let labels, data;

    if (period === 'week') {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        data = [1200, 2100, 3200, 3500, 2800, 4200];
    } else if (period === 'month') {
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        data = [5200, 6100, 5800, 7200];
    } else {
        labels = ['Q1', 'Q2', 'Q3', 'Q4'];
        data = [45200, 52100, 48800, 61200];
    }

    return {
        labels: labels,
        datasets: [
            {
                label: 'Sales',
                data: data,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ec4899',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }
        ]
    };
}

/**
 * Update Sales Trend Chart
 */
function updateSalesTrend() {
    const period = document.getElementById('trendPeriod').value;
    const chartData = getSalesTrendData(period);
    
    if (salesTrendChart) {
        salesTrendChart.data = chartData;
        salesTrendChart.update();
    }
}

// Add modal click-outside functionality
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});