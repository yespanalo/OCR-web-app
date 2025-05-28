fetch("http://localhost/OCR - Copy/reports/get-all-reports.php")
    .then((res) => res.json())
    .then((res) => {
        document.getElementById("loading").style.display = "none";
        if (res.status === "success") {
            const data = res.data;
            const list = document.getElementById("report-list");
            document
                .getElementById("table-container")
                .classList.remove("hidden");
            data.forEach((item) => {
                const row = document.createElement("tr");
                row.innerHTML = `
              <td class="py-2 px-4 border-b">${item.patient_name || "—"}</td>
              <td class="py-2 px-4 border-b">${item.visit_date || "—"}</td>
              <td class="py-2 px-4 border-b">${item.createdAt || "—"}</td>
              <td class="py-2 px-4 border-b">
                <a href="reports.html?id=${item.id
                    }" class="text-blue-600 hover:underline">View</a>
              </td>
            `;
                list.appendChild(row);
            });
        } else {
            document.getElementById("loading").innerText = "No records found.";
        }
    })
    .catch(() => {
        document.getElementById("loading").innerText =
            "Failed to load records.";
    });