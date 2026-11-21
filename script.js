
// RESET OLD WEBSITE RECORDS ONCE
if (!localStorage.getItem("marsBankResetV2")) {
    localStorage.removeItem("borrowers");
    localStorage.removeItem("loans");
    localStorage.removeItem("payments");

    localStorage.setItem("marsBankResetV2", "true");
}

// LOAD DATA
let loans = JSON.parse(localStorage.getItem("loans")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];

// SAVE DATA
function saveData() {
    localStorage.setItem("loans", JSON.stringify(loans));
    localStorage.setItem("payments", JSON.stringify(payments));
}

// FORMAT MONEY
function formatMoney(amount) {
    return "₱" + Number(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// SAFE HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// NAVIGATION
function showPage(page, button) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(page).classList.remove("hidden");

    document.querySelectorAll("nav button").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    displayLoans();
    displayPayments();
    updateDashboard();
}

// CREATE LOAN APPLICATION
document.getElementById("loanForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const borrower = document.getElementById("borrowerName").value.trim();
    const amount = Number(document.getElementById("loanAmount").value);
    const rate = Number(document.getElementById("interestRate").value);
    const duration = Number(document.getElementById("loanDuration").value);

    if (!borrower || amount <= 0 || rate < 0 || duration <= 0) {
        alert("Please enter valid loan information.");
        return;
    }

    const interest = amount * (rate / 100) * duration;
    const total = amount + interest;

    loans.push({
        id: Date.now(),
        borrower: borrower,
        amount: amount,
        interest: interest,
        total: total,
        duration: duration,
        paid: 0,
        status: "Pending"
    });

    saveData();
    this.reset();

    displayLoans();
    updateDashboard();

    alert("Loan application submitted successfully!");
});

// DISPLAY LOANS
function displayLoans() {
    const list = document.getElementById("loanList");

    list.innerHTML = "";

    if (loans.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No loan applications found.
                </td>
            </tr>
        `;
    }

    loans.forEach(loan => {
        list.innerHTML += `
            <tr>
                <td>${escapeHTML(loan.borrower)}</td>
                <td>${formatMoney(loan.amount)}</td>
                <td>${formatMoney(loan.interest)}</td>
                <td>${formatMoney(loan.total)}</td>
                <td>${loan.duration} Months</td>
                <td class="status ${loan.status}">
                    ${loan.status}
                </td>
                <td>
                    ${loan.status === "Pending" ? `
                        <button class="action-btn approve"
                            onclick="changeStatus(${loan.id}, 'Approved')">
                            Approve
                        </button>

                        <button class="action-btn reject"
                            onclick="changeStatus(${loan.id}, 'Rejected')">
                            Reject
                        </button>
                    ` : `
                        <button class="action-btn delete"
                            onclick="deleteLoan(${loan.id})">
                            Delete
                        </button>
                    `}
                </td>
            </tr>
        `;
    });

    updatePaymentOptions();
}

// APPROVE OR REJECT LOAN
function changeStatus(id, status) {
    const loan = loans.find(l => l.id === id);

    if (!loan) return;

    loan.status = status;

    saveData();
    displayLoans();
    updateDashboard();

    alert("Loan successfully " + status.toLowerCase() + "!");
}

// DELETE LOAN
function deleteLoan(id) {
    const loan = loans.find(l => l.id === id);

    if (!loan) return;

    if (loan.paid > 0) {
        alert("Cannot delete a loan with recorded payments.");
        return;
    }

    if (confirm("Are you sure you want to delete this loan?")) {
        loans = loans.filter(l => l.id !== id);

        saveData();
        displayLoans();
        updateDashboard();
    }
}

// UPDATE APPROVED LOAN OPTIONS
function updatePaymentOptions() {
    const select = document.getElementById("paymentLoan");

    select.innerHTML = `
        <option value="">Select Approved Loan</option>
    `;

    loans
        .filter(l => l.status === "Approved" && l.paid < l.total)
        .forEach(loan => {
            select.innerHTML += `
                <option value="${loan.id}">
                    ${escapeHTML(loan.borrower)}
                    - ${formatMoney(loan.total - loan.paid)} remaining
                </option>
            `;
        });
}

// RECORD PAYMENT
document.getElementById("paymentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const loanId = Number(document.getElementById("paymentLoan").value);
    const amount = Number(document.getElementById("paymentAmount").value);

    const loan = loans.find(l => l.id === loanId);

    if (!loan || amount <= 0 || amount > loan.total - loan.paid) {
        alert("Invalid payment amount.");
        return;
    }

    loan.paid += amount;

    payments.push({
        borrower: loan.borrower,
        amount: amount,
        date: new Date().toLocaleDateString("en-PH")
    });

    saveData();

    this.reset();

    displayLoans();
    displayPayments();
    updateDashboard();

    alert("Payment recorded successfully!");
});

// DISPLAY PAYMENTS
function displayPayments() {
    const list = document.getElementById("paymentList");

    list.innerHTML = "";

    if (payments.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="3" class="empty">
                    No payments recorded.
                </td>
            </tr>
        `;
        return;
    }

    payments.forEach(payment => {
        list.innerHTML += `
            <tr>
                <td>${escapeHTML(payment.borrower)}</td>
                <td>${formatMoney(payment.amount)}</td>
                <td>${escapeHTML(payment.date)}</td>
            </tr>
        `;
    });
}

// UPDATE DASHBOARD
function updateDashboard() {
    const approved = loans.filter(l => l.status === "Approved");
    const pending = loans.filter(l => l.status === "Pending");
    const rejected = loans.filter(l => l.status === "Rejected");

    const totalLoans = approved.reduce((sum, l) => sum + l.amount, 0);

    const totalPayments = payments.reduce(
        (sum, p) => sum + p.amount, 0
    );

    const outstanding = approved.reduce(
        (sum, l) => sum + (l.total - l.paid), 0
    );

    document.getElementById("totalLoans").textContent =
        formatMoney(totalLoans);

    document.getElementById("approvedLoans").textContent =
        approved.length;

    document.getElementById("pendingLoans").textContent =
        pending.length;

    document.getElementById("rejectedLoans").textContent =
        rejected.length;

    document.getElementById("totalPayments").textContent =
        formatMoney(totalPayments);

    document.getElementById("outstandingBalance").textContent =
        formatMoney(outstanding);
}

// INITIALIZE WEBSITE
displayLoans();
displayPayments();
updateDashboard();
