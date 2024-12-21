// Initialize invoice details
document.addEventListener("DOMContentLoaded", () => {
    const invoiceDate = new Date().toLocaleDateString();
    document.getElementById("invoiceDate").textContent = invoiceDate;

    // Attach event listeners for buttons
    document.getElementById("addServiceButton").addEventListener("click", addServiceRow);
    document.getElementById("addProductButton").addEventListener("click", addProductRow);

    updateSummary();
});

// Generate and display invoice number on load
document.addEventListener("DOMContentLoaded", () => {
    const invoiceNumberSpan = document.getElementById("invoiceNumber");
    invoiceNumberSpan.textContent = generateInvoiceNumber();

    function generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const date = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${year}${month}${date}${hours}${minutes}${seconds}`;
    }
});

// Add a new service row
function addServiceRow() {
    const table = document.getElementById("servicesTable");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td></td>
        <td><input type="text" name="service_name[]" placeholder="Service Name"></td>
        <td><input type="text" name="service_desc[]" placeholder="Description"></td>
        <td><input type="number" name="service_qty[]" value="1" min="1" oninput="updateSummary()"></td>
        <td><input type="number" name="service_price[]" value="0" min="0" oninput="updateSummary()"></td>
        <td class="total">0.00</td>
    `;
    table.appendChild(row);
    updateRowNumbers("servicesTable");
    updateSummary();
}

// Get service names
function getServiceNames() {
    const inputs = document.querySelectorAll('input[name="service_name[]"]');
    const serviceNames = Array.from(inputs).map(input => input.value);
    return serviceNames;
}

// Add a new product row
function addProductRow() {
    const table = document.getElementById("productsTable");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td></td>
        <td><input type="text" name="product_name[]" placeholder="Product Name"></td>
        <td><input type="text" name="product_desc[]" placeholder="Description"></td>
        <td><input type="number" name="product_qty[]" value="1" min="1" oninput="updateSummary()"></td>
        <td><input type="number" name="product_price[]" value="0" min="0" oninput="updateSummary()"></td>
        <td class="total">0.00</td>
    `;
    table.appendChild(row);
    updateRowNumbers("productsTable");
    updateSummary();
}

// Get product names
function getProductNames() {
    const inputs = document.querySelectorAll('input[name="product_name[]"]');
    const productNames = Array.from(inputs).map(input => input.value);
    return productNames;
}

// Update row numbers dynamically
function updateRowNumbers(tableId) {
    const table = document.getElementById(tableId);
    Array.from(table.rows).forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

// Update summary dynamically
function updateSummary() {
    const subtotalServices = calculateSubtotal("servicesTable");
    const subtotalProducts = calculateSubtotal("productsTable");
    const discount = parseFloat(document.getElementById("discount").value) || 0;
    const grandTotal = subtotalServices + subtotalProducts - discount;
    document.getElementById("subtotalServices").textContent = subtotalServices.toFixed(2);
    document.getElementById("subtotalProducts").textContent = subtotalProducts.toFixed(2);
    document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

// Calculate subtotal for a table
function calculateSubtotal(tableId) {
    const table = document.getElementById(tableId);
    let subtotal = 0;
    Array.from(table.rows).forEach(row => {
        const quantity = parseFloat(row.cells[3]?.querySelector("input")?.value) || 0;
        const price = parseFloat(row.cells[4]?.querySelector("input")?.value) || 0;
        const total = quantity * price;
        row.cells[5].textContent = total.toFixed(2);
        subtotal += total;
    });
    return subtotal;
}

// Send invoice using EmailJS
document.getElementById("appointmentForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get customer details and invoice data
    const customerName = document.getElementById("customerName").value;
    const subtotalServices = document.getElementById("subtotalServices").textContent;
    const subtotalProducts = document.getElementById("subtotalProducts").textContent;
    const discount = document.getElementById("discount").value;
    const grandTotal = document.getElementById("grandTotal").textContent;
    const customerEmail = document.getElementById("customerContact").value;

    const serviceID = "service_eom4hgg"; // Replace with your EmailJS Service ID
    const templateID = "template_12adaki"; // Replace with your EmailJS Template ID

    const templateParams = {
        customer_name: customerName,
        customer_email: customerEmail,
        services: getServiceNames().join(", "),
        products: getProductNames().join(", "),
        subtotal_services: subtotalServices,
        subtotal_products: subtotalProducts,
        discount: discount,
        grand_total: grandTotal
    };

    emailjs.send(serviceID, templateID, templateParams)
        .then(response => {
            alert("Invoice sent successfully!");
            console.log("SUCCESS!", response.status, response.text);
            this.reset();
        })
        .catch(error => {
            alert("Failed to send the invoice. Please try again.");
            console.error("FAILED...", error);
        });
});


document.getElementById("downloadPDF").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;

    // Initialize jsPDF instance
    const doc = new jsPDF();

    // Add invoice title with bold font and center alignment
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Md. Habib's Billing Invoice", 105, 15, { align: "center" });

    // Add a horizontal line below the title
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, 20, 200, 20);

    // Add customer details with normal font
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const invoiceDate = document.getElementById("invoiceDate").textContent;
    const invoiceNumber = document.getElementById("invoiceNumber").textContent;
    const customerName = document.getElementById("customerName").value;
    const customerEmail = document.getElementById("customerContact").value;

    doc.text(`Date: ${invoiceDate}`, 10, 30);
    doc.text(`Invoice Number: ${invoiceNumber}`, 10, 40);
    doc.text(`Customer Name: ${customerName}`, 10, 50);
    doc.text(`Customer Email: ${customerEmail}`, 10, 60);

    // Add a section for services with bold heading
    doc.setFont("helvetica", "bold");
    doc.text("Services Provided:", 10, 70);

    // Fetch services and products
    const services = getServiceNames();
    doc.setFont("helvetica", "normal");
    if (services.length > 0) {
        services.forEach((service, index) => {
            doc.text(`${index + 1}. ${service}`, 10, 80 + index * 10);
        });
    } else {
        doc.text("No services provided.", 10, 80);
    }

    // Add a section for products with bold heading
    const productsStartY = 80 + services.length * 10 + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Products Sold:", 10, productsStartY);

    const products = getProductNames();
    doc.setFont("helvetica", "normal");
    if (products.length > 0) {
        products.forEach((product, index) => {
            doc.text(`${index + 1}. ${product}`, 10, productsStartY + 10 + index * 10);
        });
    } else {
        doc.text("No products sold.", 10, productsStartY + 10);
    }

    // Add a summary section with bold headings and subtotal lines
    const summaryStartY = productsStartY + 20 + products.length * 10;
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 10, summaryStartY);

    doc.setFont("helvetica", "normal");
    const subtotalServices = document.getElementById("subtotalServices").textContent;
    const subtotalProducts = document.getElementById("subtotalProducts").textContent;
    const discount = document.getElementById("discount").value || 0;
    const grandTotal = document.getElementById("grandTotal").textContent;

    doc.text(`Subtotal for Services: INR ${subtotalServices}`, 10, summaryStartY + 10);
    doc.text(`Subtotal for Products: INR ${subtotalProducts}`, 10, summaryStartY + 20);
    doc.text(`Discount: INR ${discount}`, 10, summaryStartY + 30);

    // Highlight Grand Total with larger font and bold text
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: INR ${grandTotal}`, 10, summaryStartY + 50);

    // Add footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    // Download the PDF
    doc.save("Invoice.pdf");
});
