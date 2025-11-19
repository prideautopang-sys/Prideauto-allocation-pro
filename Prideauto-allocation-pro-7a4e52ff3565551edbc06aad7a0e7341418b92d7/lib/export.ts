// This file uses the SheetJS library (XLSX), which is loaded via a script tag in index.html.
// We declare XLSX as a global variable to inform TypeScript of its existence.
declare var XLSX: any;

/**
 * Converts an array of arrays into an XLSX file and triggers a download.
 * @param data The data to export, with the first inner array being the headers.
 * @param fileName The desired name for the downloaded file (without extension).
 */
export const exportToXLSX = (data: any[][], fileName: string) => {
  if (typeof XLSX === 'undefined') {
    alert('Could not export to XLSX. The required library is not available.');
    console.error('SheetJS (XLSX) library not found. Make sure it is loaded.');
    return;
  }
  
  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data'); // Use a generic sheet name
    
    // Trigger the file download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    alert('An error occurred while creating the Excel file.');
    console.error('Error during XLSX export:', error);
  }
};
