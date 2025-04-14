// SmartSplit App - Main JavaScript

// Global state
const state = {
    members: [],
    expenses: [],
    settlements: [],
    currentUser: null, // For future authentication
    nextMemberId: 1,
    nextExpenseId: 1,
    nextSettlementId: 1,
    syncCode: null
};

// Load data from localStorage
function loadData() {
    const savedMembers = localStorage.getItem('smartsplit_members');
    const savedExpenses = localStorage.getItem('smartsplit_expenses');
    const savedSettlements = localStorage.getItem('smartsplit_settlements');
    
    if (savedMembers) {
        state.members = JSON.parse(savedMembers);
        state.nextMemberId = Math.max(...state.members.map(m => m.id), 0) + 1;
    }
    
    if (savedExpenses) {
        state.expenses = JSON.parse(savedExpenses);
        state.nextExpenseId = Math.max(...state.expenses.map(e => e.id), 0) + 1;
    }
    
    if (savedSettlements) {
        state.settlements = JSON.parse(savedSettlements);
        state.nextSettlementId = Math.max(...state.settlements.map(s => s.id), 0) + 1;
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('smartsplit_members', JSON.stringify(state.members));
    localStorage.setItem('smartsplit_expenses', JSON.stringify(state.expenses));
    localStorage.setItem('smartsplit_settlements', JSON.stringify(state.settlements));
}

// Tab Navigation
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show the selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Activate the nav link
    document.getElementById(tabId + '-tab').classList.add('active');
    
    // Update UI based on tab
    if (tabId === 'dashboard') {
        renderDashboard();
    } else if (tabId === 'members') {
        renderMembers();
    } else if (tabId === 'expense') {
        setupExpenseForm();
    } else if (tabId === 'settlements') {
        renderSettlements();
        setupSettlementForm();
    }
}

// Initialize the application
function init() {
    loadData();
    setupEventListeners();
    setupSyncEventListeners();
    showTab('dashboard');
    
    // Set current date for expense and settlement forms
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('expense-date')) {
        document.getElementById('expense-date').value = today;
    }
    if (document.getElementById('settlement-date')) {
        document.getElementById('settlement-date').value = today;
    }
    
    // Add toast container
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add member form submission
    document.getElementById('save-member-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('member-name');
        const emailInput = document.getElementById('member-email');
        
        if (!nameInput.value.trim()) {
            alert('Please enter a name for the member');
            return;
        }
        
        addMember(nameInput.value.trim(), emailInput.value.trim());
        
        nameInput.value = '';
        emailInput.value = '';
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('add-member-modal'));
        modal.hide();
    });
    
    // Update member button
    document.getElementById('update-member-btn').addEventListener('click', () => {
        const id = parseInt(document.getElementById('edit-member-id').value);
        const name = document.getElementById('edit-member-name').value.trim();
        const email = document.getElementById('edit-member-email').value.trim();
        
        if (!name) {
            alert('Please enter a name for the member');
            return;
        }
        
        updateMember(id, name, email);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('edit-member-modal'));
        modal.hide();
    });
    
    // Delete member button
    document.getElementById('delete-member-btn').addEventListener('click', () => {
        const id = parseInt(document.getElementById('edit-member-id').value);
        
        // Check if member has expenses
        const hasExpenses = state.expenses.some(e => 
            e.paidBy === id || e.splits.some(s => s.memberId === id)
        );
        
        if (hasExpenses) {
            alert('Cannot delete member with existing expenses. Remove their expenses first.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this member?')) {
            deleteMember(id);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('edit-member-modal'));
            modal.hide();
        }
    });
    
    // Expense form submission
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const expenseData = getExpenseFormData();
        if (!expenseData) return;
        
        addExpense(
            expenseData.description,
            expenseData.amount,
            expenseData.paidById,
            expenseData.date,
            expenseData.splits,
            expenseData.category,
            expenseData.notes
        );
        
        // Reset form
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').value = expenseData.date; // Keep the date
        
        showTab('dashboard');
    });
    
    // Split type change
    document.querySelectorAll('input[name="split-type"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const customSplitContainer = document.getElementById('custom-split-container');
            if (radio.value === 'custom') {
                customSplitContainer.classList.remove('d-none');
                setupCustomSplitInputs();
            } else {
                customSplitContainer.classList.add('d-none');
            }
        });
    });
    
    // Settlement form submission
    document.getElementById('settlement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fromId = parseInt(document.getElementById('settlement-from').value);
        const toId = parseInt(document.getElementById('settlement-to').value);
        const amount = parseFloat(document.getElementById('settlement-amount').value);
        const date = document.getElementById('settlement-date').value;
        const method = document.getElementById('settlement-method').value;
        
        if (fromId === toId) {
            alert('From and To members must be different');
            return;
        }
        
        addSettlement(fromId, toId, amount, date, method);
        
        // Reset form but keep the date
        document.getElementById('settlement-form').reset();
        document.getElementById('settlement-date').value = date;
        
        showTab('dashboard');
    });
    
    // Delete expense button
    document.getElementById('delete-expense-btn').addEventListener('click', () => {
        const expenseId = parseInt(document.getElementById('delete-expense-btn').dataset.expenseId);
        
        if (confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(expenseId);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('view-expense-modal'));
            modal.hide();
            
            showTab('dashboard');
        }
    });
}

// Add a new member
function addMember(name, email = '') {
    const newMember = {
        id: state.nextMemberId++,
        name,
        email,
        createdAt: new Date().toISOString()
    };
    
    state.members.push(newMember);
    saveData();
    renderMembers();
    setupExpenseForm();
    setupSettlementForm();
}

// Update a member
function updateMember(id, name, email) {
    const memberIndex = state.members.findIndex(m => m.id === id);
    if (memberIndex !== -1) {
        state.members[memberIndex].name = name;
        state.members[memberIndex].email = email;
        saveData();
        renderMembers();
        renderDashboard();
    }
}

// Delete a member
function deleteMember(id) {
    state.members = state.members.filter(m => m.id !== id);
    saveData();
    renderMembers();
    renderDashboard();
}

// Add a new expense
function addExpense(description, amount, paidById, date, splits, category = 'other', notes = '') {
    const newExpense = {
        id: state.nextExpenseId++,
        description,
        amount,
        paidBy: paidById,
        date,
        splits,
        category,
        notes,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser || 'anonymous'
    };
    
    state.expenses.push(newExpense);
    saveData();
    renderDashboard();
    
    // Show toast notification
    showToast('Expense added successfully', 'success');
}

// Delete an expense
function deleteExpense(id) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveData();
    renderDashboard();
}

// Add a settlement
function addSettlement(fromId, toId, amount, date, method = 'other') {
    const newSettlement = {
        id: state.nextSettlementId++,
        fromMemberId: fromId,
        toMemberId: toId,
        amount,
        date,
        method,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser || 'anonymous'
    };
    
    state.settlements.push(newSettlement);
    saveData();
    renderDashboard();
    renderSettlements();
    
    // Show toast notification
    showToast('Settlement recorded successfully', 'success');
}

// Setup expense form
function setupExpenseForm() {
    const payerSelect = document.getElementById('expense-payer');
    const splitMembersContainer = document.getElementById('expense-split-members');
    
    // Clear existing options/checkboxes
    payerSelect.innerHTML = '<option value="" disabled selected>Select who paid</option>';
    splitMembersContainer.innerHTML = '';
    
    // Add options for each member
    state.members.forEach(member => {
        // Add to payer dropdown
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        payerSelect.appendChild(option);
        
        // Add to split checkboxes
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" name="split-member" id="split-member-${member.id}" value="${member.id}" checked>
            <label class="form-check-label" for="split-member-${member.id}">
                ${member.name}
            </label>
        `;
        splitMembersContainer.appendChild(div);
    });
    
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

// Setup custom split inputs based on checked members
function setupCustomSplitInputs() {
    const container = document.getElementById('custom-split-container');
    container.innerHTML = '';
    
    const totalAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const checkedMembers = Array.from(document.querySelectorAll('input[name="split-member"]:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (checkedMembers.length === 0) return;
    
    const equalSplit = totalAmount / checkedMembers.length;
    
    checkedMembers.forEach(memberId => {
        const member = state.members.find(m => m.id === memberId);
        if (!member) return;
        
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `
            <label class="form-label">${member.name}</label>
            <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" step="0.01" min="0" class="form-control custom-split-input" 
                    id="custom-amount-${memberId}" value="${equalSplit.toFixed(2)}">
            </div>
        `;
        container.appendChild(div);
    });
    
    // Add event listeners to update other inputs when one changes
    const inputs = document.querySelectorAll('.custom-split-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateCustomSplitInputs(input);
        });
    });
}

// Update custom split inputs when one changes to maintain total
function updateCustomSplitInputs(changedInput) {
    const totalAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const inputs = Array.from(document.querySelectorAll('.custom-split-input'));
    
    // Calculate current total
    let currentTotal = 0;
    inputs.forEach(input => {
        currentTotal += parseFloat(input.value) || 0;
    });
    
    // If we're at the exact total, do nothing
    if (Math.abs(currentTotal - totalAmount) < 0.01) return;
    
    // Calculate how much to adjust other inputs
    const remaining = totalAmount - parseFloat(changedInput.value);
    const otherInputs = inputs.filter(input => input !== changedInput);
    
    if (otherInputs.length === 0) return;
    
    // Calculate the current total of other inputs
    let otherTotal = 0;
    otherInputs.forEach(input => {
        otherTotal += parseFloat(input.value) || 0;
    });
    
    // Adjust other inputs proportionally
    if (otherTotal > 0) {
        otherInputs.forEach(input => {
            const currentValue = parseFloat(input.value) || 0;
            const proportion = currentValue / otherTotal;
            input.value = (remaining * proportion).toFixed(2);
        });
    } else {
        // If other inputs are all 0, distribute equally
        const equalShare = remaining / otherInputs.length;
        otherInputs.forEach(input => {
            input.value = equalShare.toFixed(2);
        });
    }
}

// Setup settlement form
function setupSettlementForm() {
    const fromSelect = document.getElementById('settlement-from');
    const toSelect = document.getElementById('settlement-to');
    
    // Clear existing options
    fromSelect.innerHTML = '<option value="" disabled selected>Select payer</option>';
    toSelect.innerHTML = '<option value="" disabled selected>Select recipient</option>';
    
    // Add options for each member
    state.members.forEach(member => {
        // Add to from dropdown
        const fromOption = document.createElement('option');
        fromOption.value = member.id;
        fromOption.textContent = member.name;
        fromSelect.appendChild(fromOption);
        
        // Add to to dropdown
        const toOption = document.createElement('option');
        toOption.value = member.id;
        toOption.textContent = member.name;
        toSelect.appendChild(toOption);
    });
}

// Render the dashboard with balances and activity
function renderDashboard() {
    renderBalanceSummary();
    renderAllBalances();
    renderRecentActivity();
}

// Render the balance summary section of the dashboard
function renderBalanceSummary() {
    const container = document.getElementById('balance-summary');
    
    if (state.members.length === 0) {
        container.innerHTML = '<p>No members added yet. Add members to get started.</p>';
        return;
    }
    
    const balances = calculateBalances();
    let html = '';
    
    Object.entries(balances).forEach(([memberId, balance]) => {
        const member = state.members.find(m => m.id === parseInt(memberId));
        if (!member) return;
        
        let balanceClass = 'amount-neutral';
        if (balance > 0) balanceClass = 'amount-positive';
        if (balance < 0) balanceClass = 'amount-negative';
        
        let balanceText = '';
        if (balance > 0) balanceText = `gets back $${balance.toFixed(2)}`;
        if (balance < 0) balanceText = `owes $${Math.abs(balance).toFixed(2)}`;
        if (balance === 0) balanceText = 'is settled up';
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${member.name}</span>
                <span class="${balanceClass}">${balanceText}</span>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p>No expenses recorded yet.</p>';
}

// Render all balances section of the dashboard
function renderAllBalances() {
    const container = document.getElementById('all-balances');
    
    if (state.members.length === 0) {
        container.innerHTML = '<p>No members added yet. Add members to get started.</p>';
        return;
    }
    
    const individualBalances = calculateIndividualBalances();
    
    if (Object.keys(individualBalances).length === 0) {
        container.innerHTML = '<p>No expenses recorded yet.</p>';
        return;
    }
    
    // Generate simplified balances for display
    const simplifiedBalances = simplifyDebts(individualBalances);
    
    let html = '';
    simplifiedBalances.forEach(balance => {
        const fromMember = state.members.find(m => m.id === balance.from);
        const toMember = state.members.find(m => m.id === balance.to);
        
        if (!fromMember || !toMember) return;
        
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${fromMember.name} owes ${toMember.name}</span>
                <span class="amount-negative">$${balance.amount.toFixed(2)}</span>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p>Everyone is settled up!</p>';
}

// Render recent activity with more details
function renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    
    const activities = [
        ...state.expenses.map(e => ({
            type: 'expense',
            data: e,
            date: new Date(e.createdAt)
        })),
        ...state.settlements.map(s => ({
            type: 'settlement',
            data: s,
            date: new Date(s.createdAt)
        }))
    ].sort((a, b) => b.date - a.date).slice(0, 5);
    
    if (activities.length === 0) {
        container.innerHTML = '<p>No activity yet.</p>';
        return;
    }
    
    let html = '';
    activities.forEach(activity => {
        if (activity.type === 'expense') {
            const expense = activity.data;
            const payer = state.members.find(m => m.id === expense.paidBy);
            const categoryBadge = getCategoryBadge(expense.category);
            
            html += `
                <div class="activity-item" data-id="${expense.id}" onclick="showExpenseDetails(${expense.id})">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="activity-date">${formatDate(expense.date)}</div>
                            <div class="activity-title">${expense.description} ${categoryBadge}</div>
                            <div class="activity-description">
                                ${payer ? payer.name : 'Unknown'} paid $${expense.amount.toFixed(2)}
                            </div>
                        </div>
                        <span class="badge bg-primary rounded-pill">$${expense.amount.toFixed(2)}</span>
                    </div>
                </div>
            `;
        } else if (activity.type === 'settlement') {
            const settlement = activity.data;
            const fromMember = state.members.find(m => m.id === settlement.fromMemberId);
            const toMember = state.members.find(m => m.id === settlement.toMemberId);
            
            html += `
                <div class="activity-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="activity-date">${formatDate(settlement.date)}</div>
                            <div class="activity-title">Settlement</div>
                            <div class="activity-description">
                                ${fromMember ? fromMember.name : 'Unknown'} paid 
                                ${toMember ? toMember.name : 'Unknown'} $${settlement.amount.toFixed(2)}
                            </div>
                        </div>
                        <span class="badge bg-success rounded-pill">$${settlement.amount.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

// Get category badge HTML
function getCategoryBadge(category) {
    const categories = {
        'food': 'Food & Drinks',
        'transportation': 'Transportation',
        'accommodation': 'Accommodation',
        'activities': 'Activities',
        'shopping': 'Shopping',
        'other': 'Other'
    };
    
    return `<span class="category-badge category-${category}">${categories[category] || 'Other'}</span>`;
}

// Show expense details in modal
function showExpenseDetails(expenseId) {
    const expense = state.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const payer = state.members.find(m => m.id === expense.paidBy);
    const modal = new bootstrap.Modal(document.getElementById('view-expense-modal'));
    const container = document.getElementById('expense-details-content');
    
    // Calculate who was part of this expense
    const participants = expense.splits.map(split => {
        const member = state.members.find(m => m.id === split.memberId);
        return {
            name: member ? member.name : 'Unknown',
            amount: split.amount
        };
    });
    
    const categoryBadge = getCategoryBadge(expense.category);
    
    let html = `
        <div class="mb-4">
            <h4>${expense.description}</h4>
            <div class="d-flex align-items-center mb-2">
                <div class="me-auto">${categoryBadge}</div>
                <div class="text-muted">${formatDate(expense.date)}</div>
            </div>
            <div class="h3 mb-3">$${expense.amount.toFixed(2)}</div>
            <div class="mb-3">
                <strong>Paid by:</strong> ${payer ? payer.name : 'Unknown'}
            </div>
            ${expense.notes ? `<div class="mb-3 text-muted">${expense.notes}</div>` : ''}
        </div>
        
        <div class="mb-3">
            <h5 class="mb-3">Split Details</h5>
            <div class="list-group">
    `;
    
    participants.forEach(participant => {
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>${participant.name}</div>
                <div>$${participant.amount.toFixed(2)}</div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="text-muted small">
            Added on ${formatDateTime(expense.createdAt)}
            ${expense.createdBy !== 'anonymous' ? `by ${expense.createdBy}` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Set the expense ID on the delete button
    document.getElementById('delete-expense-btn').dataset.expenseId = expense.id;
    
    modal.show();
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set background color based on type
    let bgColor = 'bg-info';
    let icon = 'bi-info-circle';
    
    if (type === 'success') {
        bgColor = 'bg-success';
        icon = 'bi-check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-danger';
        icon = 'bi-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-warning';
        icon = 'bi-exclamation-triangle';
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-header">
            <i class="bi ${icon} me-2 text-${type}"></i>
            <strong class="me-auto">SmartSplit</strong>
            <small>just now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

// Generate a sync code from the current state
function generateSyncCode() {
    const data = {
        members: state.members,
        expenses: state.expenses,
        settlements: state.settlements,
        nextMemberId: state.nextMemberId,
        nextExpenseId: state.nextExpenseId,
        nextSettlementId: state.nextSettlementId,
        timestamp: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(data);
    // Use base64 encoding for the sync code
    return btoa(jsonData);
}

// Import data from a sync code
function importSyncCode(syncCode) {
    try {
        // Decode the sync code
        const jsonData = atob(syncCode);
        const data = JSON.parse(jsonData);
        
        // Validate the data
        if (!data.members || !data.expenses || !data.settlements) {
            throw new Error('Invalid sync code format');
        }
        
        // If current data is empty, just use the imported data
        if (state.members.length === 0 && state.expenses.length === 0 && state.settlements.length === 0) {
            state.members = data.members;
            state.expenses = data.expenses;
            state.settlements = data.settlements;
            state.nextMemberId = data.nextMemberId || Math.max(...data.members.map(m => m.id), 0) + 1;
            state.nextExpenseId = data.nextExpenseId || Math.max(...data.expenses.map(e => e.id), 0) + 1;
            state.nextSettlementId = data.nextSettlementId || Math.max(...data.settlements.map(s => s.id), 0) + 1;
        } else {
            // Merge members
            data.members.forEach(importedMember => {
                const existingMember = state.members.find(m => m.id === importedMember.id);
                if (!existingMember) {
                    state.members.push(importedMember);
                }
            });
            
            // Merge expenses
            data.expenses.forEach(importedExpense => {
                const existingExpense = state.expenses.find(e => e.id === importedExpense.id);
                if (!existingExpense) {
                    state.expenses.push(importedExpense);
                }
            });
            
            // Merge settlements
            data.settlements.forEach(importedSettlement => {
                const existingSettlement = state.settlements.find(s => s.id === importedSettlement.id);
                if (!existingSettlement) {
                    state.settlements.push(importedSettlement);
                }
            });
            
            // Update counters
            state.nextMemberId = Math.max(state.nextMemberId, data.nextMemberId || 0);
            state.nextExpenseId = Math.max(state.nextExpenseId, data.nextExpenseId || 0);
            state.nextSettlementId = Math.max(state.nextSettlementId, data.nextSettlementId || 0);
        }
        
        // Save data and refresh UI
        saveData();
        showTab('dashboard');
        
        return true;
    } catch (error) {
        console.error('Error importing sync code:', error);
        return false;
    }
}

// Setup event listeners for syncing
function setupSyncEventListeners() {
    document.getElementById('sync-code').textContent = generateSyncCode();
    
    document.getElementById('import-btn').addEventListener('click', () => {
        const syncCode = document.getElementById('import-code').value.trim();
        if (!syncCode) {
            showToast('Please enter a sync code', 'warning');
            return;
        }
        
        const success = importSyncCode(syncCode);
        if (success) {
            showToast('Data imported successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('sync-modal'));
            modal.hide();
        } else {
            showToast('Invalid sync code', 'error');
        }
    });
    
    // Re-generate sync code when modal opens
    document.getElementById('sync-modal').addEventListener('show.bs.modal', () => {
        document.getElementById('sync-code').textContent = generateSyncCode();
    });
}

// Get expense form data
function getExpenseFormData() {
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const paidById = parseInt(document.getElementById('expense-payer').value);
    const date = document.getElementById('expense-date').value;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;
    const category = document.getElementById('expense-category').value;
    const notes = document.getElementById('expense-notes').value.trim();
    
    // Get checked members
    const checkedMembers = Array.from(document.querySelectorAll('input[name="split-member"]:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (checkedMembers.length === 0) {
        alert('Please select at least one member to split with');
        return null;
    }
    
    let splits = [];
    
    if (splitType === 'equal') {
        // Equal split
        const splitAmount = amount / checkedMembers.length;
        splits = checkedMembers.map(memberId => ({
            memberId,
            amount: splitAmount
        }));
    } else {
        // Custom split
        splits = checkedMembers.map(memberId => ({
            memberId,
            amount: parseFloat(document.getElementById(`custom-amount-${memberId}`).value)
        }));
        
        // Validate total equals expense amount
        const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplit - amount) > 0.01) {
            alert(`Split amounts must add up to the total expense (${amount})`);
            return null;
        }
    }
    
    return {
        description,
        amount,
        paidById,
        date,
        splits,
        category,
        notes
    };
}

// Helper function to calculate all member balances
function calculateBalances() {
    const balances = {};
    
    // Initialize balances for all members
    state.members.forEach(member => {
        balances[member.id] = 0;
    });
    
    // Add expenses
    state.expenses.forEach(expense => {
        // Add the paid amount to the payer's balance
        balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
        
        // Subtract each person's split from their balance
        expense.splits.forEach(split => {
            balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
        });
    });
    
    // Add settlements
    state.settlements.forEach(settlement => {
        // From person's balance decreases
        balances[settlement.fromMemberId] = (balances[settlement.fromMemberId] || 0) - settlement.amount;
        
        // To person's balance increases
        balances[settlement.toMemberId] = (balances[settlement.toMemberId] || 0) + settlement.amount;
    });
    
    return balances;
}

// Calculate individual balances between members (who owes whom)
function calculateIndividualBalances() {
    const individualBalances = {};
    
    // Helper function to get or create a balance entry
    function getBalanceKey(fromId, toId) {
        return fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
    }
    
    // Process expenses
    state.expenses.forEach(expense => {
        const payerId = expense.paidBy;
        
        expense.splits.forEach(split => {
            const memberId = split.memberId;
            
            if (payerId === memberId) return; // Skip self
            
            const key = getBalanceKey(payerId, memberId);
            
            if (!individualBalances[key]) {
                individualBalances[key] = {
                    fromId: payerId,
                    toId: memberId,
                    fromPaid: 0,
                    toPaid: 0
                };
            }
            
            if (payerId < memberId) {
                individualBalances[key].fromPaid += split.amount;
            } else {
                individualBalances[key].toPaid += split.amount;
            }
        });
    });
    
    // Process settlements
    state.settlements.forEach(settlement => {
        const fromId = settlement.fromMemberId;
        const toId = settlement.toMemberId;
        const amount = settlement.amount;
        
        const key = getBalanceKey(fromId, toId);
        
        if (!individualBalances[key]) {
            individualBalances[key] = {
                fromId: Math.min(fromId, toId),
                toId: Math.max(fromId, toId),
                fromPaid: 0,
                toPaid: 0
            };
        }
        
        if (fromId < toId) {
            individualBalances[key].toPaid += amount;
        } else {
            individualBalances[key].fromPaid += amount;
        }
    });
    
    // Calculate the net balances
    const netBalances = {};
    
    Object.values(individualBalances).forEach(balance => {
        const net = balance.fromPaid - balance.toPaid;
        
        if (Math.abs(net) < 0.01) return; // Ignore effectively zero balances
        
        if (net > 0) {
            // fromId is owed money
            netBalances[`${balance.toId}-${balance.fromId}`] = {
                from: balance.toId,
                to: balance.fromId,
                amount: net
            };
        } else {
            // toId is owed money
            netBalances[`${balance.fromId}-${balance.toId}`] = {
                from: balance.fromId,
                to: balance.toId,
                amount: Math.abs(net)
            };
        }
    });
    
    return netBalances;
}

// Simplify debts between members to reduce the number of transactions
function simplifyDebts(individualBalances) {
    // Extract members and their balances
    const balances = calculateBalances();
    
    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([memberId, balance]) => {
        memberId = parseInt(memberId);
        
        if (balance > 0) {
            creditors.push({ id: memberId, amount: balance });
        } else if (balance < 0) {
            debtors.push({ id: memberId, amount: Math.abs(balance) });
        }
    });
    
    // Sort by amount (descending)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    // Generate simplified payments
    const payments = [];
    
    while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        
        const amount = Math.min(debtor.amount, creditor.amount);
        
        if (amount > 0.01) { // Only add if the amount is significant
            payments.push({
                from: debtor.id,
                to: creditor.id,
                amount: amount
            });
        }
        
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        // Remove entries with zero balance
        if (debtor.amount < 0.01) debtors.shift();
        if (creditor.amount < 0.01) creditors.shift();
    }
    
    return payments;
}

// Format a date string
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 