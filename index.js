const toggleCheckbox = document.getElementById("toggle");
const uploadSection = document.getElementById("uploadSection");
const downloadSection = document.getElementById("downloadSection");

toggleCheckbox.addEventListener("change", () => {
    if (toggleCheckbox.checked) {
        // Switch to Download mode
        uploadSection.style.display = 'none';
        downloadSection.style.display = 'block';
        console.log("Download selected");
    } else {
        // Switch to Upload mode
        uploadSection.style.display = 'block';
        downloadSection.style.display = 'none';
        console.log("Upload selected");
    }
});

