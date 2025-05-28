const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    document.getElementById("loading").innerText =
        "❌ No report ID provided.";
} else {
    fetch(`http://localhost/OCR - Copy/reports/get-report.php?id=${id}`)
        .then((res) => res.json())
        .then((res) => {
            document.getElementById("loading").style.display = "none";
            if (res.status === "success") {
                const data = res.data;
                const container = document.getElementById("report");
                container.classList.remove("hidden");

                Object.entries(data).forEach(([key, value]) => {
                    if (key === "id") return; // Skip displaying the 'id' field

                    const field = document.createElement("div");
                    field.classList.add(
                        "grid",
                        "grid-cols-1",
                        "md:grid-cols-4",
                        "gap-2"
                    );
                    field.innerHTML = `
                  <div class="font-medium text-gray-600 md:col-span-1 capitalize">${key.replace(
                        /_/g,
                        " "
                    )}:</div>
                  <div class="text-gray-900 md:col-span-3">${value || "—"}</div>
                `;
                    container.appendChild(field);
                });
            } else {
                document.getElementById("loading").innerText =
                    "❌ Report not found.";
            }
        })
        .catch(() => {
            document.getElementById("loading").innerText =
                "⚠️ Failed to load data.";
        });
}