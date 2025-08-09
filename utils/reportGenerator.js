const fs = require('fs');
const path = require('path');

class ReportGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../views/reports-pdf.ejs');
    }

    /**
     * Generate PDF report using puppeteer (requires puppeteer to be installed)
     * @param {Object} data - Chart data and summary
     * @param {string} period - Report period (daily, weekly, monthly)
     * @param {string} username - User's name
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generatePDFWithPuppeteer(data, period, username) {
        try {
            // This would require puppeteer to be installed
            // const puppeteer = require('puppeteer');
            
            // const browser = await puppeteer.launch();
            // const page = await browser.newPage();
            
            // // Generate HTML content
            // const htmlContent = this.generateHTMLContent(data, period, username);
            // await page.setContent(htmlContent);
            
            // // Generate PDF
            // const pdf = await page.pdf({
            //     format: 'A4',
            //     printBackground: true,
            //     margin: {
            //         top: '20mm',
            //         right: '20mm',
            //         bottom: '20mm',
            //         left: '20mm'
            //     }
            // });
            
            // await browser.close();
            // return pdf;
            
            throw new Error('Puppeteer not installed. Install with: npm install puppeteer');
        } catch (error) {
            console.error('Error generating PDF with puppeteer:', error);
            throw error;
        }
    }

    /**
     * Generate PDF report using html-pdf (requires html-pdf to be installed)
     * @param {Object} data - Chart data and summary
     * @param {string} period - Report period (daily, weekly, monthly)
     * @param {string} username - User's name
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generatePDFWithHtmlPdf(data, period, username) {
        try {
            // This would require html-pdf to be installed
            // const pdf = require('html-pdf');
            
            // const htmlContent = this.generateHTMLContent(data, period, username);
            
            // const options = {
            //     format: 'A4',
            //     border: {
            //         top: '20mm',
            //         right: '20mm',
            //         bottom: '20mm',
            //         left: '20mm'
            //     }
            // };
            
            // return new Promise((resolve, reject) => {
            //     pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            //         if (err) reject(err);
            //         else resolve(buffer);
            //     });
            // });
            
            throw new Error('html-pdf not installed. Install with: npm install html-pdf');
        } catch (error) {
            console.error('Error generating PDF with html-pdf:', error);
            throw error;
        }
    }

    /**
     * Generate HTML content for PDF
     * @param {Object} data - Chart data and summary
     * @param {string} period - Report period
     * @param {string} username - User's name
     * @returns {string} HTML content
     */
    generateHTMLContent(data, period, username) {
        const periodText = {
            daily: 'Today',
            weekly: 'Last 7 Days',
            monthly: 'Last 30 Days'
        };

        const chartData = JSON.parse(data.chartData);
        const labels = chartData.map(item => item.date).join(',');
        const values = chartData.map(item => item.count).join(',');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Productivity Report - ${periodText[period]}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .summary-item { text-align: center; flex: 1; }
        .chart { margin: 30px 0; }
        .insights { margin-top: 30px; }
        .footer { margin-top: 50px; text-align: center; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Smart Productivity Tracker</h1>
        <h2>Productivity Report</h2>
        <p><strong>${periodText[period]}</strong> | Generated for: ${username}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <h3>${data.summary.total_completed}</h3>
            <p>Total Completed</p>
        </div>
        <div class="summary-item">
            <h3>${data.summary.productive_days}</h3>
            <p>Productive Days</p>
        </div>
        <div class="summary-item">
            <h3>${data.summary.productive_days > 0 ? (data.summary.total_completed / data.summary.productive_days).toFixed(1) : '0'}</h3>
            <p>Avg. Per Day</p>
        </div>
        <div class="summary-item">
            <h3>${data.mostProductive.count}</h3>
            <p>Best Day</p>
        </div>
    </div>

    <div class="chart">
        <h3>Task Completion Trend</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Tasks Completed</th>
                </tr>
            </thead>
            <tbody>
                ${chartData.map(item => `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="insights">
        <h3>Productivity Insights</h3>
        <p>You completed <strong>${data.summary.total_completed}</strong> tasks ${period === 'daily' ? 'today' : period === 'weekly' ? 'in the last 7 days' : 'in the last 30 days'}.</p>
        ${data.summary.productive_days > 0 ? `
            <p>You were productive on <strong>${data.summary.productive_days}</strong> days, 
            averaging <strong>${(data.summary.total_completed / data.summary.productive_days).toFixed(1)}</strong> tasks per productive day.</p>
        ` : ''}
        ${data.mostProductive.date ? `
            <p>Your most productive day was <strong>${new Date(data.mostProductive.date).toLocaleDateString()}</strong> with <strong>${data.mostProductive.count}</strong> tasks completed.</p>
        ` : ''}
    </div>

    <div class="footer">
        <p>Generated by Smart Productivity Tracker</p>
        <p>Keep up the great work!</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Generate CSV report
     * @param {Object} data - Chart data and summary
     * @param {string} period - Report period
     * @returns {string} CSV content
     */
    generateCSV(data, period) {
        const chartData = JSON.parse(data.chartData);
        const periodText = {
            daily: 'Today',
            weekly: 'Last 7 Days',
            monthly: 'Last 30 Days'
        };

        let csv = `Productivity Report - ${periodText[period]}\n`;
        csv += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
        csv += `Summary:\n`;
        csv += `Total Completed,${data.summary.total_completed}\n`;
        csv += `Productive Days,${data.summary.productive_days}\n`;
        csv += `Average Per Day,${data.summary.productive_days > 0 ? (data.summary.total_completed / data.summary.productive_days).toFixed(1) : '0'}\n`;
        csv += `Best Day,${data.mostProductive.count}\n\n`;
        csv += `Daily Breakdown:\n`;
        csv += `Date,Tasks Completed\n`;
        
        chartData.forEach(item => {
            csv += `${item.date},${item.count}\n`;
        });

        return csv;
    }
}

module.exports = ReportGenerator; 