import { Download, FileText, FileDown } from 'lucide-react';
import { Message } from '../ChatWindow';
import { useState } from 'react';
import jsPDF from 'jspdf';

const Export = ({
  message,
  initialMessage,
}: {
  message: Message;
  initialMessage: string;
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsMarkdown = () => {
    const content = `# Message Export

**Role:** ${message.role}
**Date:** ${message.createdAt.toLocaleString()}

## Content

${initialMessage}

${message.sources && message.sources.length > 0 ? `
## Sources

${message.sources.map((source: any, i: any) => `${i + 1}. [${source.metadata.url}](${source.metadata.url})`).join('\n')}
` : ''}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${message.messageId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Message Export', margin, 30);
      
      // Role and Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Role: ${message.role}`, margin, 45);
      doc.text(`Date: ${message.createdAt.toLocaleString()}`, margin, 55);
      
      // Content
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Content:', margin, 75);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Split content into lines that fit the page width
      const contentLines = doc.splitTextToSize(initialMessage, maxWidth);
      let yPosition = 85;
      
      contentLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
      
      // Sources
      if (message.sources && message.sources.length > 0) {
        yPosition += 10;
        if (yPosition > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sources:', margin, yPosition);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        yPosition += 10;
        
        message.sources.forEach((source: any, i: any) => {
          if (yPosition > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          const sourceText = `${i + 1}. ${source.metadata.url}`;
          const sourceLines = doc.splitTextToSize(sourceText, maxWidth);
          
          sourceLines.forEach((line: string) => {
            if (yPosition > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
          yPosition += 3;
        });
      }
      
      doc.save(`message-${message.messageId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to markdown if PDF generation fails
      exportAsMarkdown();
    } finally {
      setIsExporting(false);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
        disabled={isExporting}
      >
        {isExporting ? <FileDown size={18} className="animate-pulse" /> : <Download size={18} />}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
          <button
            onClick={() => {
              exportAsMarkdown();
              setShowDropdown(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
          >
            <FileText size={16} />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => {
              exportAsPDF();
              setShowDropdown(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-b-lg"
          >
            <FileDown size={16} />
            <span>PDF</span>
          </button>
        </div>
      )}
      
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default Export; 