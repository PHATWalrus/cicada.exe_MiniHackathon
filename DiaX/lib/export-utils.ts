/**
 * Format the current date for use in filenames
 */
export function formatDateForFilename(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

/**
 * Export data as CSV
 * @param data Array of objects to export
 * @param filename Filename for the exported file
 */
export function exportAsCSV(data: any[], filename: string): void {
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error("No data to export")
  }

  try {
    // Get headers from the first object
    const headers = Object.keys(data[0])

    // Create CSV rows
    const csvRows = [
      // Header row
      headers.join(","),
      // Data rows
      ...data.map((row) => {
        return headers
          .map((header) => {
            // Handle special cases (commas, quotes, etc.)
            const cell = row[header]
            if (cell === null || cell === undefined) {
              return ""
            }

            const cellStr = String(cell)
            // Escape quotes and wrap in quotes if contains comma or newline
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`
            }
            return cellStr
          })
          .join(",")
      }),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting CSV:", error)
    throw new Error("Failed to export data as CSV")
  }
}

/**
 * Export data as JSON
 * @param data Object or array to export
 * @param filename Filename for the exported file
 */
export function exportAsJSON(data: any, filename: string): void {
  if (!data) {
    throw new Error("No data to export")
  }

  try {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting JSON:", error)
    throw new Error("Failed to export data as JSON")
  }
}
