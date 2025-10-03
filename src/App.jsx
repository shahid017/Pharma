import { useState } from 'react'
import PrescriptionUploader from './components/PrescriptionUploader'
import ResultsDisplay from './components/ResultsDisplay'

function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleProcessPrescription = async (file) => {
    setLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : `https://${window.location.hostname.replace('-5000', '-8000')}`;

    try {
      const response = await fetch(`${apiUrl}/api/process-prescription`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to process prescription')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            Pharmacy Prescription Processor
          </h1>
          <p className="text-gray-600">
            Upload prescription images to extract and normalize medication instructions
          </p>
        </header>

        <PrescriptionUploader
          onProcess={handleProcessPrescription}
          loading={loading}
        />

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Processing Prescription</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Extracting prescription data...</p>
          </div>
        )}

        {results && !loading && <ResultsDisplay results={results} />}
      </div>
    </div>
  )
}

export default App
