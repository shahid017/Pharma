export default function ResultsDisplay({ results }) {
  if (!results || !results.success) return null

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-indigo-900 mb-6 text-center">
        Prescription Analysis Results
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-lg p-2">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Raw Extracted Data</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {results.raw_text}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 rounded-lg p-2">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Normalized Instructions</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {results.normalized_instructions}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 rounded-lg p-2">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Administration Time</h3>
          </div>
          <div className="space-y-2">
            {results.administration_time.map((time, index) => (
              <div
                key={index}
                className="bg-purple-50 rounded-lg p-3 border border-purple-200"
              >
                <p className="text-sm font-medium text-purple-900 capitalize">
                  {time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
