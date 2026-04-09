/* STAFF DASHBOARD STYLES */
.page { display: none; }
.page.active { display: block; animation: fadeIn 0.4s ease-out; }

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
    background-color: rgba(26, 86, 219, 0.1);
    color: var(--primary-color);
}

.stat-card.success .stat-icon {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
}

.stat-card.warning .stat-icon {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--warning-color);
}

.alert {
    position: fixed;
    top: var(--spacing-xl);
    right: var(--spacing-xl);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    z-index: 3000;
    animation: slideInRight 0.4s ease-out;
    box-shadow: var(--shadow-lg);
}

.alert-success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--success-color);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */

/* Mobile Styles */
@media (max-width: 767px) {
    .stat-icon {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
    }
    
    .alert {
        top: var(--spacing-md);
        right: var(--spacing-md);
        left: var(--spacing-md);
        max-width: none;
    }
}

/* ========================================
   MODAL STYLES
   ======================================== */
.modal {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.3s ease-out;
}

.modal.show {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: var(--bg-primary);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
    margin: 0;
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: color var(--transition-fast);
    padding: 0;
}

.modal-close:hover {
    color: var(--text-primary);
}

.modal-body {
    margin-bottom: var(--spacing-lg);
}

.modal-body .form-group {
    margin-bottom: var(--spacing-lg);
}

.modal-footer {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Alert Messages */
.alert {
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    animation: slideInRight 0.3s ease-out;
}

.alert-success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--success-color);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.alert-error {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--danger-color);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}