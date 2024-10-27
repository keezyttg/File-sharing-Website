const toggleCheckbox = document.getElementById("toggle");
const uploadSection = document.getElementById("uploadSection");
const downloadSection = document.getElementById("downloadSection");
const generate = document.getElementById("generate");
const uploadText = document.getElementById("uploadText");
const uploadResult = document.getElementById("uploadResult");
const codeDisplay = document.querySelector(".code"); // Add this for the code display

// Toggle between Upload and Download sections
toggleCheckbox.addEventListener("change", () => {
  if (toggleCheckbox.checked) {
    // Switch to Download mode
    uploadSection.style.display = "none";
    downloadSection.style.display = "block";
    console.log("Download selected");
  } else {
    // Switch to Upload mode
    uploadSection.style.display = "block";
    downloadSection.style.display = "none";
    console.log("Upload selected");
  }
});

// Handle Generate Code button click
generate.addEventListener("click", () => {
  if (uploadText.value.trim() === "") {
    window.alert("Text Box must not be empty!");
    return;
  }

  // Generate random code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Store the input and code
  const user_input = uploadText.value;
  localStorage.setItem(code, user_input); // Temporarily store in localStorage

  // Display the code
  codeDisplay.textContent = code;

  // Show result and hide input
  uploadResult.style.display = "block";
  uploadText.style.display = "none";

  // Optional: Add a way to generate new code
  generate.textContent = "Generate New Code";
});

// Add a button to go back to input (optional)
const backToInput = document.createElement("button");
backToInput.textContent = "Share Another Text";
backToInput.onclick = () => {
  uploadResult.style.display = "none";
  uploadText.style.display = "block";
  uploadText.value = ""; // Clear previous input
  generate.textContent = "Generate Access Code";
};
uploadResult.appendChild(backToInput);

const retrieveButton = document.getElementById("retrieveData");
const accessCodeInput = document.getElementById("accessCode");
const retrievedTextDiv = document.querySelector(".retrieved-text");

retrieveButton.addEventListener("click", () => {
  console.log("Retrieve button clicked");
  const code = accessCodeInput.value.trim().toUpperCase();

  if (!code) {
    window.alert("Please enter an access code!");
    return;
  }

  // Get stored text from localStorage
  const retrievedText = localStorage.getItem(code);

  if (retrievedText) {
    retrievedTextDiv.textContent = retrievedText;
    retrievedTextDiv.style.display = "block";

    // Create and add copy button after text is retrieved
    const copyRetrievedButton = document.createElement("button");
    copyRetrievedButton.textContent = "Copy Text";
    copyRetrievedButton.className = "copy-button";

    // Remove any existing copy button
    const existingCopyButton = document.querySelector(
      "#downloadResult .copy-button"
    );
    if (existingCopyButton) {
      existingCopyButton.remove();
    }

    // Add click handler for copy button
    copyRetrievedButton.onclick = () => {
      navigator.clipboard
        .writeText(retrievedTextDiv.textContent)
        .then(() => {
          copyRetrievedButton.textContent = "Copied!";
          setTimeout(() => {
            copyRetrievedButton.textContent = "Copy Text";
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          alert("Failed to copy text");
        });
    };

    // Add button after the retrieved text
    retrievedTextDiv.parentNode.appendChild(copyRetrievedButton);
  } else {
    window.alert("Invalid code or expired data");
  }
});
