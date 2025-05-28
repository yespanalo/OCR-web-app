
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";
const fileInput = document.getElementById("fileInput");
const imagePreview = document.getElementById("imagePreview");
const pdfCanvas = document.getElementById("pdfCanvas");
const output = document.getElementById("output");

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    imagePreview.classList.add("hidden");
    pdfCanvas.classList.add("hidden");
    output.classList.add("hidden");

    if (file.type === "application/pdf") {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const typedArray = new Uint8Array(this.result);

            pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
                pdf.getPage(1).then((page) => {
                    const scale = 1.5;
                    const viewport = page.getViewport({ scale });
                    const context = pdfCanvas.getContext("2d");

                    pdfCanvas.height = viewport.height;
                    pdfCanvas.width = viewport.width;

                    page
                        .render({
                            canvasContext: context,
                            viewport: viewport,
                        })
                        .promise.then(() => {
                            pdfCanvas.classList.remove("hidden");
                        });
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
    } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    }
    // else if (file.name.endsWith(".docx")) {
    //     const reader = new FileReader();
    //     reader.onload = function (event) {
    //         mammoth.extractRawText({ arrayBuffer: event.target.result })
    //             .then(function (result) {
    //                 output.textContent = result.value;
    //                 output.classList.remove("hidden");
    //             })
    //             .catch(function (err) {
    //                 output.textContent = "DOCX Error: " + err.message;
    //                 output.classList.remove("hidden");
    //             });
    //     };
    //     reader.readAsArrayBuffer(file);
    // }

});

function resetOCR() {
    fileInput.value = "";
    imagePreview.classList.add("hidden");
    pdfCanvas.classList.add("hidden");
    output.classList.add("hidden");
    output.textContent = "";
}
function extractMedicalSections(text) {
    function extractSection(header) {
        const regex = new RegExp(
            header + "\\s*:\\s*([\\s\\S]*?)(?=\\n(?:[A-Z][a-z /]+:|Page \\d+ of \\d+|--- Page \\d+ ---|$))",
            "i"
        );
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    }

    function extractFlexibleSection(headers) {
        for (const header of headers) {
            const regex = new RegExp(
                header + "\\s*:\\s*([\\s\\S]*?)(?=\\n(?:[A-Z][a-z /]+:|Page \\d+ of \\d+|--- Page \\d+ ---|$))",
                "i"
            );
            const match = text.match(regex);
            if (match) {
                return match[1].trim();
            }
        }
        return "";
    }

    const patient_name = extractPatientName(text);
    const visit_date = extractVisitDate(text);
    const past_medical_history = extractSection("Medical History");
    const medications = extractFlexibleSection(["Medications/Supplements", "Medication"]);
    const immunizations = extractFlexibleSection(["Immunization", "Vaccinations"]);
    const surgeries = extractSection("Surgeries");
    const family_history = extractSection("Family Medical History");
    const personal_history = extractPersonalHistory(text);
    const physical_exam = extractPhysicalExamination(text) || "";
    const normalDiagnostics = extractNormalDiagnostics(text);
    const diagnosticFindings = extractDiagnosticFindings(text);
    const otherFindings = extractOtherFindings(text);
    const assessment = extractSection("Assessment");
    const recommendations = extractSection("Recommendations");

    return {
        patient_name,
        visit_date,
        past_medical_history,
        medications,
        immunizations,
        surgeries,
        family_history,
        personal_history,
        physical_exam,
        normalDiagnostics,
        diagnosticFindings,
        otherFindings,
        assessment,
        recommendations,
        report_text: text
    };
}

function extractDiagnosticFindings(text) {
    const regex = /(?:Diagnostic Findings)\s*:\s*([\s\S]*?)(?=\b(Seen and Examined By)\s*:)/i;
    const match = text.match(regex);
    if (match) {
        return match[1]
            .replace(/Page \d+ of \d+/gi, "")
            .replace(/--- Page \d+ ---/gi, "")
            .replace(/WELLNESS AND AESTHETICS INSTITUTE|THE MEDICAL CITY|Patient Information/gi, "")
            .trim();
    }
    return "";
}

function extractOtherFindings(text) {
    const regex = /(?:Other Findings)\s*:\s*([\s\S]*?)(?=\b(Seen and Examined By)\s*:)/i;
    const match = text.match(regex);
    if (match) {
        return match[1]
            .replace(/Page \d+ of \d+/gi, "")
            .replace(/--- Page \d+ ---/gi, "")
            .replace(/WELLNESS AND AESTHETICS INSTITUTE|THE MEDICAL CITY|Patient Information/gi, "")
            .trim();
    }
    return "";
}

function extractNormalDiagnostics(text) {
    const regex = /(?:Normal Diagnostic Results|Normal Results |Results)\s*:\s*([\s\S]*?)(?=\b(Diagnostic Findings|Other Findings)\s*:)/i;
    const match = text.match(regex);
    if (match) {
        return match[1]
            .replace(/Page \d+ of \d+/gi, "")
            .replace(/--- Page \d+ ---/gi, "")
            .replace(/WELLNESS AND AESTHETICS INSTITUTE|THE MEDICAL CITY|Patient Information/gi, "")
            .trim();
    }
    return "";
}




function extractSimpleField(text, fieldName) {
    const regex = new RegExp(fieldName + ":\\s*(.*)", "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}


function extractPatientName(text) {
    const line = extractSimpleField(text, "Name");
    if (!line) return "";
    const [nameOnly] = line.split(/Age\/Gender/i);
    return nameOnly.trim();
}

function extractVisitDate(text) {
    const line = extractSimpleField(text, "Check-up Date");
    if (!line) return "";
    const cleaned = line.split(/Room No\./i)[0];
    return cleaned.trim();
}

function extractPhysicalExamination(text) {
    const regex = /Physical Examination:\s*([\s\S]*?SKIN:.*)/i;
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}

function extractPersonalHistory(text) {
    const regex = /Personal\/Social History:\s*([\s\S]*?Sleep:.*)/i;
    const match = text.match(regex);
    return match ? match[1].trim() : "";
}



function performOCR() {
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first.");
        return;
    }

    output.textContent = "Processing...";
    output.classList.remove("hidden");

    if (file.type === "application/pdf") {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
                const numPages = pdf.numPages;
                let currentPage = 1;
                let fullText = "";

                const processPage = () => {
                    if (currentPage > numPages) {
                        output.textContent = fullText.trim();

                        const sections = extractMedicalSections(fullText);

                        fetch("http://localhost/OCR - Copy/upload.php", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(sections),
                        })
                            .then(res => res.json())
                            .then(data => console.log("Upload status:", data))
                            .catch(err => console.error("Upload error:", err));
                        console.log("Full OCR text:\n", fullText);


                        console.log("Sending to backend:", JSON.stringify(sections, null, 2));

                        return;
                    }

                    pdf.getPage(currentPage).then((page) => {
                        const scale = 2;
                        const viewport = page.getViewport({ scale });
                        const canvas = document.createElement("canvas");
                        const context = canvas.getContext("2d");

                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        page.render({ canvasContext: context, viewport }).promise.then(() => {
                            canvas.toBlob((blob) => {
                                Tesseract.recognize(blob, "eng", {
                                    logger: (m) => console.log(`Page ${currentPage}:`, m),
                                })
                                    .then(({ data: { text } }) => {
                                        fullText += `\n--- Page ${currentPage} ---\n${text}\n`;
                                        currentPage++;
                                        processPage(); // Recursively process next page
                                    })
                                    .catch((err) => {
                                        fullText += `\n[Error reading page ${currentPage}: ${err.message}]\n`;
                                        currentPage++;
                                        processPage(); // Continue with next page even if one fails
                                    });
                            });
                        });
                    });
                };

                processPage(); // Start processing pages
            });
        };

        fileReader.readAsArrayBuffer(file);
    }
    else if (file.name.endsWith(".docx")) {
        const reader = new FileReader();
        reader.onload = function (event) {
            mammoth.extractRawText({ arrayBuffer: event.target.result })
                .then(function (result) {
                    output.textContent = result.value;
                })
                .catch(function (err) {
                    output.textContent = "DOCX Error: " + err.message;
                });
        };
        reader.readAsArrayBuffer(file);
    }
    else {
        Tesseract.recognize(file, "eng", { logger: (m) => console.log(m) })
            .then(({ data: { text } }) => {
                output.textContent = text;
            })
            .catch((err) => {
                output.textContent = "OCR Error: " + err.message;
            });
    }



}