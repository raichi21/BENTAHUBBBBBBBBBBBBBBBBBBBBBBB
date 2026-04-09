// STAFF DASHBOARD MODULE
document.addEventListener('DOMContentLoaded', function() {
    const session = getCurrentSession();
    if (!session || session.role !== 'staff') {
        window.location.href = '/index.html';
        return;
    }
    document.getElementById('userName').textContent = session.name || 'Staff';
    const initials = (session.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    loadDashboardData();
});

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

function switchPage(pageName, event) {
    if (event) event.preventDefault();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');
    
    const titleMap = {
        'dashboard': 'Dashboard',
        'inventory': 'Inventory Update',
        'monitoring': 'Transaction Monitoring',
        'transactions': 'Transaction History',
        'pickup': 'Payment & Pick-Up'
    };
    document.getElementById('pageTitle').textContent = titleMap[pageName] || 'Staff';

    if (pageName === 'monitoring') loadMonitoringData();
    if (pageName === 'transactions') loadTransactionHistory();
    if (pageName === 'pickup') loadPaymentPickupData();
}

function loadDashboardData() {
    const sales = getSalesData();
    
    // Calculate today's sales
    const today = new Date().toDateString();
    const todaySales = sales
        .filter(s => new Date(s.date).toDateString() === today)
        .reduce((sum, s) => sum + (s.total || 150), 0);
    
    document.getElementById('todaySalesCount').textContent = `₱${todaySales.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = sales.length;
    document.getElementById('lowStockAlerts').textContent = '3'; // Mock data
    document.getElementById('pendingTasks').textContent = '7'; // Mock data
    
    // Load recent activity
    const table = document.getElementById('activityTable');
    table.innerHTML = '';
    sales.slice(-5).forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(s.date)}</td>
            <td><span class="badge badge-success">Sale</span></td>
            <td>Transaction #${s.id} - ₱${s.total || '150.00'}</td>
            <td><span class="badge badge-success">Completed</span></td>
        `;
        table.appendChild(row);
    });
}

// Inventory Management Functions
function updateStockLevel(productId, newValue) {
    // Store the new value temporarily until saved
    const input = document.querySelector(`[data-product="${productId}"]`);
    input.dataset.newValue = newValue;
    
    // Update status badge based on stock level
    const row = input.closest('tr');
    const statusCell = row.querySelector('td:nth-child(4)');
    const minStock = parseInt(row.querySelector('td:nth-child(3)').textContent);
    const currentStock = parseInt(newValue);
    
    if (currentStock === 0) {
        statusCell.innerHTML = '<span class="badge badge-danger">Out of Stock</span>';
    } else if (currentStock <= minStock) {
        statusCell.innerHTML = '<span class="badge badge-warning">Low Stock</span>';
    } else {
        statusCell.innerHTML = '<span class="badge badge-success">In Stock</span>';
    }
}

function editStock(productId) {
    const input = document.querySelector(`[data-product="${productId}"]`);
    const button = input.closest('tr').querySelector('button');
    
    if (input.readOnly) {
        // Enter edit mode
        input.readOnly = false;
        input.focus();
        input.select();
        button.innerHTML = '<i class="fas fa-save"></i> Save';
        button.className = 'btn btn-small btn-success';
        button.onclick = () => saveStock(productId);
        
        // Store original value
        input.dataset.originalValue = input.value;
    }
}

function saveStock(productId) {
    const input = document.querySelector(`[data-product="${productId}"]`);
    const button = input.closest('tr').querySelector('button');
    const newValue = input.value;
    const oldValue = input.dataset.originalValue;
    const difference = newValue - oldValue;
    
    // Exit edit mode
    input.readOnly = true;
    button.innerHTML = '<i class="fas fa-edit"></i> Edit';
    button.className = 'btn btn-small btn-primary';
    button.onclick = () => editStock(productId);
    
    // Get product name
    const row = input.closest('tr');
    const productName = row.querySelector('td:first-child').textContent;
    
    // Update the default value
    input.defaultValue = newValue;
    
    // Add to recent updates table
    addStockUpdate(productName, difference, newValue);
}

function addStockUpdate(productName, quantity, newStock) {
    const table = document.getElementById('stockUpdatesTable');
    const row = document.createElement('tr');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const action = quantity > 0 ? 'Restock' : 'Sale/Usage';
    const actionClass = quantity > 0 ? 'badge-success' : 'badge-warning';
    
    row.innerHTML = `
        <td>${timeString}</td>
        <td>${productName}</td>
        <td><span class="badge ${actionClass}">${action}</span></td>
        <td>${quantity > 0 ? '+' : ''}${quantity}</td>
        <td>${newStock}</td>
        <td>Staff</td>
    `;
    
    // Insert at the top
    table.insertBefore(row, table.firstChild);
    
    // Keep only last 10 entries
    while (table.children.length > 10) {
        table.removeChild(table.lastChild);
    }
}

function addNewProduct() {
    // In a real app, this would open a modal to add a new product
}

function loadReservations() {
    const reservations = getReservations({ status: 'confirmed' });
    const table = document.getElementById('reservationTable');
    table.innerHTML = '';
    reservations.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.customer}</td>
            <td>${r.items.length} items</td>
            <td>${formatDate(r.pickup_date)}</td>
            <td><span class="badge badge-success">Confirmed</span></td>
            <td><button class="btn btn-small" onclick="generateReceipt('${r.id}')"><i class="fas fa-receipt"></i></button></td>
        `;
        table.appendChild(row);
    });
}

function loadPickupItems() {
    const reservations = getReservations({ status: 'confirmed' });
    const table = document.getElementById('pickupTable');
    table.innerHTML = '';
    reservations.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.id}</td>
            <td>${r.customer}</td>
            <td>${r.items.length}</td>
            <td><span class="badge badge-warning">Ready</span></td>
            <td><button class="btn btn-small btn-success" onclick="confirmPickup('${r.id}')">Confirm</button></td>
        `;
        table.appendChild(row);
    });
}

function generateReceipt(resId) {
}

function confirmPickup(orderId) {
}

// Transaction Monitoring Functions
function loadMonitoringData() {
    // Load live transaction data
    const transactions = getSalesData().slice(-10); // Get recent transactions
    const table = document.getElementById('liveTransactionsTable');
    table.innerHTML = '';
    
    transactions.forEach(t => {
        const row = document.createElement('tr');
        const status = Math.random() > 0.5 ? 'Completed' : 'In Progress';
        const statusClass = status === 'Completed' ? 'badge-success' : 'badge-info';
        row.innerHTML = `
            <td>${new Date(t.date).toLocaleTimeString()}</td>
            <td>TXN-${t.id}</td>
            <td>${t.cashier || 'Staff'}</td>
            <td>${t.items?.length || 3} items</td>
            <td>₱${t.total || '150.00'}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td><button class="btn btn-small" onclick="viewTransaction('TXN-${t.id}')"><i class="fas fa-eye"></i></button></td>
        `;
        table.appendChild(row);
    });
}

function refreshTransactions() {
    loadMonitoringData();
}

function viewTransaction(transactionId) {
    // In a real app, this would open a modal or navigate to transaction details
}

// Transaction History Functions
function loadTransactionHistory() {
    const transactions = getSalesData();
    const table = document.getElementById('transactionHistoryTable');
    table.innerHTML = '';
    
    transactions.forEach(t => {
        const row = document.createElement('tr');
        const paymentMethods = ['Cash', 'GCash', 'PayMaya', 'Card'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        row.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td>TXN-${t.id}</td>
            <td>${t.cashier || 'Staff'}</td>
            <td>${t.items?.length || 3} items</td>
            <td>₱${t.total || '150.00'}</td>
            <td>${paymentMethod}</td>
            <td>
                <button class="btn btn-small" onclick="viewReceipt('TXN-${t.id}')">
                    <i class="fas fa-receipt"></i>
                </button>
                <button class="btn btn-small" onclick="printReceipt('TXN-${t.id}')">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

function filterTransactions() {
    const dateFilter = document.getElementById('historyDateFilter').value;
    if (dateFilter) {
        // In a real app, this would filter the table based on the selected date
    } else {
        loadTransactionHistory();
    }
}

function exportTransactions() {
    // In a real app, this would generate and download a CSV or PDF
}

function viewReceipt(transactionId) {
    // In a real app, this would open a receipt modal or print preview
}

function printReceipt(transactionId) {
    // In a real app, this would trigger the browser's print dialog
}

// Payment & Pick-Up Functions
function loadPaymentPickupData() {
    // Load payment confirmations
    const payments = [
        { id: 'ORD-2024-001', customer: 'Anna Reyes', method: 'GCash', amount: '450.00', status: 'Pending' },
        { id: 'ORD-2024-002', customer: 'Carlos Mendoza', method: 'PayMaya', amount: '320.50', status: 'Confirmed' }
    ];
    
    const paymentTable = document.getElementById('paymentTable');
    paymentTable.innerHTML = '';
    
    payments.forEach(p => {
        const row = document.createElement('tr');
        const statusClass = p.status === 'Confirmed' ? 'badge-success' : 'badge-warning';
        const actionButton = p.status === 'Pending' 
            ? `<button class="btn btn-small btn-success" onclick="confirmPayment('${p.id}')"><i class="fas fa-check"></i> Confirm</button>`
            : `<button class="btn btn-small btn-primary" onclick="markReady('${p.id}')"><i class="fas fa-box"></i> Ready</button>`;
            
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.customer}</td>
            <td>${p.method}</td>
            <td>₱${p.amount}</td>
            <td><span class="badge ${statusClass}">${p.status}</span></td>
            <td>${actionButton}</td>
        `;
        paymentTable.appendChild(row);
    });
    
    // Load pickup queue
    const pickups = [
        { id: 'ORD-2024-003', customer: 'Maria Santos', items: '2 items', time: '10:30 AM', status: 'Ready' },
        { id: 'ORD-2024-004', customer: 'Juan Dela Cruz', items: '4 items', time: '11:15 AM', status: 'Preparing' }
    ];
    
    const pickupTable = document.getElementById('pickupTable');
    pickupTable.innerHTML = '';
    
    pickups.forEach(p => {
        const row = document.createElement('tr');
        const statusClass = p.status === 'Ready' ? 'badge-info' : 'badge-warning';
        const actionButton = p.status === 'Ready'
            ? `<button class="btn btn-small btn-success" onclick="completePickup('${p.id}')"><i class="fas fa-check-double"></i> Complete</button>`
            : `<button class="btn btn-small btn-primary" onclick="notifyCustomer('${p.id}')"><i class="fas fa-bell"></i> Notify</button>`;
            
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.customer}</td>
            <td>${p.items}</td>
            <td>${p.time}</td>
            <td><span class="badge ${statusClass}">${p.status}</span></td>
            <td>${actionButton}</td>
        `;
        pickupTable.appendChild(row);
    });
}

function refreshPayments() {
    loadPaymentPickupData();
}

function confirmPayment(orderId) {
    // In a real app, this would update the payment status in the database
    loadPaymentPickupData(); // Refresh the data
}

function markReady(orderId) {
    // In a real app, this would update the order status
    loadPaymentPickupData(); // Refresh the data
}

function completePickup(orderId) {
    // In a real app, this would mark the order as completed
    loadPaymentPickupData(); // Refresh the data
}

function notifyCustomer(orderId) {
    // In a real app, this would send a notification to the customer
}

/**
 * Open Add Product Modal
 */
function addNewProduct() {
    document.getElementById('addProductForm').reset();
    document.getElementById('addProductModal').classList.add('show');
}

/**
 * Close Modal
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

/**
 * Save New Product
 */
function saveNewProduct(event) {
    event.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const currentStock = document.getElementById('currentStock').value;
    const minStock = document.getElementById('minStock').value;
    const category = document.getElementById('productCategory').value;
    
    if (!productName || !currentStock || !minStock || !category) {
        alert('Please fill in all fields');
        return;
    }
    
    // Add new row to inventory table
    const table = document.getElementById('inventoryTable');
    const newRow = table.insertRow();
    
    const statusBadge = currentStock < minStock ? 
        '<span class="badge badge-warning">Low Stock</span>' : 
        currentStock == 0 ? 
        '<span class="badge badge-danger">Out of Stock</span>' :
        '<span class="badge badge-success">In Stock</span>';
    
    newRow.innerHTML = `
        <td>${productName}</td>
        <td><input type="number" value="${currentStock}" class="stock-input" data-product="${productName.toLowerCase()}" readonly></td>
        <td>${minStock}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-small btn-primary" onclick="editStock('${productName.toLowerCase()}')">
                <i class="fas fa-edit"></i> Edit
            </button>
        </td>
    `;
    
    // Show success message
    showAlert('success', 'Product added successfully!');
    
    // Close modal and reset form
    closeModal('addProductModal');
    document.getElementById('addProductForm').reset();
}

/**
 * Show Alert Message
 */
function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    const container = document.querySelector('main');
    container.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function logout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('bentahub_session');
    window.location.href = '/index.html';
}