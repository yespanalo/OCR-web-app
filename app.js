
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