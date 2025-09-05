const PdfPrinter = require('pdfmake');

// Define fonts properly for pdfmake
const fonts = {
  Roboto: {
    normal: Buffer.from(require('fs').readFileSync(require('path').join(__dirname, '../fonts/Roboto-Regular.ttf'))),
    bold: Buffer.from(require('fs').readFileSync(require('path').join(__dirname, '../fonts/Roboto-Bold.ttf'))),
    italics: Buffer.from(require('fs').readFileSync(require('path').join(__dirname, '../fonts/Roboto-Italic.ttf'))),
    bolditalics: Buffer.from(require('fs').readFileSync(require('path').join(__dirname, '../fonts/Roboto-BoldItalic.ttf')))
  }
};

// Fallback to system fonts if custom fonts are not available
const systemFonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

let printer;
try {
  printer = new PdfPrinter(fonts);
} catch (error) {
  console.log('Custom fonts not available, using system fonts');
  printer = new PdfPrinter(systemFonts);
}

const generateParcelLabel = (parcel) => {
  const docDefinition = {
    content: [
      {
        text: 'CourierPro Shipping Label',
        style: 'header',
        alignment: 'center'
      },
      {
        text: `Tracking: ${parcel.trackingNumber}`,
        style: 'subheader',
        alignment: 'center'
      },
      { text: ' ' },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'FROM:', style: 'sectionHeader' },
              { text: parcel.customer?.username || 'Customer', style: 'content' },
              { text: parcel.pickupAddress, style: 'content' },
              { text: ' ' },
              { text: 'PARCEL INFO:', style: 'sectionHeader' },
              { text: `Size: ${parcel.size}`, style: 'content' },
              { text: `Type: ${parcel.type}`, style: 'content' },
              { text: `Payment: ${parcel.paymentMethod}`, style: 'content' },
              parcel.codAmount > 0 ? { text: `COD: ৳${parcel.codAmount}`, style: 'content', color: '#f59e0b' } : null
            ].filter(Boolean)
          },
          {
            width: '50%',
            stack: [
              { text: 'TO:', style: 'sectionHeader' },
              { text: parcel.recipientName || 'Recipient', style: 'content' },
              { text: parcel.deliveryAddress, style: 'content' },
              { text: parcel.recipientPhone || '', style: 'content' },
              { text: ' ' },
              { text: 'STATUS:', style: 'sectionHeader' },
              { text: parcel.status, style: 'content' },
              { text: `Created: ${new Date(parcel.createdAt).toLocaleDateString()}`, style: 'content' }
            ]
          }
        ]
      },
      { text: ' ' },
      {
        text: 'Scan QR code for tracking',
        alignment: 'center',
        style: 'footer'
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, margin: [0, 0, 0, 20] },
      sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      content: { fontSize: 10, margin: [0, 2, 0, 2] },
      footer: { fontSize: 10, italics: true, margin: [0, 20, 0, 0] }
    },
    pageSize: 'A6',
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: fonts.Roboto ? 'Roboto' : 'Helvetica'
    }
  };

  return printer.createPdfKitDocument(docDefinition);
};

module.exports = { generateParcelLabel };