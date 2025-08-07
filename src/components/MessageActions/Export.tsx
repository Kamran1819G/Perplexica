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

  const formatMarkdownForPDF = (text: string): { content: string; isHeading: boolean; level?: number; isBold: boolean; isItalic: boolean }[] => {
    const lines = text.split('\n');
    const formattedLines: { content: string; isHeading: boolean; level?: number; isBold: boolean; isItalic: boolean }[] = [];
    
    lines.forEach(line => {
      // Handle headings
      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^(#{1,6})/)?.[1].length || 1;
        const content = line.replace(/^#{1,6}\s/, '');
        formattedLines.push({ content, isHeading: true, level, isBold: false, isItalic: false });
      }
      // Handle bold text
      else if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        parts.forEach((part, index) => {
          if (part) {
            formattedLines.push({ 
              content: part, 
              isHeading: false, 
              isBold: index % 2 === 1, 
              isItalic: false 
            });
          }
        });
      }
      // Handle italic text
      else if (line.includes('*') && !line.includes('**')) {
        const parts = line.split(/\*(.*?)\*/g);
        parts.forEach((part, index) => {
          if (part) {
            formattedLines.push({ 
              content: part, 
              isHeading: false, 
              isBold: false, 
              isItalic: index % 2 === 1 
            });
          }
        });
      }
      // Regular text
      else if (line.trim()) {
        formattedLines.push({ content: line, isHeading: false, isBold: false, isItalic: false });
      }
      // Empty line
      else {
        formattedLines.push({ content: '', isHeading: false, isBold: false, isItalic: false });
      }
    });
    
    return formattedLines;
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 25;
      
      // Perplexica Branding Header
      doc.setFillColor(36, 160, 237); // #24A0ED
      doc.rect(0, 0, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Perplexica', margin, 10);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered Search Engine', pageWidth - margin - 60, 10);
      
      yPosition = 35;
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Message Export', margin, yPosition);
      yPosition += 15;
      
      // Role and Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Role: ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Date: ${message.createdAt.toLocaleString()}`, margin, yPosition);
      yPosition += 15;
      
      // Content Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Content:', margin, yPosition);
      yPosition += 10;
      
      // Format and render content
      const formattedContent = formatMarkdownForPDF(initialMessage);
      
      formattedContent.forEach(({ content, isHeading, level, isBold, isItalic }) => {
        if (!content && !isHeading) {
          yPosition += 5; // Empty line spacing
          return;
        }
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Set font based on formatting
        if (isHeading) {
          const headingSizes = [16, 14, 12, 11, 10, 9];
          doc.setFontSize(headingSizes[Math.min((level || 1) - 1, 5)]);
          doc.setFont('helvetica', 'bold');
          yPosition += 5; // Extra spacing before headings
        } else {
          doc.setFontSize(10);
          if (isBold) {
            doc.setFont('helvetica', 'bold');
          } else if (isItalic) {
            doc.setFont('helvetica', 'italic');
          } else {
            doc.setFont('helvetica', 'normal');
          }
        }
        
        // Split long lines
        const lines = doc.splitTextToSize(content, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += isHeading ? 8 : 6;
        });
        
        if (isHeading) {
          yPosition += 3; // Extra spacing after headings
        }
      });
      
      // Sources
      if (message.sources && message.sources.length > 0) {
        yPosition += 15;
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sources:', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        message.sources.forEach((source: any, i: any) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          const title = source.metadata?.title || 'Untitled';
          const url = source.metadata?.url || '';
          
          // Source number and title
          doc.setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${title}`, margin, yPosition);
          yPosition += 6;
          
          // URL
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(36, 160, 237); // Blue color for URLs
          const urlLines = doc.splitTextToSize(url, maxWidth - 10);
          
          urlLines.forEach((line: string) => {
            if (yPosition > pageHeight - 40) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 10, yPosition);
            yPosition += 5;
          });
          
          doc.setTextColor(0, 0, 0); // Reset to black
          yPosition += 5;
        });
      }
      
      // Footer on each page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated by Perplexica - Page ${i} of ${totalPages}`, margin, pageHeight - 10);
        doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, pageHeight - 10);
      }
      
      doc.save(`perplexica-message-${message.messageId}.pdf`);
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
        <div className="absolute right-0 top-full mt-1 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg z-50 min-w-[140px]">
          <button
            onClick={() => {
              exportAsMarkdown();
              setShowDropdown(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-light-200 dark:hover:bg-dark-200 flex items-center space-x-2 rounded-t-lg transition-colors duration-200"
          >
            <FileText size={16} />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => {
              exportAsPDF();
              setShowDropdown(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-black dark:text-white hover:bg-light-200 dark:hover:bg-dark-200 flex items-center space-x-2 rounded-b-lg transition-colors duration-200"
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