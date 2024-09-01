const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' }); // Set destination for uploaded files

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle file upload and OCR processing
app.post('/upload-aadhaar', upload.single('aadhaarImage'), (req, res) => {
    const filePath = req.file.path;
    // Process image using Tesseract.js
    Tesseract.recognize(
        filePath,
        'eng', // Language to use for OCR
        {
            logger: (m) => console.log(m), // Log OCR progress
        }
    )
        .then(({ data: { text } }) => {
            // Delete the file after processing
            fs.unlinkSync(filePath);

            // Parse the OCR output to extract name and Aadhaar number
            const nameMatch = text.match(/Name:\s*(.*)/i);
            const aadhaarMatch = text.match(/(\d{4}\s\d{4}\s\d{4})/);

            const name = nameMatch ? nameMatch[1] : 'Name not found';
            const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0] : 'Aadhaar number not found';

            // Return the extracted information as JSON
            res.json({
                name: name.trim(),
                aadhaarNumber: aadhaarNumber.trim(),
            });
        })
        .catch((error) => {
            console.error('Error processing image:', error);
            res.status(500).json({ error: 'Failed to process image' });
        });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});