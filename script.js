
// ==========================================
// 1. HTML ELEMENTS
// ==========================================

const inputText = document.getElementById("inputText");
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const outputText = document.getElementById("outputText");

const characterCount = document.getElementById("characterCount");
const outputCount = document.getElementById("outputCount");
const statusMessage = document.getElementById("statusMessage");

const translateButton = document.getElementById("translateButton");
const copyButton = document.getElementById("copyButton");
const swapButton = document.getElementById("swapButton");
const clearButton = document.getElementById("clearButton");
const speakButton = document.getElementById("speakButton");


// ==========================================
// 2. SUPPORTED LANGUAGES
// ==========================================

const languages = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "ja": "Japanese",
    "ru": "Russian",
    "pt": "Portuguese",
    "ar": "Arabic",
    "zh-CN": "Chinese",
    "ko": "Korean",
    "bn": "Bengali",
    "ur": "Urdu",
    "nl": "Dutch",
    "tr": "Turkish",
    "pl": "Polish",
    "uk": "Ukrainian",
    "id": "Indonesian",
    "vi": "Vietnamese",
    "th": "Thai",
    "el": "Greek",
    "sv": "Swedish",
    "ro": "Romanian"
};


// ==========================================
// 3. LOAD LANGUAGES
// ==========================================

function loadLanguages() {

    sourceLanguage.innerHTML = "";
    targetLanguage.innerHTML = "";

    for (const [code, name] of Object.entries(languages)) {

        sourceLanguage.add(
            new Option(name, code)
        );

        targetLanguage.add(
            new Option(name, code)
        );
    }

    sourceLanguage.value = "en";
    targetLanguage.value = "te";
}

loadLanguages();


// ==========================================
// 4. CHARACTER COUNTER
// ==========================================

inputText.addEventListener("input", () => {

    characterCount.textContent =
        `${inputText.value.length} / 5000 characters`;

});

function updateOutputCount() {

    outputCount.textContent =
        `${outputText.value.length} characters`;

}


// ==========================================
// 5. STATUS MESSAGE
// ==========================================

function showStatus(message, isError = false) {

    statusMessage.textContent = message;

    statusMessage.style.color =
        isError ? "#dc2626" : "#64748b";

}


// ==========================================
// 6. SPLIT LONG TEXT BY UTF-8 BYTES
// ==========================================

function splitText(text, maxBytes = 400) {

    const chunks = [];

    let current = "";

    const encoder = new TextEncoder();

    for (const character of text) {

        const candidate = current + character;

        if (
            encoder.encode(candidate).length > maxBytes &&
            current.length > 0
        ) {

            chunks.push(current);

            current = character;

        } else {

            current = candidate;

        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;

}


// ==========================================
// 7. TRANSLATION API
// ==========================================

async function translateText(text, source, target) {

    const chunks = splitText(text);

    const translations = [];

    for (let i = 0; i < chunks.length; i++) {

        const url = new URL(
            "https://api.mymemory.translated.net/get"
        );

        url.searchParams.set("q", chunks[i]);

        url.searchParams.set(
            "langpair",
            `${source}|${target}`
        );

        const response = await fetch(url.toString());

        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }

        const data = await response.json();

        if (data.quotaFinished) {

            throw new Error(
                "Daily translation limit reached. Try again later."
            );

        }

        if (
            data.responseStatus !== 200 ||
            !data.responseData ||
            !data.responseData.translatedText
        ) {

            throw new Error(
                data.responseDetails ||
                "Translation is unavailable for this language pair."
            );

        }

        translations.push(
            data.responseData.translatedText
        );

        showStatus(
            `Translating ${i + 1} of ${chunks.length}...`
        );

    }

    return translations.join(" ");

}


// ==========================================
// 8. TRANSLATE BUTTON
// ==========================================

translateButton.addEventListener("click", async () => {

    const text = inputText.value.trim();

    if (!text) {

        showStatus(
            "Please enter text to translate.",
            true
        );

        inputText.focus();

        return;
    }

    const source = sourceLanguage.value;

    const target = targetLanguage.value;

    if (source === target) {

        outputText.value = text;

        updateOutputCount();

        showStatus("Both languages are the same.");

        return;
    }

    translateButton.disabled = true;

    translateButton.textContent = "Translating...";

    outputText.value = "";

    updateOutputCount();

    showStatus("Connecting to translation service...");

    try {

        const translation = await translateText(
            text,
            source,
            target
        );

        outputText.value = translation;

        updateOutputCount();

        showStatus(
            "Translation completed successfully!"
        );

    } catch (error) {

        console.error("Translation error:", error);

        outputText.value = "";

        updateOutputCount();

        showStatus(
            error.message ||
            "Translation failed. Please try again.",
            true
        );

    } finally {

        translateButton.disabled = false;

        translateButton.textContent = "Translate";

    }

});


// ==========================================
// 9. COPY TRANSLATION
// ==========================================

copyButton.addEventListener("click", async () => {

    const text = outputText.value.trim();

    if (!text) {

        showStatus(
            "There is no translation to copy.",
            true
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(text);

        showStatus("Translation copied successfully!");

    } catch (error) {

        console.error(error);

        showStatus(
            "Unable to copy. Check browser permissions.",
            true
        );

    }

});


// ==========================================
// 10. SWAP LANGUAGES
// ==========================================

swapButton.addEventListener("click", () => {

    const oldSource = sourceLanguage.value;

    sourceLanguage.value = targetLanguage.value;

    targetLanguage.value = oldSource;

    const oldInput = inputText.value;

    inputText.value = outputText.value;

    outputText.value = oldInput;

    characterCount.textContent =
        `${inputText.value.length} / 5000 characters`;

    updateOutputCount();

    showStatus("Languages swapped successfully.");

});


// ==========================================
// 11. CLEAR TEXT
// ==========================================

clearButton.addEventListener("click", () => {

    inputText.value = "";

    outputText.value = "";

    characterCount.textContent =
        "0 / 5000 characters";

    updateOutputCount();

    window.speechSynthesis.cancel();

    showStatus("Text cleared.");

    inputText.focus();

});


// ==========================================
// 12. TEXT TO SPEECH
// ==========================================

speakButton.addEventListener("click", () => {

    const text = outputText.value.trim();

    if (!text) {

        showStatus(
            "There is no translation to listen to.",
            true
        );

        return;
    }

    if (!("speechSynthesis" in window)) {

        showStatus(
            "Speech is not supported by this browser.",
            true
        );

        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = targetLanguage.value;

    speech.rate = 0.9;

    speech.onend = () => {
        showStatus("Finished playing translation.");
    };

    speech.onerror = () => {
        showStatus(
            "Unable to play translated text.",
            true
        );
    };

    window.speechSynthesis.speak(speech);

    showStatus("Playing translated text...");

});


// ==========================================
// 13. STOP SPEECH WHEN PAGE CLOSES
// ==========================================

window.addEventListener("beforeunload", () => {

    window.speechSynthesis.cancel();

});
