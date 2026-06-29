const MAX_PDF_PAGES = 1;
const PDF_RENDER_SCALE = 1;
const MAX_IMAGE_DIMENSION = 700;
const MIN_EMBEDDED_PDF_TEXT_LENGTH = 80;
const OCR_WORKER_IDLE_MS = 120000;
let ocrModulesPromise = null;
const normalizeText = (value) => value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
const loadOcrModules = async () => {
    ocrModulesPromise ?? (ocrModulesPromise = Promise.all([
        import("tesseract.js"),
        import("pdfjs-dist/build/pdf.mjs"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]));
    const [{ createWorker }, pdfjsLib, pdfWorkerModule] = await ocrModulesPromise;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        pdfWorkerModule.default;
    return { createWorker, pdfjsLib };
};
const createOcrWorker = async (onProgress) => {
    const { createWorker } = await loadOcrModules();
    const worker = await createWorker("eng", 1, {
        logger: (message) => {
            if (!onProgress)
                return;
            if (message.status === "recognizing text" && typeof message.progress === "number") {
                onProgress(`OCR ${Math.round(message.progress * 100)}%`);
            }
            else {
                onProgress(message.status);
            }
        },
    });
    await worker.setParameters({
        tessedit_pageseg_mode: "6",
        preserve_interword_spaces: "1",
    });
    return worker;
};
let sharedOcrWorkerPromise = null;
let sharedOcrWorkerIdleTimer = null;
const clearSharedWorkerIdleTimer = () => {
    if (sharedOcrWorkerIdleTimer) {
        window.clearTimeout(sharedOcrWorkerIdleTimer);
        sharedOcrWorkerIdleTimer = null;
    }
};
const scheduleSharedWorkerCleanup = () => {
    clearSharedWorkerIdleTimer();
    sharedOcrWorkerIdleTimer = window.setTimeout(async () => {
        if (!sharedOcrWorkerPromise)
            return;
        const workerPromise = sharedOcrWorkerPromise;
        sharedOcrWorkerPromise = null;
        sharedOcrWorkerIdleTimer = null;
        try {
            const worker = await workerPromise;
            await worker.terminate();
        }
        catch {
            // Ignore cleanup failures and allow the next OCR request to recreate the worker.
        }
    }, OCR_WORKER_IDLE_MS);
};
const getSharedOcrWorker = async (onProgress) => {
    clearSharedWorkerIdleTimer();
    sharedOcrWorkerPromise ?? (sharedOcrWorkerPromise = createOcrWorker(onProgress));
    const worker = await sharedOcrWorkerPromise;
    scheduleSharedWorkerCleanup();
    return worker;
};
const resizeImageIfNeeded = async (file) => {
    const bitmap = await createImageBitmap(file);
    try {
        const longestEdge = Math.max(bitmap.width, bitmap.height);
        if (longestEdge <= MAX_IMAGE_DIMENSION) {
            return file;
        }
        const scale = MAX_IMAGE_DIMENSION / longestEdge;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
            return file;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Could not optimize image for OCR."));
                    return;
                }
                resolve(blob);
            }, "image/jpeg", 0.65);
        });
    }
    finally {
        bitmap.close();
    }
};
const recognizeImage = async (worker, source) => {
    const result = await worker.recognize(source);
    return normalizeText(result.data.text || "");
};
const renderPdfPageToCanvas = async (pdf, pageNumber) => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas context is not available for PDF OCR.");
    }
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
        canvasContext: context,
        viewport,
    }).promise;
    return canvas.toDataURL("image/jpeg", 0.7);
};
const extractEmbeddedPdfText = async (pdf) => {
    const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const extractedPages = [];
    for (let index = 1; index <= pages; index += 1) {
        const page = await pdf.getPage(index);
        const textContent = await page.getTextContent();
        const pageText = normalizeText(textContent.items
            .map((item) => item.str || "")
            .join(" "));
        if (pageText.length >= MIN_EMBEDDED_PDF_TEXT_LENGTH) {
            extractedPages.push(pageText);
        }
    }
    return normalizeText(extractedPages.join("\n\n"));
};
export const extractBloodReportText = async (file, onProgress) => {
    if (file.type.startsWith("image/")) {
        const worker = await getSharedOcrWorker(onProgress);
        const optimizedImage = await resizeImageIfNeeded(file);
        return recognizeImage(worker, optimizedImage);
    }
    if (file.type === "application/pdf") {
        const { pdfjsLib } = await loadOcrModules();
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const embeddedText = await extractEmbeddedPdfText(pdf);
        if (embeddedText) {
            return embeddedText;
        }
        const worker = await createOcrWorker(onProgress);
        try {
            const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
            const extractedPages = [];
            for (let index = 1; index <= pages; index += 1) {
                const imageDataUrl = await renderPdfPageToCanvas(pdf, index);
                const pageText = await recognizeImage(worker, imageDataUrl);
                if (pageText) {
                    extractedPages.push(pageText);
                }
            }
            return normalizeText(extractedPages.join("\n\n"));
        }
        finally {
            await worker.terminate();
        }
    }
    return "";
};
export const warmUpBloodReportOcr = async () => {
    await loadOcrModules();
    await getSharedOcrWorker();
};
