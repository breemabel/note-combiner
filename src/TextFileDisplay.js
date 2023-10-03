import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';

function TextFileDisplay() {
  // State variables to manage data and user interactions
  const [textFilesData, setTextFilesData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Function to handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Function to handle file upload
  const handleUpload = async () => {
    if (selectedFile) {
      const reader = new FileReader();

      reader.onload = async () => {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(reader.result);

        // Call traverseFolders to parse the ZIP contents
        const parsedData = await traverseFolders(zipData.files);
        setTextFilesData(parsedData);
      };

      // Read the selected file as an ArrayBuffer
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  // Recursive function to traverse folders and collect text file data
  const traverseFolders = async (folder, path = '') => {
    const parsedData = [];
    var noteIndex = 0;

    for (const relativePath of Object.keys(folder)) {
      const file = folder[relativePath];
      if (file) {
        if (file.dir) {
          // If it's a directory, recursively traverse it
          const subParsedData = await traverseFolders(file, `${path}${relativePath}/`);
          parsedData.push(...subParsedData);
        } else if (relativePath.endsWith('.txt')) {
          // If it's a text file, read its content and store it
          const content = await file.async('text');
          const notebook = content.split('\n\n');
          notebook.forEach((element) => {
            if (element !== "") {
              parsedData.push({
                id: noteIndex++,
                title: relativePath,
                content: element,
                tags: [],
              });
            }
          });
        }
      }
    }

    return parsedData;
  };

  // Function to handle exporting textFilesData to JSON
  const handleExport = () => {
    // Convert the textFilesData to JSON format
    const jsonData = JSON.stringify(textFilesData, null, 2);
  
    // Create a Blob object containing the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
  
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'textFilesData.json';
  
    // Trigger a click event on the link element to initiate the download
    a.click();
  
    // Clean up by revoking the URL
    URL.revokeObjectURL(a.href);
  };

  // Update currentFileIndex when textFilesData changes
  useEffect(() => {
    if (textFilesData.length > 0) {
      setCurrentFileIndex(0);
    }
  }, [textFilesData]);

  return (
    <div className="d-flex flex-column justify-content-start align-items-center vh-100">
      <div className="container mt-4 mb-4">
        <h1 className="mb-3">iCloud Note Parser</h1>

        {/* Navigation buttons */}
        <div className="d-flex justify-content-between mb-3">
          <div>
            {/* File input for selecting a ZIP file */}
            <input type="file" onChange={handleFileChange} className="btn btn-secondary mt-3" />
            <br />
            {/* Button to initiate file upload */}
            <button onClick={handleUpload} className="btn btn-primary mt-3">
              Upload
            </button>
          </div>
          <div>
            <div className="btn-group" role="group">
              {/* Button to navigate to the previous note */}
              <button
                onClick={() => setCurrentFileIndex(Math.max(0, currentFileIndex - 1))}
                disabled={currentFileIndex === 0}
                type="button" className="btn btn-outline-primary mt-3"
              >
                Previous Note
              </button>
              {/* Button to navigate to the next note */}
              <button
                onClick={() => setCurrentFileIndex(Math.min(textFilesData.length - 1, currentFileIndex + 1))}
                disabled={currentFileIndex === textFilesData.length - 1}
                type="button" className="btn btn-outline-primary mt-3"
              >
                Next Note
              </button>
            </div>
            <br />
            <div className="btn-group" role="group">
              {/* Button to export textFilesData to JSON */}
              <button
                onClick={handleExport}
                type="button" className="btn btn-outline-primary mt-3"
              >
                Save
              </button>
              {/* Placeholder Edit button */}
              <button
                type="button" className="btn btn-outline-primary mt-3"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Render the current note */}
        {textFilesData.length === 0 ? (
          <p>No data to display.</p>
        ) : (
          <div className="bg-light p-4 rounded">
            {/* Display the content of the current note */}
            <pre id="note">{textFilesData[currentFileIndex].content}</pre>
            {/* Display the title of the current note */}
            <footer><h5>Title: {textFilesData[currentFileIndex].title} </h5> </footer>
          </div>
        )}
      </div>
    </div>
  );
}

export default TextFileDisplay;
