// ========================================
// CASHIER DASHBOARD MODULE
// ========================================

let cartItems = [];
let selectedPaymentMethod = 'cash';
let userBranch = 'B001';

document.addEventListener('DOMContentLoaded', function() {
    initializeCashierDashboard();
});

function initializeCashierDashboard() {
    const session = getCurrentSession();
    if (!session || session.role !== 'cashier') {
        window.location.href = '/index.html';
        return;
    }

    userBranch = session.branch || 'B001';
    document.getElementById('userName').textContent = session.name || 'Cashier';
    const initials = (session.name || 'C').split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    loadPOSProducts();
    loadInventoryData();
}

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
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const page = document.getElementById(pageName);
    if (page) page.classList.add('active');

    document.querySelectorAll('.sidebar-nav-link').forEach(link => link.classList.remove('active'));
    event?.target.closest('.sidebar-nav-link')?.classList.add('active');

    const titleMap = {
        'pos': 'Point of Sale System',
        'monitoring': 'Stock Availability Check',
        'reservations': 'Confirm Reservations',
        'payments': 'Validate Payments',
        'history': 'Transaction History'
    };

    document.getElementById('pageTitle').textContent = titleMap[pageName] || 'POS';

    if (pageName === 'monitoring') loadInventoryData();
    if (pageName === 'reservations') loadReservationData();
    if (pageName === 'history') loadCashierTransactionHistory();
}

function loadPOSProducts() {
    const products = getProducts();
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="product-price">${formatCurrency(product.price)}</p>
            </div>
            <button class="btn btn-small btn-primary" onclick="addToCart('${product.id}')">
                <i class="fas fa-plus"></i> Add
            </button>
        `;
        grid.appendChild(card);
    });
}

function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    updateCartDisplay();
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cart = document.getElementById('posCart');
    
    if (cartItems.length === 0) {
        cart.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-shopping-cart"></i></div>
                <p class="empty-message">No items added</p>
            </div>
        `;
        document.getElementById('subtotal').textContent = '₱0.00';
        document.getElementById('grandTotal').textContent = '₱0.00';
        return;
    }

    let html = '';
    let subtotal = 0;

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">${formatCurrency(item.price)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="btn btn-small" onclick="decreaseQuantity('${item.id}')">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="cart-item-total">${formatCurrency(itemTotal)}</p>
            </div>
        `;
    });

    cart.innerHTML = html;
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    updateTotal();
}

function decreaseQuantity(productId) {
    const item = cartItems.find(i => i.id === productId);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(productId);
            return;
        }
    }
    updateCartDisplay();
}

function updateTotal() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;
    document.getElementById('grandTotal').textContent = formatCurrency(total);
}

function selectPaymentMethod(method, event) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));

    if (event && event.target) {
        const button = event.target.closest('.method-btn');
        if (button) {
            button.classList.add('active');
        }
    }
}

function completeSale() {
    if (cartItems.length === 0) {
        return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = subtotal - discount;

    // Generate receipt
    generateReceipt(cartItems, subtotal, discount, total, selectedPaymentMethod);

    // Show receipt modal
    showReceiptModal();

    // Reset cart after showing receipt
    setTimeout(() => {
        cartItems = [];
        document.getElementById('discount').value = '';
        updateCartDisplay();
    }, 1000);
}

function cancelSale() {
    if (cartItems.length > 0) {
        if (confirm('Are you sure you want to cancel this transaction?')) {
            cartItems = [];
            document.getElementById('discount').value = '';
            updateCartDisplay();
        }
    }
}

function loadInventoryData() {
    const inventory = getInventoryByBranch(userBranch);
    const table = document.getElementById('inventoryTable');
    table.innerHTML = '';

    inventory.forEach(item => {
        const product = getProductById(item.product_id);
        if (!product) return;

        const status = item.quantity > item.reorder_level ? 'In Stock' : 'Low Stock';
        const statusClass = item.quantity > item.reorder_level ? 'badge-success' : 'badge-danger';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${item.quantity}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>${item.reorder_level}</td>
        `;
        table.appendChild(row);
    });
}

function loadReservationData() {
    const reservations = getReservations({ branch_id: userBranch, status: 'pending' });
    const table = document.getElementById('reservationTable');
    table.innerHTML = '';

    reservations.forEach(res => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${res.customer}</td>
            <td>${res.items.length} items</td>
            <td>${formatDate(res.date)}</td>
            <td><span class="badge badge-warning">Pending</span></td>
            <td>
                <button class="btn btn-small btn-success" onclick="confirmRes('${res.id}')">Confirm</button>
            </td>
        `;
        table.appendChild(row);
    });
}

function confirmRes(resId) {
}

function loadCashierTransactionHistory() {
    const table = document.getElementById('cashierHistoryTable');
    table.innerHTML = '';

    const payments = getPayments({ status: 'verified' });
    const sales = getSalesData();

    payments.slice(-10).reverse().forEach(payment => {
        const sale = sales.find(s => s.id === payment.transaction_id) || {};
        const itemCount = sale.items || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.date}</td>
            <td>${payment.transaction_id}</td>
            <td>${itemCount}</td>
            <td>₱${payment.amount.toFixed(2)}</td>
            <td>${payment.method.toUpperCase()}</td>
            <td><span class="badge badge-success">${payment.status}</span></td>
            <td><button class="btn btn-small" onclick="viewSaleDetails('${payment.transaction_id}')"><i class="fas fa-eye"></i></button></td>
        `;
        table.appendChild(row);
    });
}

function viewSaleDetails(transactionId) {
}

function validatePayment() {
    const transactionId = document.getElementById('paymentTransactionId').value;
    const amount = document.getElementById('paymentAmount').value;

    if (!transactionId || !amount) {
        return;
    }

    document.getElementById('paymentTransactionId').value = '';
    document.getElementById('paymentAmount').value = '';
}



function logout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('bentahub_session');
    window.location.href = '/index.html';
}

// Update total when discount changes
document.addEventListener('change', function(e) {
    if (e.target.id === 'discount') {
        updateTotal();
    }
});

// ========================================
// RECEIPT FUNCTIONS
// ========================================

function generateReceipt(items, subtotal, discount, total, paymentMethod) {
    const now = new Date();
    const session = getCurrentSession();

    // Generate receipt number (simple increment)
    const receiptNumber = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

    // Update receipt header
    document.getElementById('receiptNumber').textContent = receiptNumber;
    document.getElementById('receiptBranch').textContent = session.branch || 'Main Branch';
    document.getElementById('receiptDate').textContent = `Date: ${now.toLocaleDateString()}`;
    document.getElementById('receiptTime').textContent = `Time: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    document.getElementById('receiptCashier').textContent = session.name || 'Cashier';

    // Generate receipt items
    const receiptItems = document.getElementById('receiptItems');
    receiptItems.innerHTML = '';

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'receipt-item';
        itemDiv.innerHTML = `
            <div class="receipt-item-name">${item.name}</div>
            <div class="receipt-item-qty">${item.quantity}</div>
            <div class="receipt-item-price">${formatCurrency(item.price * item.quantity)}</div>
        `;
        receiptItems.appendChild(itemDiv);
    });

    // Update totals
    document.getElementById('receiptSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('receiptTotal').textContent = formatCurrency(total);
    document.getElementById('receiptPayment').textContent = paymentMethod === 'cash' ? 'Cash' : 'GCash';

    // Show discount if any
    const discountRow = document.getElementById('receiptDiscountRow');
    const discountSpan = document.getElementById('receiptDiscount');
    if (discount > 0) {
        discountRow.style.display = 'flex';
        discountSpan.textContent = `-${formatCurrency(discount)}`;
    } else {
        discountRow.style.display = 'none';
    }
}

function showReceiptModal() {
    const modal = document.getElementById('receiptModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                    .receipt { max-width: 300px; margin: 0 auto; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .receipt-item-name { flex: 1; margin-right: 10px; }
                    .receipt-item-qty { width: 30px; text-align: center; }
                    .receipt-item-price { width: 60px; text-align: right; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .grand-total { font-weight: bold; border-top: 1px solid #666; padding-top: 4px; margin-top: 4px; }
                    .receipt-divider { border-top: 1px dashed #666; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="receipt">${receiptContent}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}