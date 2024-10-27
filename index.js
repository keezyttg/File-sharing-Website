const toggleCheckbox = document.getElementById("toggle");
const uploadSection = document.getElementById("uploadSection");
const downloadSection = document.getElementById("downloadSection");
const generate = document.getElementById("generate");
const uploadText = document.getElementById("uploadText");
const uploadResult = document.getElementById("uploadResult");
const codeDisplay = document.querySelector(".code"); // Add this for the code display
// Drag and Drop Variables
const dropZone = document.getElementById('drop_zone');
const fileInput = document.getElementById('fileInput');
const inputgroup = document.getElementById('inputgroup');


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
  if (uploadText.value.trim() === "" &&  fileInput.value === "") {
    window.alert("You must input text or a file!");
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
  inputgroup.style.display = "none";
  
  generate.textContent = "Generate New Code";

  const data = {
    text: user_input,
    expires: Date.now() + 24 * 60 * 60,
  };
  localStorage.setItem(code, JSON.stringify(data));
});

// Add a button to go back to input (optional)
const backToInput = document.createElement("button");
backToInput.textContent = "Share Another Text";
backToInput.onclick = () => {
  uploadResult.style.display = "none";
  inputgroup.style.display = "block";
  uploadText.style.display = "block";
  uploadText.value = ""; // Clear previous input
  generate.textContent = "Generate Access Code";
};
uploadResult.appendChild(backToInput);

// clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.className = "clear-button";
clearButton.onclick = () => {
  uploadText.value = "";
  fileInput.value = "";
};
uploadText.parentNode.appendChild(clearButton);

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

  // Get stored text from localStorage and parse it
  try {
    const storedData = JSON.parse(localStorage.getItem(code));
    if (storedData) {
      // Check if the data has expired
      if (Date.now() > storedData.expires) {
        window.alert("This code has expired");
        localStorage.removeItem(code); // Clean up expired data
        return;
      }

      // Display only the text content
      retrievedTextDiv.textContent = storedData.text;
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
  } catch (error) {
    console.error("Error parsing data:", error);
    window.alert("Error retrieving data");
  }
});

// Drag and Drop


// Update allowed file types
const allowedTypes = {
    'text/plain': 'Text',
    'application/json': 'JSON',
    'text/html': 'HTML',
    'text/css': 'CSS',
    'text/javascript': 'JavaScript',
    'image/jpeg': 'Image',
    'image/jpg': 'Image',
    'application/pdf': 'PDF'
};

function handleFile(file) {
  if (!file) return;
  
  console.log("File type:", file.type); // For debugging

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB');
      return;
  }

  if (!allowedTypes[file.type]) {
      alert('File type not supported. Please upload txt, json, html, css, js, jpg, or pdf files');
      fileInput.value = '';
      return;
  }

  // Handle different file types
  if (file.type.startsWith('text/') || file.type === 'application/json') {
      // Handle text files
      handleTextFile(file);
  } else if (file.type.startsWith('image/')) {
      // Handle images
      handleImageFile(file);
  } else if (file.type === 'application/pdf') {
      // Handle PDFs
      handlePdfFile(file);
  }
}

function handleTextFile(file) {
  const reader = new FileReader();
  uploadText.value = 'Loading file...';
  
  reader.onload = (e) => {
      uploadText.value = e.target.result;
      console.log('Text file loaded successfully');
  };

  reader.onerror = (error) => {
      console.error('Error reading file:', error);
      uploadText.value = '';
      alert('Error reading file. Please try again.');
  };

  reader.readAsText(file);
}

function handleImageFile(file) {
  const reader = new FileReader();
  uploadText.value = 'Loading image...';
  
  reader.onload = (e) => {
      // Store the base64 data
      const imageData = e.target.result;
      uploadText.value = imageData; // Store base64 string
      
      // Show preview
      showPreview(imageData, 'image');
  };

  reader.onerror = (error) => {
      console.error('Error reading image:', error);
      alert('Error reading image. Please try again.');
  };

  reader.readAsDataURL(file);
}

function handlePdfFile(file) {
  const reader = new FileReader();
  uploadText.value = 'Loading PDF...';
  
  reader.onload = (e) => {
      // Store the base64 data
      const pdfData = e.target.result;
      uploadText.value = pdfData; // Store base64 string
      
      // Show preview
      showPreview(pdfData, 'pdf');
  };

  reader.onerror = (error) => {
      console.error('Error reading PDF:', error);
      alert('Error reading PDF. Please try again.');
  };

  reader.readAsDataURL(file);
}

function showPreview(data, type) {
  // Create preview container if it doesn't exist
  let previewContainer = document.getElementById('preview-container');
  if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'preview-container';
      uploadText.parentNode.insertBefore(previewContainer, uploadText);
  }

  previewContainer.innerHTML = '';

  if (type === 'image') {
      const img = document.createElement('img');
      img.src = data;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '300px';
      previewContainer.appendChild(img);
  } else if (type === 'pdf') {
      const embed = document.createElement('embed');
      embed.src = data;
      embed.type = 'application/pdf';
      embed.style.width = '100%';
      embed.style.height = '300px';
      previewContainer.appendChild(embed);
  }
}