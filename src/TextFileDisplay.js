import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';

function TextFileDisplay() {
  // State variables to manage data and user interactions
  const [textFilesData, setTextFilesData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1); // Index of the currently displayed note

  // Function to handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Function to handle file upload
  const handleUpload = async () => {
    if (selectedFile) {
      const reader = new FileReader();
      const fileType = selectedFile.name.endsWith('.json') ? 'json' : 'zip';

      reader.onload = async () => {
        const fileData = reader.result;
        if (fileType === 'zip') {
          // Parse ZIP file
          const zip = new JSZip();
          const zipData = await zip.loadAsync(fileData);
          const parsedData = await traverseFolders(zipData.files);
          setTextFilesData(parsedData);
          setCurrentIndex(0);
        } else if (fileType === 'json') {
          // Parse JSON file and update textFilesData
          try {
            const jsonData = JSON.parse(fileData);
            setTextFilesData(jsonData);
            setCurrentIndex(0);
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      };

      // Read the selected file as an ArrayBuffer
      if (fileType === 'zip') {
        reader.readAsArrayBuffer(selectedFile);
      }
      else if (fileType === 'json'){
        reader.readAsText(selectedFile);
      }
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

  const handleTag = () => {

  }

  const handleEdit = () => {

  }

  const handleDelete = () => {

  }


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

  // useEffect to update currentIndex when textFilesData changes
  useEffect(() => {
    if (textFilesData.length > 0) {
      setCurrentIndex(1);
    }
  }, [textFilesData]);

  // Determine if the previous and next notes can be displayed
  const canShowPrevious = currentIndex > 0;
  const canShowNext = currentIndex < textFilesData.length - 1;

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
              Confirm Upload
            </button>
          </div>
          <div>
            <div className="btn-group" role="group">
              {/* Button to navigate to the previous note */}
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={!canShowPrevious}
                type="button" className="btn btn-outline-primary mt-3"
              >
                Previous Note
              </button>
              {/* Button to navigate to the next note */}
              <button
                onClick={() => setCurrentIndex(Math.min(textFilesData.length - 1, currentIndex + 1))}
                disabled={!canShowNext}
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
                Save as JSON
              </button>
            </div>
          </div>
        </div>

        {textFilesData.length === 0 ? (
          <p>No data to display.</p>
        ) : (
          <div>
            {/* Display the previous note if available */}
            {canShowPrevious && (
              <div className="bg-light p-4 rounded">
                <pre id="note">{textFilesData[currentIndex - 1].content}</pre>
                <footer><h5>Title: {textFilesData[currentIndex - 1].title} </h5> </footer>
                <div className="btn-group" role="group">
                  <button onClick={handleTag} type="button" className="btn btn-outline-primary dropdown-toggle">Tag</button>
                  <button onClick={handleEdit} type="button" className="btn btn-outline-primary">Edit</button>
                  <button onClick={handleDelete} type="button" className="btn btn-outline-primary">Delete</button>
                </div>
                <hr />
              </div>
            )}
            {/* Display the current note */}
            <div className="bg-light p-4 rounded">
              <pre id="note">{textFilesData[currentIndex].content}</pre>
              <footer><h5>Title: {textFilesData[currentIndex].title} </h5> </footer>
              <div className="btn-group" role="group">
                <button onClick={handleTag} type="button" className="btn btn-outline-primary dropdown-toggle">Tag</button>
                <button onClick={handleEdit} type="button" className="btn btn-outline-primary">Edit</button>
                <button onClick={handleDelete} type="button" className="btn btn-outline-primary">Delete</button>
              </div>
              <hr />
            </div>
            {/* Display the next note if available */}
            {canShowNext && (
              <div className="bg-light p-4 rounded">
                <pre id="note">{textFilesData[currentIndex + 1].content}</pre>
                <footer><h5>Title: {textFilesData[currentIndex + 1].title} </h5> </footer>
                <div className="btn-group" role="group">
                  <button onClick={handleTag} type="button" className="btn btn-outline-primary dropdown-toggle">Tag</button>
                  <button onClick={handleEdit} type="button" className="btn btn-outline-primary">Edit</button>
                  <button onClick={handleDelete} type="button" className="btn btn-outline-primary">Delete</button>
                </div>
                <hr />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TextFileDisplay;
