import React, { useState } from "react";
import { Upload, Download, AlertTriangle } from "lucide-react";
import plagiarismService from "../services/plagiarismService";

// Dummy plagiarism data
const dummyPlagiarismData = {
  percentage: '15%',
  flaggedSections: [
    {
      title: "Section 1",
      text: "This is a flagged section of the document that appears to be plagiarized.",
    },
    {
      title: "Section 2",
      text: "Another section that has been detected as potentially plagiarized content.",
    },
  ],
};

export default function PlagiarismChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<typeof dummyPlagiarismData | null>(
    null
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (file) {
        setIsChecking(true);
        const response = await plagiarismService.submitDocument(file);
        setResults({
          percentage: response?.percentage,
          flaggedSections: response?.flaggedSections?.map((section) => ({
            title: section.section_title,
            text: section.details,
          })),
        });
        setIsChecking(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownload = () => {
    // In a real application, this would generate and download a PDF report
    alert("Downloading report... (This is a placeholder action)");
  };

  return (
    <div className="bg-indigo-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-3xl text-center font-bold mb-6 text-gray-900">
          Plagiarism Checker
        </h1>

        <form onSubmit={handleSubmit} className="mb-8 flex flex-col">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300 ease-in-out"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-indigo-500" />
                <p className="mb-2 text-sm text-indigo-700">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-indigo-500">
                  PDF or Word Document (MAX. 10MB)
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
            </label>
          </div>
          {file && (
            <div className="mt-4">
              <p className="text-sm text-indigo-600">
                Selected file: {file.name}
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={!file || isChecking}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition duration-300 ease-in-out mx-auto"
          >
            {isChecking ? "Checking..." : "Check for Plagiarism"}
          </button>
        </form>

        {results && (
          <div className="bg-white border border-indigo-100 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Plagiarism Report
            </h2>
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                <span className="text-3xl font-bold text-indigo-600">
                  {results.percentage}
                </span>
              </div>
              <p className="text-lg text-gray-700">
                <span className="font-semibold">
                  Plagiarized Content Detected
                </span>
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Flagged Sections:
              </h3>
              {results.flaggedSections.map((section, index) => (
                <div
                  key={index}
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Section {index + 1}
                      </p>
                      <p className="mt-2 text-sm text-yellow-700">
                        " {section.title} {section.text}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Full Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
