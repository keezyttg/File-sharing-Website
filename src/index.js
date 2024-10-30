// src/index.js
import { db, storage } from "./firebase-config";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading
    ? "Loading..."
    : button.dataset.originalText || button.textContent;
}

// Add error handling function
function showError(message) {
  console.error(message);
  alert(message);
}

document.addEventListener("DOMContentLoaded", () => {
  const rateLimits = new Map();
  const toggleCheckbox = document.getElementById("toggle");
  const uploadSection = document.getElementById("uploadSection");
  const downloadSection = document.getElementById("downloadSection");
  const generate = document.getElementById("generate");
  const uploadText = document.getElementById("uploadText");
  const uploadResult = document.getElementById("uploadResult");
  const codeDisplay = document.querySelector(".code"); // Add this for the code display
  // Drag and Drop Variables
  const dropZone = document.getElementById("drop_zone");
  const fileInput = document.getElementById("fileInput");
  const inputgroup = document.getElementById("inputgroup");

  
  const performanceMetrics = {
    uploadTimes: [],
    downloadTimes: [],
    errors: [],
  };

  function trackPerformance(action, startTime) {
    const duration = Date.now() - startTime;

    if (action === "upload") {
      performanceMetrics.uploadTimes.push(duration);
      if (performanceMetrics.uploadTimes.length > 100) {
        performanceMetrics.uploadTimes.shift();
      }
    } else if (action === "download") {
      performanceMetrics.downloadTimes.push(duration);
      if (performanceMetrics.downloadTimes.length > 100) {
        performanceMetrics.downloadTimes.shift();
      }
    }

    // Log slow operations
    if (duration > 3000) {
      console.warn(`Slow ${action} operation detected: ${duration}ms`);
      logError(new Error(`Slow ${action} operation`), "performance");
    }
  }

 
  function checkRateLimit(action, limit = 5) {
    const now = Date.now();
    const key = `${action}`;

    // Get or create rate limit entry
    let limitEntry = rateLimits.get(key) || {
      count: 0,
      resetTime: now + 60000, // 1 minute window
    };

    // Reset if time window expired
    if (now > limitEntry.resetTime) {
      limitEntry = {
        count: 0,
        resetTime: now + 60000,
      };
    }

    // Check limit
    if (limitEntry.count >= limit) {
      throw new Error("Too many attempts. Please wait a minute and try again.");
    }

    // Increment counter
    limitEntry.count++;
    rateLimits.set(key, limitEntry);
    return true;
  }
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  });

  // Add drag and drop handlers if you have a drop zone
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");

      const file = e.dataTransfer.files[0];
      if (file) {
        fileInput.files = e.dataTransfer.files;
        handleFile(file);
      }
    });
  }
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
  generate.addEventListener("click", async () => {
    const startTime = Date.now();
    generate.dataset.originalText = generate.textContent;

    try {
      checkRateLimit("generate", 5); // Add rate limiting
      setLoading(generate, true);

      if (uploadText.value.trim() === "" && fileInput.files.length === 0) {
        throw new Error("You must input text or a file!");
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      let fileUrl = "";
      let fileMetadata = null;

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0]; // Fixed the typo here
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File too large. Maximum size is 5MB");
        }

        const metadata = {
          contentType: file.type,
          customMetadata: {
            uploadedAt: new Date().toISOString(),
            originalName: file.name,
            size: file.size,
          },
        };

        const storageRef = ref(storage, `uploads/${code}_${file.name}`);
        await uploadBytes(storageRef, file, metadata);
        fileUrl = await getDownloadURL(storageRef);
        console.log("File uploaded successfully:", fileUrl);

        fileMetadata = {
          contentType: file.type,
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          size: file.size,
        };
      }

      const data = {
        text: uploadText.value.trim(),
        fileUrl,
        expires: Date.now() + 24 * 60 * 60 * 1000,
        created: Date.now(),
        fileName: fileInput.files[0]?.name || null,
        ...(fileMetadata && { fileMetadata }),
      };

      await setDoc(doc(db, "uploads", code), data);

      codeDisplay.textContent = code;
      uploadResult.style.display = "block";
      uploadText.style.display = "none";
      inputgroup.style.display = "none";
      generate.textContent = "Generate New Code";

      trackPerformance("upload", startTime); // Track performance
    } catch (error) {
      performanceMetrics.errors.push({
        timestamp: Date.now(),
        error: error.message,
        context: "upload",
      });
      showError(error.message || "Error generating code. Please try again.");
    } finally {
      setLoading(generate, false);
    }
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
  retrieveButton.addEventListener("click", async () => {
    const startTime = Date.now();

    try {
      checkRateLimit("retrieve", 10);
      const code = accessCodeInput.value.trim().toUpperCase();

      if (!code) {
        window.alert("Please enter an access code!");
        return;
      }

      const docRef = doc(db, "uploads", code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const storedData = docSnap.data();

        if (Date.now() > storedData.expires) {
          window.alert("This code has expired");
          await deleteDoc(docRef);
          return;
        }

        retrievedTextDiv.textContent = storedData.text || "No text provided.\n";
        retrievedTextDiv.style.display = "block";

        if (storedData.fileUrl) {
          const link = document.createElement("a");
          link.href = storedData.fileUrl;
          link.textContent = `Download ${storedData.fileName || "File"}`;
          link.target = "_blank";
          retrievedTextDiv.appendChild(link);
        }

        const copyRetrievedButton = document.createElement("button");
        copyRetrievedButton.textContent = "Copy Text";
        copyRetrievedButton.className = "copy-button";

        const existingCopyButton = document.querySelector(
          "#downloadResult .copy-button"
        );
        if (existingCopyButton) {
          existingCopyButton.remove();
        }

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

        retrievedTextDiv.parentNode.appendChild(copyRetrievedButton);
        trackPerformance("download", startTime);
      } else {
        window.alert("Invalid code or expired data");
      }
    } catch (error) {
      performanceMetrics.errors.push({
        timestamp: Date.now(),
        error: error.message,
        context: "download",
      });
      showError(error.message || "Error retrieving data. Please try again.");
    }
  });

  // Drag and Drop

  // Update allowed file types
  const allowedTypes = {
    "text/plain": "Text",
    "application/json": "JSON",
    "text/html": "HTML",
    "text/css": "CSS",
    "text/javascript": "JavaScript",
    "image/jpeg": "Image",
    "image/jpg": "Image",
    "application/pdf": "PDF",
  };

  async function handleFile(file) {
    if (!file) return;

    try {
      console.log("File type:", file.type);

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 5MB");
      }

      if (!allowedTypes[file.type]) {
        throw new Error("File type not supported");
      }

      // Preview handling based on file type
      if (file.type.startsWith("text/")) {
        await handleTextFile(file);
      } else if (file.type.startsWith("image/")) {
        await handleImageFile(file);
      } else if (file.type === "application/pdf") {
        await handlePdfFile(file);
      }
    } catch (error) {
      showError(error.message);
      fileInput.value = "";
    }
  }

  function handleTextFile(file) {
    const reader = new FileReader();
    uploadText.value = "Loading file...";

    reader.onload = (e) => {
      uploadText.value = e.target.result;
      console.log("Text file loaded successfully");
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      uploadText.value = "";
      alert("Error reading file. Please try again.");
    };

    reader.readAsText(file);
  }

  function handleImageFile(file) {
    const reader = new FileReader();
    //uploadText.value = "Loading image...";

    reader.onload = (e) => {
      // Store the base64 data
      const imageData = e.target.result;
      //uploadText.value = "";
      //uploadText.value = imageData; // Store base64 string
      document.getElementById("hiddenImageData").value = imageData;
      // Show preview
      showPreview(imageData, "image");
    };

    reader.onerror = (error) => {
      console.error("Error reading image:", error);
      alert("Error reading image. Please try again.");
    };

    reader.readAsDataURL(file);
  }

  function handlePdfFile(file) {
    const reader = new FileReader();
    uploadText.value = "";

    reader.onload = (e) => {
      // Store the base64 data
      const pdfData = e.target.result;
      uploadText.value = pdfData; // Store base64 string
      document.getElementById("hiddenPdfData").value = pdfData;
      // Show preview
      showPreview(pdfData, "pdf");
    };

    reader.onerror = (error) => {
      console.error("Error reading PDF:", error);
      alert("Error reading PDF. Please try again.");
    };

    reader.readAsDataURL(file);
  }

  function showPreview(data, type) {
    // Create preview container if it doesn't exist
    let previewContainer = document.getElementById("preview-container");
    if (!previewContainer) {
      previewContainer = document.createElement("div");
      previewContainer.id = "preview-container";
      uploadText.parentNode.insertBefore(previewContainer, uploadText);
    }

    previewContainer.innerHTML = "";

    if (type === "image") {
      const img = document.createElement("img");
      img.src = data;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "300px";
      previewContainer.appendChild(img);
    } else if (type === "pdf") {
      const embed = document.createElement("embed");
      embed.src = data;
      embed.type = "application/pdf";
      embed.style.width = "100%";
      embed.style.height = "300px";
      previewContainer.appendChild(embed);
    }
  }
  // cleanup
  // Add this to your index.js
  async function cleanupExpiredUploads() {
    try {
      const now = Date.now();
      const uploadsRef = collection(db, "uploads");
      const q = query(uploadsRef, where("expires", "<=", now));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      if (!snapshot.empty) {
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} expired documents`);
      }
    } catch (error) {
      logError(error, "cleanupExpiredUploads");
    }
  }

  // Run cleanup periodically
  setInterval(cleanupExpiredUploads, 60 * 60 * 1000); // Every hour

  function logError(error, context = "") {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // In production, you might want to send this to your server or a logging service
    console.error("Error occurred:", errorInfo);
  }

  // Update your error handlers:
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    logError(error || new Error(msg), "window.onerror");
    return false;
  };

  window.addEventListener("unhandledrejection", function (event) {
    logError(event.reason, "unhandledrejection");
  });
});
